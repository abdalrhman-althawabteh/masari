import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { startOfMonth, endOfMonth, subMonths, format } from "date-fns";
import { sendEmail } from "@/lib/email/send";
import { buildEmailHtml, formatMoneyHtml, progressBarHtml } from "@/lib/email/template";
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
  // Report on LAST month (runs on 1st of new month)
  const reportMonth = subMonths(now, 1);
  const monthStart = format(startOfMonth(reportMonth), "yyyy-MM-dd");
  const monthEnd = format(endOfMonth(reportMonth), "yyyy-MM-dd");
  const prevMonthStart = format(startOfMonth(subMonths(reportMonth, 1)), "yyyy-MM-dd");
  const prevMonthEnd = format(endOfMonth(subMonths(reportMonth, 1)), "yyyy-MM-dd");
  const monthLabel = format(reportMonth, "MMMM yyyy");

  const { data: profiles } = await supabase.from("profiles").select("*");
  const results = { sent: 0, failed: 0, skipped: 0 };

  for (const profile of profiles || []) {
    try {
      const curr = profile.default_currency || "USD";
      const exchangeRate = profile.exchange_rate || 0.709;

      function toDefault(amount: number, currency: string): number {
        if (currency === curr) return amount;
        if (curr === "JOD") return amount * exchangeRate;
        return amount / exchangeRate;
      }

      // This month's transactions
      const { data: monthTx } = await supabase
        .from("transactions")
        .select("type, amount, currency, category_id, categories!inner(name, icon)")
        .eq("user_id", profile.id)
        .gte("date", monthStart)
        .lte("date", monthEnd);

      // Previous month
      const { data: prevMonthTx } = await supabase
        .from("transactions")
        .select("type, amount, currency, category_id, categories!inner(name)")
        .eq("user_id", profile.id)
        .gte("date", prevMonthStart)
        .lte("date", prevMonthEnd);

      if ((monthTx || []).length === 0) {
        results.skipped++;
        continue;
      }

      let income = 0, expenses = 0;
      const categoryTotals: Record<string, { name: string; icon: string; total: number }> = {};

      for (const t of monthTx || []) {
        const c = toDefault(t.amount, t.currency);
        if (t.type === "income") income += c;
        else {
          expenses += c;
          const cat = t.categories as unknown as { name: string; icon: string };
          if (!categoryTotals[t.category_id]) categoryTotals[t.category_id] = { name: cat.name, icon: cat.icon || "📁", total: 0 };
          categoryTotals[t.category_id].total += c;
        }
      }

      let prevIncome = 0, prevExpenses = 0;
      const prevCategoryTotals: Record<string, number> = {};
      for (const t of prevMonthTx || []) {
        const c = toDefault(t.amount, t.currency);
        if (t.type === "income") prevIncome += c;
        else {
          prevExpenses += c;
          prevCategoryTotals[t.category_id] = (prevCategoryTotals[t.category_id] || 0) + c;
        }
      }

      // Budget adherence
      const { data: budgets } = await supabase
        .from("budgets")
        .select("amount, currency, category_id, categories(name)")
        .eq("user_id", profile.id);

      let budgetSections = "";
      let withinBudgetCount = 0;
      let totalBudgets = 0;

      for (const b of budgets || []) {
        const budgetAmt = toDefault(b.amount, b.currency);
        const spent = b.category_id
          ? categoryTotals[b.category_id]?.total || 0
          : expenses;
        const pct = budgetAmt > 0 ? Math.round((spent / budgetAmt) * 100) : 0;
        const label = b.category_id
          ? (b.categories as unknown as { name: string })?.name || "Category"
          : "Overall";

        totalBudgets++;
        if (pct <= 100) withinBudgetCount++;

        budgetSections += `
          <div style="margin-bottom: 12px;">
            <div style="display: flex; justify-content: space-between; margin-bottom: 2px;">
              <span style="color: #ccc; font-size: 13px;">${label}</span>
              <span style="color: ${pct >= 100 ? "#FF4444" : pct >= 80 ? "#FF8A00" : "#A3FF3C"}; font-size: 13px; font-weight: 600;">${pct}%</span>
            </div>
            ${progressBarHtml(pct)}
          </div>`;
      }

      // Subscriptions total
      const { data: subs } = await supabase
        .from("subscriptions")
        .select("name, amount, currency, billing_cycle")
        .eq("user_id", profile.id)
        .eq("status", "active");

      let monthlySubCost = 0;
      const subLines: string[] = [];
      for (const s of subs || []) {
        let monthly = toDefault(s.amount, s.currency);
        if (s.billing_cycle === "yearly") monthly /= 12;
        if (s.billing_cycle === "weekly") monthly *= 4.33;
        monthlySubCost += monthly;
        subLines.push(`${s.name}: ${fmtText(toDefault(s.amount, s.currency), curr)}/${s.billing_cycle}`);
      }

      // Top categories with month-over-month comparison
      const topCats = Object.entries(categoryTotals)
        .sort(([, a], [, b]) => b.total - a.total)
        .slice(0, 6);

      const categoriesHtml = topCats
        .map(([id, cat]) => {
          const prev = prevCategoryTotals[id] || 0;
          const change = prev > 0 ? Math.round(((cat.total - prev) / prev) * 100) : 0;
          const changeStr = prev > 0
            ? `<span style="color: ${change > 0 ? "#FF4444" : "#A3FF3C"}; font-size: 11px;"> ${change > 0 ? "↑" : "↓"}${Math.abs(change)}%</span>`
            : "";
          return `<div style="padding: 6px 0; border-bottom: 1px solid #1f1f1f;">
            <span>${cat.icon} ${cat.name}</span>${changeStr}
            <span style="float: right; font-weight: 600;">${fmtText(cat.total, curr)}</span>
          </div>`;
        })
        .join("");

      const fmtMoney = (n: number, color?: string) => formatMoneyHtml(n, curr, color);

      // AI advice
      let aiAdvice = "";
      const apiKey = getApiKey((profile.ai_provider || "openai") as AIProvider, profile);
      if (apiKey) {
        try {
          aiAdvice = await chatCompletion(
            (profile.ai_provider || "openai") as AIProvider,
            apiKey,
            [
              { role: "system", content: "You are a personal financial advisor. Give 2-3 practical, specific recommendations based on the monthly financial data. Be direct, use the actual numbers." },
              {
                role: "user",
                content: `Monthly report for ${monthLabel}:
Income: ${income.toFixed(2)} ${curr} (prev month: ${prevIncome.toFixed(2)})
Expenses: ${expenses.toFixed(2)} ${curr} (prev month: ${prevExpenses.toFixed(2)})
Top categories: ${topCats.map(([, c]) => `${c.name}: ${c.total.toFixed(2)}`).join(", ")}
Active subscriptions total: ${monthlySubCost.toFixed(2)} ${curr}/month
${totalBudgets > 0 ? `Budget adherence: ${withinBudgetCount}/${totalBudgets} within budget` : "No budgets set"}`,
              },
            ],
            { temperature: 0.5, maxTokens: 250 }
          );
        } catch { /* skip */ }
      }

      const subject = `Masari Monthly Report — ${monthLabel}`;

      const html = buildEmailHtml({
        title: subject,
        preheader: `${monthLabel}: ${fmtText(income, curr)} income, ${fmtText(expenses, curr)} expenses`,
        greeting: `Monthly Report — ${monthLabel}`,
        sections: [
          {
            heading: "Income vs Expenses",
            content: `
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-top: 8px;">
                <tr><td style="color: #888; padding: 8px 0;">Income</td><td align="right">${fmtMoney(income, "#A3FF3C")}</td></tr>
                <tr><td style="color: #888; padding: 8px 0;">Expenses</td><td align="right">${fmtMoney(expenses, "#FF4444")}</td></tr>
                <tr><td style="color: #888; padding: 8px 0;">Subscriptions (monthly)</td><td align="right">${fmtMoney(monthlySubCost, "#FF8A00")}</td></tr>
                <tr style="border-top: 2px solid #2a2a2a;"><td style="color: #ccc; padding: 10px 0; font-weight: 700;">Net</td><td align="right" style="font-size: 18px;">${fmtMoney(income - expenses, income >= expenses ? "#A3FF3C" : "#FF4444")}</td></tr>
              </table>
              <p style="color: #666; font-size: 12px; margin-top: 8px;">
                vs ${format(subMonths(reportMonth, 1), "MMMM")}: income ${income > prevIncome ? "↑" : "↓"} ${prevIncome > 0 ? Math.abs(Math.round(((income - prevIncome) / prevIncome) * 100)) : 0}%, expenses ${expenses > prevExpenses ? "↑" : "↓"} ${prevExpenses > 0 ? Math.abs(Math.round(((expenses - prevExpenses) / prevExpenses) * 100)) : 0}%
              </p>
            `,
          },
          ...(categoriesHtml
            ? [{ heading: "Spending by Category", content: categoriesHtml }]
            : []),
          ...(budgetSections
            ? [{
                heading: `Budget Adherence (${withinBudgetCount}/${totalBudgets} on track)`,
                content: budgetSections,
              }]
            : []),
          ...(subLines.length > 0
            ? [{
                heading: `Active Subscriptions (${fmtText(monthlySubCost, curr)}/mo)`,
                content: subLines.map((l) => `<div style="padding: 3px 0; color: #ccc; font-size: 13px;">• ${l}</div>`).join(""),
              }]
            : []),
          ...(aiAdvice
            ? [{
                heading: "🤖 AI Financial Advice",
                content: `<div style="background: #1a1a1a; border-left: 3px solid #A3FF3C; padding: 14px 16px; border-radius: 0 8px 8px 0; white-space: pre-line;">${aiAdvice}</div>`,
              }]
            : []),
        ],
      });

      const result = await sendEmail(profile.email, subject, html);

      await supabase.from("reports_log").insert({
        user_id: profile.id,
        type: "monthly",
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
        type: "monthly",
        email_subject: `Monthly Report (failed)`,
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
