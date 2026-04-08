import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { chatCompletion, getApiKey, type AIProvider } from "@/lib/ai/provider";
import { formatCurrency, type Currency } from "@/lib/currency";
import { startOfMonth, endOfMonth, subMonths, format } from "date-fns";
import { z } from "zod";

const schema = z.object({
  amount: z.number().positive(),
  currency: z.enum(["USD", "JOD"]),
  description: z.string().min(1).max(500),
});

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const parsed = schema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { amount, currency, description } = parsed.data;

  // Get profile
  const { data: profile } = await supabase
    .from("profiles")
    .select("ai_provider, openai_api_key, anthropic_api_key, gemini_api_key, default_currency, exchange_rate")
    .eq("id", user.id)
    .single();

  if (!profile) {
    return NextResponse.json({ error: "Profile not found" }, { status: 404 });
  }

  const provider = (profile.ai_provider || "openai") as AIProvider;
  const apiKey = getApiKey(provider, profile);

  if (!apiKey) {
    return NextResponse.json(
      { error: "No API key configured. Add one in Settings → AI Assistant." },
      { status: 400 }
    );
  }

  const defaultCurrency = (profile.default_currency || "USD") as Currency;
  const exchangeRate = profile.exchange_rate || 0.709;

  function toDefault(amt: number, cur: string): number {
    if (cur === defaultCurrency) return amt;
    if (defaultCurrency === "JOD") return amt * exchangeRate;
    return amt / exchangeRate;
  }

  const now = new Date();
  const monthStart = format(startOfMonth(now), "yyyy-MM-dd");
  const monthEnd = format(endOfMonth(now), "yyyy-MM-dd");

  // Gather financial context
  const [
    { data: thisMonthTx },
    { data: budget },
    { data: activeSubs },
    { data: last3MonthsIncome },
  ] = await Promise.all([
    supabase
      .from("transactions")
      .select("type, amount, currency")
      .eq("user_id", user.id)
      .gte("date", monthStart)
      .lte("date", monthEnd),
    supabase
      .from("budgets")
      .select("amount, currency")
      .eq("user_id", user.id)
      .is("category_id", null)
      .maybeSingle(),
    supabase
      .from("subscriptions")
      .select("name, amount, currency, next_billing_date")
      .eq("user_id", user.id)
      .eq("status", "active")
      .gte("next_billing_date", format(now, "yyyy-MM-dd"))
      .lte("next_billing_date", monthEnd),
    supabase
      .from("transactions")
      .select("amount, currency")
      .eq("user_id", user.id)
      .eq("type", "income")
      .gte("date", format(startOfMonth(subMonths(now, 3)), "yyyy-MM-dd"))
      .lte("date", monthEnd),
  ]);

  // Calculate totals
  let monthIncome = 0;
  let monthExpenses = 0;
  for (const t of thisMonthTx || []) {
    const c = toDefault(t.amount, t.currency);
    if (t.type === "income") monthIncome += c;
    else monthExpenses += c;
  }

  const avgMonthlyIncome =
    (last3MonthsIncome || []).reduce((s, t) => s + toDefault(t.amount, t.currency), 0) / 3;

  let upcomingSubsCost = 0;
  const subsList = (activeSubs || []).map((s) => {
    const c = toDefault(s.amount, s.currency);
    upcomingSubsCost += c;
    return `${s.name}: ${formatCurrency(c, defaultCurrency)} on ${s.next_billing_date}`;
  });

  const budgetLimit = budget ? toDefault(budget.amount, budget.currency) : null;
  const spendAmount = toDefault(amount, currency);

  const context = `
Current month financial summary (in ${defaultCurrency}):
- Income this month: ${formatCurrency(monthIncome, defaultCurrency)}
- Expenses this month: ${formatCurrency(monthExpenses, defaultCurrency)}
- Net this month: ${formatCurrency(monthIncome - monthExpenses, defaultCurrency)}
${budgetLimit ? `- Monthly budget: ${formatCurrency(budgetLimit, defaultCurrency)} (${Math.round((monthExpenses / budgetLimit) * 100)}% used)` : "- No monthly budget set"}
- Average monthly income (last 3 months): ${formatCurrency(avgMonthlyIncome, defaultCurrency)}
${subsList.length > 0 ? `- Upcoming subscriptions this month:\n  ${subsList.join("\n  ")}` : "- No upcoming subscriptions this month"}
- Total upcoming subscription cost: ${formatCurrency(upcomingSubsCost, defaultCurrency)}
- Remaining after expenses + upcoming subs: ${formatCurrency(monthIncome - monthExpenses - upcomingSubsCost, defaultCurrency)}

The user wants to spend: ${formatCurrency(spendAmount, defaultCurrency)} on "${description}"
`.trim();

  try {
    const advice = await chatCompletion(provider, apiKey, [
      {
        role: "system",
        content: `You are a practical personal financial advisor. The user is asking if they can afford a purchase. Analyze their financial situation and give clear, direct advice.

Respond with a JSON object (no markdown):
{
  "safe": true/false,
  "level": "green" | "yellow" | "red",
  "advice": "Your 2-3 sentence advice here. Be specific about the numbers."
}

- "green": clearly affordable, well within means
- "yellow": technically possible but will stretch the budget
- "red": not advisable given current finances`,
      },
      { role: "user", content: context },
    ], { temperature: 0.3, maxTokens: 300 });

    const cleaned = advice.replace(/```json\n?|\n?```/g, "").trim();
    const result = JSON.parse(cleaned);

    return NextResponse.json({
      safe: result.safe,
      level: result.level || (result.safe ? "green" : "red"),
      advice: result.advice,
    });
  } catch (err) {
    return NextResponse.json(
      { error: `AI error: ${err instanceof Error ? err.message : "Unknown error"}` },
      { status: 500 }
    );
  }
}
