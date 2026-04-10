"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles,
  ArrowRight,
  DollarSign,
  Target,
  CreditCard,
  Check,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

interface OnboardingProps {
  onComplete: () => void;
}

export function Onboarding({ onComplete }: OnboardingProps) {
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);

  // Step 1: Currency
  const [currency, setCurrency] = useState("USD");
  const [exchangeRate, setExchangeRate] = useState("0.709");

  // Step 2: Budget
  const [budgetAmount, setBudgetAmount] = useState("");

  // Step 3: First transaction
  const [txAmount, setTxAmount] = useState("");
  const [txDescription, setTxDescription] = useState("");
  const [txType, setTxType] = useState("expense");

  async function saveCurrency() {
    setSaving(true);
    await fetch("/api/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        default_currency: currency,
        exchange_rate: parseFloat(exchangeRate),
      }),
    });
    setSaving(false);
    setStep(1);
  }

  async function saveBudget() {
    if (!budgetAmount) {
      setStep(2);
      return;
    }
    setSaving(true);
    await fetch("/api/budgets", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        category_id: null,
        amount: parseFloat(budgetAmount),
        currency,
        period: "monthly",
      }),
    });
    setSaving(false);
    setStep(2);
  }

  async function saveTransaction() {
    if (!txAmount || !txDescription) {
      finish();
      return;
    }
    setSaving(true);

    // Get first matching category
    const catRes = await fetch("/api/categories");
    const categories = await catRes.json();
    const cat = categories.find(
      (c: { type: string }) => c.type === txType || c.type === "both"
    );

    if (cat) {
      await fetch("/api/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: txType,
          amount: parseFloat(txAmount),
          currency,
          category_id: cat.id,
          description: txDescription,
          date: new Date().toISOString().split("T")[0],
        }),
      });
      toast.success("First transaction logged!");
    }
    setSaving(false);
    finish();
  }

  function finish() {
    setStep(3);
    setTimeout(onComplete, 2000);
  }

  const steps = [
    {
      icon: DollarSign,
      title: "Set your currency",
      subtitle: "Which currency do you use most?",
    },
    {
      icon: Target,
      title: "Set a monthly budget",
      subtitle: "How much do you want to spend per month? (optional)",
    },
    {
      icon: CreditCard,
      title: "Log your first transaction",
      subtitle: "Add your most recent expense or income (optional)",
    },
    {
      icon: Check,
      title: "You're all set!",
      subtitle: "Welcome to Masari. Let's manage your money.",
    },
  ];

  const current = steps[step];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/95 backdrop-blur-sm">
      {/* Skip button */}
      {step < 3 && (
        <button
          onClick={onComplete}
          className="absolute top-6 right-6 text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1 text-sm"
        >
          Skip <X className="h-4 w-4" />
        </button>
      )}

      <div className="w-full max-w-md px-4">
        {/* Progress dots */}
        <div className="flex justify-center gap-2 mb-8">
          {steps.map((_, i) => (
            <div
              key={i}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                i === step
                  ? "w-8 bg-primary"
                  : i < step
                    ? "w-1.5 bg-primary/50"
                    : "w-1.5 bg-muted"
              }`}
            />
          ))}
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="text-center"
          >
            {/* Icon */}
            <div className="inline-flex p-4 rounded-2xl bg-primary/10 mb-6">
              <current.icon className="h-8 w-8 text-primary" />
            </div>

            <h2 className="text-2xl font-bold text-foreground">{current.title}</h2>
            <p className="text-muted-foreground mt-2 mb-8">{current.subtitle}</p>

            {/* Step 0: Currency */}
            {step === 0 && (
              <div className="space-y-4 text-left">
                <div className="space-y-2">
                  <Label>Default Currency</Label>
                  <Select value={currency} onValueChange={(val) => setCurrency(val as string)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="USD">USD ($) — US Dollar</SelectItem>
                      <SelectItem value="JOD">JOD — Jordanian Dinar</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Exchange Rate (1 USD = ? JOD)</Label>
                  <Input
                    type="number"
                    step="0.0001"
                    value={exchangeRate}
                    onChange={(e) => setExchangeRate(e.target.value)}
                  />
                </div>
                <Button onClick={saveCurrency} disabled={saving} className="w-full mt-4">
                  {saving ? "Saving..." : "Continue"}
                  <ArrowRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            )}

            {/* Step 1: Budget */}
            {step === 1 && (
              <div className="space-y-4 text-left">
                <div className="space-y-2">
                  <Label>Monthly spending limit ({currency})</Label>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="e.g. 1000"
                    value={budgetAmount}
                    onChange={(e) => setBudgetAmount(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">Leave empty to skip</p>
                </div>
                <Button onClick={saveBudget} disabled={saving} className="w-full mt-4">
                  {saving ? "Saving..." : budgetAmount ? "Set Budget" : "Skip"}
                  <ArrowRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            )}

            {/* Step 2: First transaction */}
            {step === 2 && (
              <div className="space-y-4 text-left">
                <div className="flex rounded-lg border border-border overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setTxType("expense")}
                    className={`flex-1 py-2 text-sm font-medium transition-colors ${
                      txType === "expense"
                        ? "bg-[var(--expense)]/10 text-[var(--expense)]"
                        : "text-muted-foreground"
                    }`}
                  >
                    Expense
                  </button>
                  <button
                    type="button"
                    onClick={() => setTxType("income")}
                    className={`flex-1 py-2 text-sm font-medium transition-colors ${
                      txType === "income"
                        ? "bg-[var(--income)]/10 text-[var(--income)]"
                        : "text-muted-foreground"
                    }`}
                  >
                    Income
                  </button>
                </div>
                <div className="space-y-2">
                  <Label>Amount ({currency})</Label>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={txAmount}
                    onChange={(e) => setTxAmount(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Description</Label>
                  <Input
                    placeholder={txType === "expense" ? "e.g. Lunch" : "e.g. Freelance work"}
                    value={txDescription}
                    onChange={(e) => setTxDescription(e.target.value)}
                  />
                </div>
                <Button onClick={saveTransaction} disabled={saving} className="w-full mt-4">
                  {saving ? "Saving..." : txAmount && txDescription ? "Add & Finish" : "Skip & Finish"}
                  <ArrowRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            )}

            {/* Step 3: Done */}
            {step === 3 && (
              <div className="space-y-4">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", duration: 0.5 }}
                  className="inline-flex p-4 rounded-full bg-primary/10"
                >
                  <Sparkles className="h-10 w-10 text-primary" />
                </motion.div>
                <p className="text-sm text-muted-foreground">Redirecting to your dashboard...</p>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
