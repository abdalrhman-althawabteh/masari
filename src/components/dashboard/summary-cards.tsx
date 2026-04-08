"use client";

import { TrendingUp, TrendingDown, Wallet } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { formatCurrency, type Currency } from "@/lib/currency";
import { cn } from "@/lib/utils";

interface SummaryCardsProps {
  currency: Currency;
  income: number;
  expenses: number;
  balance: number;
  prevIncome: number;
  prevExpenses: number;
}

function percentChange(current: number, previous: number): number | null {
  if (previous === 0) return null;
  return Math.round(((current - previous) / previous) * 100);
}

export function SummaryCards({
  currency,
  income,
  expenses,
  balance,
  prevIncome,
  prevExpenses,
}: SummaryCardsProps) {
  const incomeChange = percentChange(income, prevIncome);
  const expenseChange = percentChange(expenses, prevExpenses);

  const cards = [
    {
      label: "Income",
      value: income,
      change: incomeChange,
      icon: TrendingUp,
      color: "text-[var(--income)]",
      bgColor: "bg-[var(--income)]/10",
    },
    {
      label: "Expenses",
      value: expenses,
      change: expenseChange,
      icon: TrendingDown,
      color: "text-[var(--expense)]",
      bgColor: "bg-[var(--expense)]/10",
    },
    {
      label: "Balance",
      value: balance,
      change: null,
      icon: Wallet,
      color: balance >= 0 ? "text-[var(--income)]" : "text-[var(--expense)]",
      bgColor: balance >= 0 ? "bg-[var(--income)]/10" : "bg-[var(--expense)]/10",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      {cards.map((card) => (
        <Card key={card.label}>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">{card.label}</p>
              <div className={cn("p-2 rounded-lg", card.bgColor)}>
                <card.icon className={cn("h-4 w-4", card.color)} />
              </div>
            </div>
            <p className={cn("text-2xl font-bold mt-2", card.color)}>
              {formatCurrency(Math.abs(card.value), currency)}
            </p>
            {card.change !== null && (
              <p className="text-xs text-muted-foreground mt-1">
                {card.change > 0 ? "+" : ""}
                {card.change}% vs last month
              </p>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
