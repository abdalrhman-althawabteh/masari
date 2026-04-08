import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { startOfMonth, endOfMonth, subMonths, addDays, format } from "date-fns";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Get user profile for exchange rate
  const { data: profile } = await supabase
    .from("profiles")
    .select("default_currency, exchange_rate")
    .eq("id", user.id)
    .single();

  const defaultCurrency = profile?.default_currency || "USD";
  const exchangeRate = profile?.exchange_rate || 0.709;

  const now = new Date();
  const monthStart = format(startOfMonth(now), "yyyy-MM-dd");
  const monthEnd = format(endOfMonth(now), "yyyy-MM-dd");
  const prevMonthStart = format(startOfMonth(subMonths(now, 1)), "yyyy-MM-dd");
  const prevMonthEnd = format(endOfMonth(subMonths(now, 1)), "yyyy-MM-dd");

  // Current month transactions
  const { data: currentMonth } = await supabase
    .from("transactions")
    .select("type, amount, currency, category_id, categories!inner(name, icon)")
    .eq("user_id", user.id)
    .gte("date", monthStart)
    .lte("date", monthEnd);

  // Previous month transactions
  const { data: prevMonth } = await supabase
    .from("transactions")
    .select("type, amount, currency")
    .eq("user_id", user.id)
    .gte("date", prevMonthStart)
    .lte("date", prevMonthEnd);

  // Recent transactions
  const { data: recent } = await supabase
    .from("transactions")
    .select("*, categories!inner(name, icon, type)")
    .eq("user_id", user.id)
    .order("date", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(10);

  // Last 6 months data for chart
  const sixMonthsAgo = format(startOfMonth(subMonths(now, 5)), "yyyy-MM-dd");
  const { data: chartData } = await supabase
    .from("transactions")
    .select("type, amount, currency, date")
    .eq("user_id", user.id)
    .gte("date", sixMonthsAgo)
    .lte("date", monthEnd);

  // Helper to convert to default currency
  function toDefault(amount: number, currency: string): number {
    if (currency === defaultCurrency) return amount;
    if (defaultCurrency === "JOD") return amount * exchangeRate; // USD to JOD
    return amount / exchangeRate; // JOD to USD
  }

  // Calculate current month totals
  let income = 0;
  let expenses = 0;
  const categoryTotals: Record<string, { name: string; icon: string; total: number }> = {};

  for (const t of currentMonth || []) {
    const converted = toDefault(t.amount, t.currency);
    if (t.type === "income") {
      income += converted;
    } else {
      expenses += converted;
      const cat = t.categories as unknown as { name: string; icon: string };
      const key = t.category_id;
      if (!categoryTotals[key]) {
        categoryTotals[key] = { name: cat.name, icon: cat.icon || "📁", total: 0 };
      }
      categoryTotals[key].total += converted;
    }
  }

  // Previous month totals
  let prevIncome = 0;
  let prevExpenses = 0;
  for (const t of prevMonth || []) {
    const converted = toDefault(t.amount, t.currency);
    if (t.type === "income") prevIncome += converted;
    else prevExpenses += converted;
  }

  // Monthly chart data
  const monthlyData: Record<string, { income: number; expense: number }> = {};
  for (let i = 5; i >= 0; i--) {
    const m = subMonths(now, i);
    const key = format(m, "yyyy-MM");
    monthlyData[key] = { income: 0, expense: 0 };
  }
  for (const t of chartData || []) {
    const key = t.date.substring(0, 7);
    if (monthlyData[key]) {
      const converted = toDefault(t.amount, t.currency);
      if (t.type === "income") monthlyData[key].income += converted;
      else monthlyData[key].expense += converted;
    }
  }

  // Category breakdown (top 6)
  const categoryBreakdown = Object.values(categoryTotals)
    .sort((a, b) => b.total - a.total)
    .slice(0, 6);

  const chartArray = Object.entries(monthlyData).map(([month, data]) => ({
    month: format(new Date(month + "-01"), "MMM"),
    income: Math.round(data.income * 100) / 100,
    expense: Math.round(data.expense * 100) / 100,
  }));

  // Upcoming subscription renewals (next 7 days)
  const sevenDaysLater = format(addDays(now, 7), "yyyy-MM-dd");
  const today = format(now, "yyyy-MM-dd");
  const { data: upcomingSubs } = await supabase
    .from("subscriptions")
    .select("id, name, amount, currency, next_billing_date, categories!inner(name, icon)")
    .eq("user_id", user.id)
    .eq("status", "active")
    .gte("next_billing_date", today)
    .lte("next_billing_date", sevenDaysLater)
    .order("next_billing_date")
    .limit(5);

  // Total active subscription monthly cost
  const { data: activeSubs } = await supabase
    .from("subscriptions")
    .select("amount, currency, billing_cycle")
    .eq("user_id", user.id)
    .eq("status", "active");

  let monthlySubCost = 0;
  for (const s of activeSubs || []) {
    let monthly = toDefault(s.amount, s.currency);
    if (s.billing_cycle === "yearly") monthly = monthly / 12;
    if (s.billing_cycle === "weekly") monthly = monthly * 4.33;
    monthlySubCost += monthly;
  }

  // Budget status (overall budget if set)
  const { data: overallBudget } = await supabase
    .from("budgets")
    .select("amount, currency")
    .eq("user_id", user.id)
    .is("category_id", null)
    .maybeSingle();

  let budgetInfo = null;
  if (overallBudget) {
    const budgetConverted = toDefault(overallBudget.amount, overallBudget.currency);
    budgetInfo = {
      limit: Math.round(budgetConverted * 100) / 100,
      spent: Math.round(expenses * 100) / 100,
      percentage: budgetConverted > 0 ? Math.round((expenses / budgetConverted) * 100) : 0,
    };
  }

  return NextResponse.json({
    currency: defaultCurrency,
    income: Math.round(income * 100) / 100,
    expenses: Math.round(expenses * 100) / 100,
    balance: Math.round((income - expenses) * 100) / 100,
    prevIncome: Math.round(prevIncome * 100) / 100,
    prevExpenses: Math.round(prevExpenses * 100) / 100,
    recentTransactions: recent || [],
    monthlyChart: chartArray,
    categoryBreakdown: categoryBreakdown.map((c) => ({
      name: c.name,
      icon: c.icon,
      value: Math.round(c.total * 100) / 100,
    })),
    upcomingSubscriptions: upcomingSubs || [],
    monthlySubscriptionCost: Math.round(monthlySubCost * 100) / 100,
    budget: budgetInfo,
  });
}
