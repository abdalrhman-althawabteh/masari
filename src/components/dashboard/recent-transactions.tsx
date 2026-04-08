"use client";

import Link from "next/link";
import { format } from "date-fns";
import { ArrowRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatCurrency, type Currency } from "@/lib/currency";
import { cn } from "@/lib/utils";

interface RecentTransaction {
  id: string;
  type: "income" | "expense";
  amount: number;
  currency: Currency;
  description: string;
  date: string;
  categories: { name: string; icon: string | null };
}

interface RecentTransactionsProps {
  transactions: RecentTransaction[];
}

export function RecentTransactions({ transactions }: RecentTransactionsProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-base">Recent Transactions</CardTitle>
        <Button variant="ghost" size="sm" render={<Link href="/dashboard/transactions" />}>
          View all <ArrowRight className="h-4 w-4 ml-1" />
        </Button>
      </CardHeader>
      <CardContent>
        {transactions.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            No transactions yet.
          </p>
        ) : (
          <div className="space-y-1">
            {transactions.map((t) => (
              <div
                key={t.id}
                className="flex items-center justify-between py-2"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className="text-base shrink-0">
                    {t.categories?.icon || "📁"}
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{t.description}</p>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(t.date + "T00:00:00"), "MMM d")}
                    </p>
                  </div>
                </div>
                <span
                  className={cn(
                    "text-sm font-semibold shrink-0",
                    t.type === "income"
                      ? "text-[var(--income)]"
                      : "text-[var(--expense)]"
                  )}
                >
                  {t.type === "income" ? "+" : "-"}
                  {formatCurrency(t.amount, t.currency)}
                </span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
