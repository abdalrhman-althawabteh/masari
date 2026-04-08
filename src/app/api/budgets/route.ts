import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { budgetSchema } from "@/lib/validations/budget";
import { startOfMonth, endOfMonth, format } from "date-fns";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Get budgets with category info
  const { data: budgets, error } = await supabase
    .from("budgets")
    .select("*, categories(name, icon)")
    .eq("user_id", user.id)
    .order("created_at");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Get user profile for currency conversion
  const { data: profile } = await supabase
    .from("profiles")
    .select("default_currency, exchange_rate")
    .eq("id", user.id)
    .single();

  const defaultCurrency = profile?.default_currency || "USD";
  const exchangeRate = profile?.exchange_rate || 0.709;

  // Get this month's spending per category
  const now = new Date();
  const monthStart = format(startOfMonth(now), "yyyy-MM-dd");
  const monthEnd = format(endOfMonth(now), "yyyy-MM-dd");

  const { data: transactions } = await supabase
    .from("transactions")
    .select("amount, currency, category_id")
    .eq("user_id", user.id)
    .eq("type", "expense")
    .gte("date", monthStart)
    .lte("date", monthEnd);

  function toDefault(amount: number, currency: string): number {
    if (currency === defaultCurrency) return amount;
    if (defaultCurrency === "JOD") return amount * exchangeRate;
    return amount / exchangeRate;
  }

  // Calculate spending by category
  const spendingByCategory: Record<string, number> = {};
  let totalSpending = 0;
  for (const t of transactions || []) {
    const converted = toDefault(t.amount, t.currency);
    totalSpending += converted;
    if (!spendingByCategory[t.category_id]) {
      spendingByCategory[t.category_id] = 0;
    }
    spendingByCategory[t.category_id] += converted;
  }

  // Enrich budgets with spent amounts
  const enriched = (budgets || []).map((b) => {
    const budgetAmount = toDefault(b.amount, b.currency);
    const spent = b.category_id
      ? spendingByCategory[b.category_id] || 0
      : totalSpending;
    return {
      ...b,
      budget_converted: Math.round(budgetAmount * 100) / 100,
      spent: Math.round(spent * 100) / 100,
      percentage: budgetAmount > 0 ? Math.round((spent / budgetAmount) * 100) : 0,
    };
  });

  return NextResponse.json({
    budgets: enriched,
    currency: defaultCurrency,
    totalSpending: Math.round(totalSpending * 100) / 100,
  });
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const parsed = budgetSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  // Check for duplicate budget (same user + category)
  let existingQuery = supabase
    .from("budgets")
    .select("id")
    .eq("user_id", user.id);

  if (parsed.data.category_id) {
    existingQuery = existingQuery.eq("category_id", parsed.data.category_id);
  } else {
    existingQuery = existingQuery.is("category_id", null);
  }

  const { data: existing } = await existingQuery.maybeSingle();

  if (existing) {
    // Update existing budget instead
    const { data, error } = await supabase
      .from("budgets")
      .update({
        amount: parsed.data.amount,
        currency: parsed.data.currency,
        period: parsed.data.period,
      })
      .eq("id", existing.id)
      .select("*, categories(name, icon)")
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json(data);
  }

  const { data, error } = await supabase
    .from("budgets")
    .insert({
      user_id: user.id,
      category_id: parsed.data.category_id || null,
      amount: parsed.data.amount,
      currency: parsed.data.currency,
      period: parsed.data.period,
    })
    .select("*, categories(name, icon)")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}
