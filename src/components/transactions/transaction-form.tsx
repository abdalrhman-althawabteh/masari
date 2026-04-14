"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { CalendarIcon, Sparkles, Loader2 } from "lucide-react";
import { transactionSchema, type TransactionInput } from "@/lib/validations/transaction";
import { CURRENCY_LIST, getUserCurrencies, type Currency } from "@/lib/currency";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import type { Category, Transaction } from "@/types/database";

interface TransactionFormProps {
  transaction?: Transaction;
  onSubmit: (data: TransactionInput) => Promise<void>;
  onCancel: () => void;
  loading?: boolean;
  defaultCurrency?: Currency;
}

interface AISuggestion {
  category_id: string;
  category_name: string;
  confidence: string;
  source: string;
}

export function TransactionForm({ transaction, onSubmit, onCancel, loading, defaultCurrency = "USD" }: TransactionFormProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [aiSuggestion, setAiSuggestion] = useState<AISuggestion | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiSuggestedId, setAiSuggestedId] = useState<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(transactionSchema),
    defaultValues: {
      type: (transaction?.type || "expense") as "income" | "expense",
      amount: transaction?.amount || (undefined as unknown as number),
      currency: (transaction?.currency || "USD") as Currency,
      category_id: transaction?.category_id || "",
      description: transaction?.description || "",
      source: transaction?.source || "",
      date: transaction?.date || format(new Date(), "yyyy-MM-dd"),
      is_subscription: transaction?.is_subscription || false,
    },
  });

  const type = watch("type");
  const currency = watch("currency");
  const dateVal = watch("date");
  const descriptionVal = watch("description");
  const categoryId = watch("category_id");

  useEffect(() => {
    fetch("/api/categories")
      .then((res) => res.json())
      .then((data) => setCategories(data));
  }, []);

  const filteredCategories = categories.filter(
    (c) => c.type === type || c.type === "both"
  );

  // AI categorization on description change (debounced)
  const fetchAISuggestion = useCallback(async (desc: string, txType: string) => {
    if (desc.length < 3) {
      setAiSuggestion(null);
      return;
    }

    setAiLoading(true);
    try {
      const res = await fetch("/api/ai/categorize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description: desc, type: txType }),
      });

      if (res.ok) {
        const data = await res.json();
        setAiSuggestion(data);
        setAiSuggestedId(data.category_id);
      } else {
        setAiSuggestion(null);
      }
    } catch {
      setAiSuggestion(null);
    }
    setAiLoading(false);
  }, []);

  useEffect(() => {
    if (transaction) return; // Don't suggest when editing
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      fetchAISuggestion(descriptionVal, type);
    }, 800);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [descriptionVal, type, transaction, fetchAISuggestion]);

  function acceptSuggestion() {
    if (aiSuggestion) {
      setValue("category_id", aiSuggestion.category_id);
    }
  }

  // Store override when user manually picks a different category than AI suggested
  async function handleFormSubmit(data: Record<string, unknown>) {
    const formData = data as unknown as TransactionInput;

    // If AI suggested a category but user picked something different, store the override
    if (
      aiSuggestedId &&
      formData.category_id !== aiSuggestedId &&
      formData.description
    ) {
      fetch("/api/ai/override", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          keyword: formData.description.toLowerCase().trim(),
          category_id: formData.category_id,
        }),
      }).catch(() => {}); // fire and forget
    }

    return onSubmit(formData);
  }

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
      {/* Type toggle */}
      <div className="flex rounded-lg border border-border overflow-hidden">
        <button
          type="button"
          onClick={() => {
            setValue("type", "expense");
            setValue("category_id", "");
            setAiSuggestion(null);
          }}
          className={cn(
            "flex-1 py-2 text-sm font-medium transition-colors",
            type === "expense"
              ? "bg-[var(--expense)]/10 text-[var(--expense)]"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          Expense
        </button>
        <button
          type="button"
          onClick={() => {
            setValue("type", "income");
            setValue("category_id", "");
            setAiSuggestion(null);
          }}
          className={cn(
            "flex-1 py-2 text-sm font-medium transition-colors",
            type === "income"
              ? "bg-[var(--income)]/10 text-[var(--income)]"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          Income
        </button>
      </div>

      {/* Amount + Currency */}
      <div className="flex gap-2">
        <div className="flex-1 space-y-2">
          <Label htmlFor="amount">Amount</Label>
          <Input
            id="amount"
            type="number"
            step="0.01"
            min="0.01"
            placeholder="0.00"
            {...register("amount", { valueAsNumber: true })}
          />
          {errors.amount && (
            <p className="text-sm text-destructive">{errors.amount.message}</p>
          )}
        </div>
        <div className="w-24 space-y-2">
          <Label>Currency</Label>
          <Select value={currency} onValueChange={(val) => setValue("currency", val as Currency)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {getUserCurrencies(defaultCurrency).map((c) => (
                <SelectItem key={c.code} value={c.code}>{c.code}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Description (moved before Category so AI can suggest) */}
      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Input
          id="description"
          placeholder={type === "expense" ? "What did you spend on?" : "Where did the income come from?"}
          {...register("description")}
        />
        {errors.description && (
          <p className="text-sm text-destructive">{errors.description.message}</p>
        )}
      </div>

      {/* AI Suggestion */}
      {(aiLoading || aiSuggestion) && !transaction && (
        <div className="flex items-center gap-2">
          {aiLoading ? (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Loader2 className="h-3 w-3 animate-spin" />
              AI is thinking...
            </div>
          ) : aiSuggestion ? (
            <button
              type="button"
              onClick={acceptSuggestion}
              className={cn(
                "flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-colors",
                categoryId === aiSuggestion.category_id
                  ? "bg-primary/20 text-primary"
                  : "bg-accent text-muted-foreground hover:text-foreground hover:bg-accent/80"
              )}
            >
              <Sparkles className="h-3 w-3" />
              AI suggests: {aiSuggestion.category_name}
              {aiSuggestion.source === "learned" && " (learned)"}
            </button>
          ) : null}
        </div>
      )}

      {/* Category */}
      <div className="space-y-2">
        <Label>Category</Label>
        <Select
          value={categoryId}
          onValueChange={(val) => setValue("category_id", val as string)}
        >
          <SelectTrigger><SelectValue placeholder="Select a category" /></SelectTrigger>
          <SelectContent>
            {filteredCategories.map((cat) => (
              <SelectItem key={cat.id} value={cat.id}>
                {cat.icon} {cat.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.category_id && (
          <p className="text-sm text-destructive">{errors.category_id.message}</p>
        )}
      </div>

      {/* Source (for income) */}
      {type === "income" && (
        <div className="space-y-2">
          <Label htmlFor="source">Source / Client</Label>
          <Input id="source" placeholder="Client name (optional)" {...register("source")} />
        </div>
      )}

      {/* Date */}
      <div className="space-y-2">
        <Label>Date</Label>
        <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
          <PopoverTrigger
            className="flex w-full items-center justify-start rounded-lg border border-input bg-transparent px-3 py-2 text-sm font-normal hover:bg-muted transition-colors"
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {dateVal ? format(new Date(dateVal + "T00:00:00"), "PPP") : "Pick a date"}
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={dateVal ? new Date(dateVal + "T00:00:00") : undefined}
              onSelect={(date) => {
                if (date) {
                  setValue("date", format(date, "yyyy-MM-dd"));
                  setCalendarOpen(false);
                }
              }}
            />
          </PopoverContent>
        </Popover>
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? "Saving..." : transaction ? "Update" : "Add Transaction"}
        </Button>
      </div>
    </form>
  );
}
