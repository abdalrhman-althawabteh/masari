"use client";

import { useState } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type Period = "week" | "month" | "year";

interface ChartPoint {
  label: string;
  income: number;
  expense: number;
}

interface SpendingChartProps {
  data: { month: string; income: number; expense: number }[];
  weekData?: { day: string; income: number; expense: number }[];
  yearData?: { month: string; income: number; expense: number }[];
}

function normalize(
  data: { month: string; income: number; expense: number }[],
  weekData: { day: string; income: number; expense: number }[] | undefined,
  yearData: { month: string; income: number; expense: number }[] | undefined,
  period: Period
): ChartPoint[] {
  if (period === "week") {
    return (weekData || []).map((d) => ({ label: d.day, income: d.income, expense: d.expense }));
  }
  if (period === "year") {
    return (yearData || data).map((d) => ({ label: d.month, income: d.income, expense: d.expense }));
  }
  return data.map((d) => ({ label: d.month, income: d.income, expense: d.expense }));
}

export function SpendingChart({ data, weekData, yearData }: SpendingChartProps) {
  const [period, setPeriod] = useState<Period>("month");

  const chartData = normalize(data, weekData, yearData, period);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-base">Income vs Expenses</CardTitle>
        <div className="flex rounded-lg border border-border overflow-hidden">
          {(["week", "month", "year"] as Period[]).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={cn(
                "px-3 py-1 text-xs font-medium transition-colors capitalize",
                period === p
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {p}
            </button>
          ))}
        </div>
      </CardHeader>
      <CardContent>
        {chartData.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">
            No data yet. Add transactions to see your chart.
          </p>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="incomeGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--income)" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="var(--income)" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="expenseGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--expense)" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="var(--expense)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis
                dataKey="label"
                stroke="var(--muted-foreground)"
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                stroke="var(--muted-foreground)"
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip
                contentStyle={{
                  background: "var(--card)",
                  border: "1px solid var(--border)",
                  borderRadius: "12px",
                  color: "var(--foreground)",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
                }}
              />
              <Legend />
              <Area
                type="monotone"
                dataKey="income"
                stroke="var(--income)"
                strokeWidth={2.5}
                fill="url(#incomeGradient)"
                name="Income"
                dot={{ r: 4, fill: "var(--income)", strokeWidth: 0 }}
                activeDot={{ r: 6, fill: "var(--income)", strokeWidth: 2, stroke: "var(--background)" }}
              />
              <Area
                type="monotone"
                dataKey="expense"
                stroke="var(--expense)"
                strokeWidth={2.5}
                fill="url(#expenseGradient)"
                name="Expenses"
                dot={{ r: 4, fill: "var(--expense)", strokeWidth: 0 }}
                activeDot={{ r: 6, fill: "var(--expense)", strokeWidth: 2, stroke: "var(--background)" }}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
