"use client";

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

interface SpendingChartProps {
  data: { month: string; income: number; expense: number }[];
}

export function SpendingChart({ data }: SpendingChartProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Income vs Expenses</CardTitle>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">
            No data yet. Add transactions to see your chart.
          </p>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={data}>
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
                dataKey="month"
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
