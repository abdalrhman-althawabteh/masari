"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { format, differenceInDays, isToday } from "date-fns";
import { ArrowRight, CalendarDays, AlertTriangle } from "lucide-react";
import { Topbar } from "@/components/layout/topbar";
import { SummaryCards } from "@/components/dashboard/summary-cards";
import { SpendingChart } from "@/components/dashboard/spending-chart";
import { CategoryBreakdown } from "@/components/dashboard/category-breakdown";
import { RecentTransactions } from "@/components/dashboard/recent-transactions";
import { CanISpend } from "@/components/dashboard/can-i-spend";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency, type Currency } from "@/lib/currency";
import { cn } from "@/lib/utils";

interface UpcomingSub {
  id: string;
  name: string;
  amount: number;
  currency: string;
  next_billing_date: string;
  categories: { name: string; icon: string | null };
}

interface DashboardData {
  currency: Currency;
  income: number;
  expenses: number;
  balance: number;
  prevIncome: number;
  prevExpenses: number;
  recentTransactions: Array<{
    id: string;
    type: "income" | "expense";
    amount: number;
    currency: Currency;
    description: string;
    date: string;
    categories: { name: string; icon: string | null };
  }>;
  monthlyChart: { month: string; income: number; expense: number }[];
  categoryBreakdown: { name: string; icon: string; value: number }[];
  upcomingSubscriptions: UpcomingSub[];
  monthlySubscriptionCost: number;
  budget: { limit: number; spent: number; percentage: number } | null;
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/dashboard/summary")
      .then((res) => res.json())
      .then((json) => {
        setData(json);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  return (
    <>
      <Topbar title="Dashboard" />

      <div className="p-4 lg:p-6 space-y-6">
        {loading || !data ? (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-28" />
              ))}
            </div>
            <Skeleton className="h-80" />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Skeleton className="h-60" />
              <Skeleton className="h-60" />
            </div>
          </div>
        ) : (
          <>
            <SummaryCards
              currency={data.currency}
              income={data.income}
              expenses={data.expenses}
              balance={data.balance}
              prevIncome={data.prevIncome}
              prevExpenses={data.prevExpenses}
            />

            {/* Budget Progress (if set) */}
            {data.budget && (
              <Card className={cn(data.budget.percentage >= 100 && "border-[var(--expense)]/30")}>
                <CardContent className="p-5">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium">Monthly Budget</p>
                      {data.budget.percentage >= 100 && (
                        <span className="flex items-center gap-1 text-xs text-[var(--expense)]">
                          <AlertTriangle className="h-3 w-3" /> Over budget
                        </span>
                      )}
                      {data.budget.percentage >= 80 && data.budget.percentage < 100 && (
                        <span className="flex items-center gap-1 text-xs text-[var(--warning)]">
                          <AlertTriangle className="h-3 w-3" /> Approaching limit
                        </span>
                      )}
                    </div>
                    <Button variant="ghost" size="sm" render={<Link href="/dashboard/budgets" />}>
                      Details <ArrowRight className="h-3 w-3 ml-1" />
                    </Button>
                  </div>
                  <div className="w-full h-3 rounded-full bg-accent overflow-hidden">
                    <div
                      className={cn(
                        "h-full rounded-full transition-all duration-500",
                        data.budget.percentage >= 100
                          ? "bg-[var(--expense)]"
                          : data.budget.percentage >= 80
                            ? "bg-[var(--warning)]"
                            : "bg-[var(--income)]"
                      )}
                      style={{ width: `${Math.min(data.budget.percentage, 100)}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between mt-2">
                    <p className="text-xs text-muted-foreground">
                      {formatCurrency(data.budget.spent, data.currency)} spent
                    </p>
                    <p className="text-xs">
                      <span className={cn(
                        "font-semibold",
                        data.budget.percentage >= 100
                          ? "text-[var(--expense)]"
                          : data.budget.percentage >= 80
                            ? "text-[var(--warning)]"
                            : "text-foreground"
                      )}>
                        {data.budget.percentage}%
                      </span>
                      <span className="text-muted-foreground">
                        {" "}of {formatCurrency(data.budget.limit, data.currency)}
                      </span>
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}

            <SpendingChart data={data.monthlyChart} />

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <CategoryBreakdown
                data={data.categoryBreakdown}
                currency={data.currency}
              />

              {/* Upcoming Subscriptions */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="text-base">
                    <CalendarDays className="h-4 w-4 inline mr-2" />
                    Upcoming Renewals
                  </CardTitle>
                  <Button variant="ghost" size="sm" render={<Link href="/dashboard/subscriptions" />}>
                    View all <ArrowRight className="h-3 w-3 ml-1" />
                  </Button>
                </CardHeader>
                <CardContent>
                  {data.upcomingSubscriptions.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      No renewals in the next 7 days.
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {data.upcomingSubscriptions.map((sub) => {
                        const date = new Date(sub.next_billing_date + "T00:00:00");
                        const days = isToday(date) ? 0 : differenceInDays(date, new Date());
                        const daysLabel = days === 0 ? "Today" : days === 1 ? "Tomorrow" : `${days} days`;
                        return (
                          <div key={sub.id} className="flex items-center justify-between py-1.5">
                            <div className="flex items-center gap-2 min-w-0">
                              <span className="text-base shrink-0">
                                {sub.categories?.icon || "💳"}
                              </span>
                              <div className="min-w-0">
                                <p className="text-sm font-medium truncate">{sub.name}</p>
                                <p className="text-xs text-muted-foreground">
                                  {format(date, "MMM d")} &middot;{" "}
                                  <span className={days <= 1 ? "text-[var(--warning)]" : ""}>
                                    {daysLabel}
                                  </span>
                                </p>
                              </div>
                            </div>
                            <span className="text-sm font-semibold text-[var(--expense)] shrink-0">
                              {formatCurrency(sub.amount, sub.currency as Currency)}
                            </span>
                          </div>
                        );
                      })}
                      {data.monthlySubscriptionCost > 0 && (
                        <div className="pt-2 mt-2 border-t border-border">
                          <p className="text-xs text-muted-foreground">
                            Total monthly subscriptions:{" "}
                            <span className="font-medium text-foreground">
                              {formatCurrency(data.monthlySubscriptionCost, data.currency)}
                            </span>
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <RecentTransactions transactions={data.recentTransactions} />
              <CanISpend />
            </div>
          </>
        )}
      </div>
    </>
  );
}
