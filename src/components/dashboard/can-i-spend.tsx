"use client";

import { useState, useEffect } from "react";
import { Sparkles, Loader2, CircleCheck, CircleAlert, CircleX } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getUserCurrencies, type Currency } from "@/lib/currency";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";

interface SpendResult {
  safe: boolean;
  level: "green" | "yellow" | "red";
  advice: string;
}

export function CanISpend() {
  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState("USD");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<SpendResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [defaultCurrency, setDefaultCurrency] = useState<Currency>("USD");

  useEffect(() => {
    fetch("/api/settings").then(r => r.json()).then(d => {
      if (d.default_currency) { setDefaultCurrency(d.default_currency as Currency); setCurrency(d.default_currency); }
    }).catch(() => {});
  }, []);

  async function handleAsk() {
    if (!amount || !description) return;

    setLoading(true);
    setResult(null);
    setError(null);

    try {
      const res = await fetch("/api/ai/can-i-spend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: parseFloat(amount),
          currency,
          description,
        }),
      });

      if (res.ok) {
        setResult(await res.json());
      } else {
        const err = await res.json();
        setError(err.error || "Something went wrong");
      }
    } catch {
      setError("Failed to connect");
    }
    setLoading(false);
  }

  const levelIcon = {
    green: <CircleCheck className="h-5 w-5 text-[var(--income)]" />,
    yellow: <CircleAlert className="h-5 w-5 text-[var(--warning)]" />,
    red: <CircleX className="h-5 w-5 text-[var(--expense)]" />,
  };

  const levelBg = {
    green: "bg-[var(--income)]/5 border-[var(--income)]/20",
    yellow: "bg-[var(--warning)]/5 border-[var(--warning)]/20",
    red: "bg-[var(--expense)]/5 border-[var(--expense)]/20",
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          Can I Spend This?
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex gap-2">
          <Input
            type="number"
            placeholder="Amount"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="flex-1"
            step="0.01"
            min="0.01"
          />
          <Select value={currency} onValueChange={(val) => val && setCurrency(val)}>
            <SelectTrigger className="w-24">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {getUserCurrencies(defaultCurrency).map((c) => (
                <SelectItem key={c.code} value={c.code}>{c.code}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Input
          placeholder="What do you want to spend on?"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleAsk()}
        />
        <Button
          onClick={handleAsk}
          disabled={loading || !amount || !description}
          className="w-full"
          size="sm"
        >
          {loading ? (
            <><Loader2 className="h-4 w-4 animate-spin mr-1" /> Analyzing...</>
          ) : (
            <><Sparkles className="h-4 w-4 mr-1" /> Ask AI</>
          )}
        </Button>

        {error && (
          <p className="text-xs text-destructive">{error}</p>
        )}

        {result && (
          <div className={cn("rounded-lg border p-3 mt-2", levelBg[result.level])}>
            <div className="flex items-start gap-2">
              {levelIcon[result.level]}
              <p className="text-sm leading-relaxed">{result.advice}</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
