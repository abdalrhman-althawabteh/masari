import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { startOfWeek, endOfWeek, subWeeks, format } from "date-fns";
import { sendEmail } from "@/lib/email/send";
import { buildEmailHtml, formatMoneyHtml, statRowHtml } from "@/lib/email/template";
import { chatCompletion, getApiKey, type AIProvider } from "@/lib/ai/provider";
import type { Database } from "@/types/database";

function createAdminClient() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function POST(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (!process.env.CRON_SECRET || authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createAdminClient();
  const now = new Date();
  const weekStart = format(startOfWeek(now, { weekStartsOn: 1 }), "yyyy-MM-dd");
  const weekEnd = format(endOfWeek(now, { weekStartsOn: 1 }), "yyyy-MM-dd");
  const prevWeekStart = format(startOfWeek(subWeeks(now, 1), { weekStartsOn: 1 }), "yyyy-MM-dd");
  const prevWeekEnd = format(endOfWeek(subWeeks(now, 1), { weekStartsOn: 1 }), "yyyy-MM-dd");

  // Get all users
  const { data: profiles } = await supabase
    .from("profiles")
    .select("*");

  const results = { sent: 0, failed: 0, skipped: 0 };

  for (const profile of profiles || []) {
    try {
      const defaultCurrency = profile.default_currency || "USD";
      const exchangeRate = profile.exchange_rate || 0.709;

      function toDefault(amount: number, currency: string): number {
        if (currency === defaultCurrency) return amount;
        if (defaultCurrency === "JOD") return amount * exchangeRate;
        return amount / exchangeRate;
      }

      // This week's transactions
      const { data: weekTx } = await supabase
        .from("transactions")
        .select("type, amount, currency, category_id, categories!inner(name, icon)")
        .eq("user_id", profile.id)
        .gte("date", weekStart)
        .lte("date", weekEnd);

      // Previous week's transactions
      const { data: prevWeekTx } = await supabase
        .from("transactions")
        .select("type, amount, currency")
        .eq("user_id", profile.id)
        .gte("date", prevWeekStart)
        .lte("date", prevWeekEnd);

      let income = 0, expenses = 0;
      const categoryTotals: Record<string, { name: string; icon: string; total: number }> = {};

      for (const t of weekTx || []) {
        const c = toDefault(t.amount, t.currency);
        if (t.type === "income") income += c;
        else {
          expenses += c;
          const cat = t.categories as unknown as { name: string; icon: string };
          const key = t.category_id;
          if (!categoryTotals[key]) categoryTotals[key] = { name: cat.name, icon: cat.icon || "📁", total: 0 };
          categoryTotals[key].total += c;
        }
      }

      let prevIncome = 0, prevExpenses = 0;
      for (const t of prevWeekTx || []) {
        const c = toDefault(t.amount, t.currency);
        if (t.type === "income") prevIncome += c;
        else prevExpenses += c;
      }

      // Skip if no transactions this week
      if ((weekTx || []).length === 0) {
        results.skipped++;
        continue;
      }

      const topCategories = Object.values(categoryTotals)
        .sort((a, b) => b.total - a.total)
        .slice(0, 3);

      const curr = defaultCurrency;
      const fmtMoney = (n: number, color?: string) => formatMoneyHtml(n, curr, color);

      // AI insight (if user has API key)
      let aiInsight = "";
      const apiKey = getApiKey((profile.ai_provider || "openai") as AIProvider, profile);
      if (apiKey) {
        try {
          aiInsight = await chatCompletion(
            (profile.ai_provider || "openai") as AIProvider,
            apiKey,
            [
              { role: "system", content: "You are a financial advisor. Give one short, actionable insight (1-2 sentences) based on this week's spending data. Be direct." },
              { role: "user", content: `Income: ${income} ${curr}, Expenses: ${expenses} ${curr}. Last week: income ${prevIncome}, expenses ${prevExpenses}. Top categories: ${topCategories.map(c => `${c.name}: ${c.total}`).join(", ")}` },
            ],
            { temperature: 0.5, maxTokens: 100 }
          );
        } catch { /* skip AI if it fails */ }
      }

      const subject = `Masari Weekly: ${format(now, "MMM d")} — ${fmtText(income, curr)} in, ${fmtText(expenses, curr)} out`;

      const html = buildEmailHtml({
        title: "Weekly Report",
        preheader: `This week: ${fmtText(income, curr)} income, ${fmtText(expenses, curr)} expenses`,
        greeting: `Weekly Update — ${format(now, "MMMM d, yyyy")}`,
        sections: [
          {
            heading: "This Week's Summary",
            content: `
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-top: 8px;">
                <tr><td style="color: #888; padding: 6px 0;">Income</td><td align="right">${fmtMoney(income, "#A3FF3C")}</td></tr>
                <tr><td style="color: #888; padding: 6px 0;">Expenses</td><td align="right">${fmtMoney(expenses, "#FF4444")}</td></tr>
                <tr style="border-top: 1px solid #2a2a2a;"><td style="color: #888; padding: 8px 0; font-weight: 600;">Net</td><td align="right">${fmtMoney(income - expenses, income >= expenses ? "#A3FF3C" : "#FF4444")}</td></tr>
              </table>
              ${prevExpenses > 0 ? `<p style="color: #888; font-size: 12px; margin-top: 12px;">vs last week: expenses ${expenses > prevExpenses ? "↑" : "↓"} ${Math.abs(Math.round(((expenses - prevExpenses) / prevExpenses) * 100))}%</p>` : ""}
            `,
          },
          ...(topCategories.length > 0
            ? [{
                heading: "Top Spending Categories",
                content: topCategories
                  .map((c) => `<div style="padding: 4px 0;">${c.icon} ${c.name}: ${fmtMoney(c.total)}</div>`)
                  .join(""),
              }]
            : []),
          ...(aiInsight
            ? [{
                heading: "💡 AI Insight",
                content: `<div style="background: #1a1a1a; border-left: 3px solid #A3FF3C; padding: 12px 16px; border-radius: 0 8px 8px 0; font-style: italic;">${aiInsight}</div>`,
              }]
            : []),
        ],
      });

      const result = await sendEmail(profile.email, subject, html);

      await supabase.from("reports_log").insert({
        user_id: profile.id,
        type: "weekly",
        email_subject: subject,
        status: result.success ? "sent" : "failed",
        error_message: result.error || null,
      });

      if (result.success) results.sent++;
      else results.failed++;
    } catch (err) {
      results.failed++;
      await supabase.from("reports_log").insert({
        user_id: profile.id,
        type: "weekly",
        email_subject: "Weekly Report (failed)",
        status: "failed",
        error_message: err instanceof Error ? err.message : "Unknown",
      });
    }
  }

  return NextResponse.json({ success: true, ...results });
}

function fmtText(amount: number, currency: string): string {
  return currency === "USD" ? `$${amount.toFixed(2)}` : `${amount.toFixed(2)} JOD`;
}
