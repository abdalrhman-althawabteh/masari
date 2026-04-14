"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { subscriptionSchema, type SubscriptionInput } from "@/lib/validations/subscription";
import { getUserCurrencies, type Currency } from "@/lib/currency";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { Category, Subscription } from "@/types/database";

interface SubscriptionFormProps {
  subscription?: Subscription;
  onSubmit: (data: SubscriptionInput) => Promise<void>;
  onCancel: () => void;
  loading?: boolean;
  defaultCurrency?: Currency;
}

export function SubscriptionForm({ subscription, onSubmit, onCancel, loading, defaultCurrency = "USD" }: SubscriptionFormProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [calendarOpen, setCalendarOpen] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(subscriptionSchema),
    defaultValues: {
      name: subscription?.name || "",
      amount: subscription?.amount || (undefined as unknown as number),
      currency: (subscription?.currency || "USD") as Currency,
      category_id: subscription?.category_id || "",
      billing_cycle: (subscription?.billing_cycle || "monthly") as "monthly" | "yearly" | "weekly" | "custom",
      billing_day: subscription?.billing_day || null,
      next_billing_date: subscription?.next_billing_date || format(new Date(), "yyyy-MM-dd"),
      status: (subscription?.status || "active") as "active" | "paused" | "cancelled",
      notes: subscription?.notes || "",
    },
  });

  const currency = watch("currency");
  const billingCycle = watch("billing_cycle");
  const status = watch("status");
  const dateVal = watch("next_billing_date");

  useEffect(() => {
    fetch("/api/categories")
      .then((res) => res.json())
      .then((data) => setCategories(data));
  }, []);

  const expenseCategories = categories.filter(
    (c) => c.type === "expense" || c.type === "both"
  );

  function handleFormSubmit(data: Record<string, unknown>) {
    return onSubmit(data as unknown as SubscriptionInput);
  }

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
      {/* Name */}
      <div className="space-y-2">
        <Label htmlFor="name">Subscription Name</Label>
        <Input id="name" placeholder="e.g. Claude Pro, Netflix" {...register("name")} />
        {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
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
          {errors.amount && <p className="text-sm text-destructive">{errors.amount.message}</p>}
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

      {/* Category */}
      <div className="space-y-2">
        <Label>Category</Label>
        <Select value={watch("category_id")} onValueChange={(val) => setValue("category_id", val as string)}>
          <SelectTrigger><SelectValue placeholder="Select a category" /></SelectTrigger>
          <SelectContent>
            {expenseCategories.map((cat) => (
              <SelectItem key={cat.id} value={cat.id}>
                {cat.icon} {cat.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.category_id && <p className="text-sm text-destructive">{errors.category_id.message}</p>}
      </div>

      {/* Billing Cycle + Status */}
      <div className="flex gap-2">
        <div className="flex-1 space-y-2">
          <Label>Billing Cycle</Label>
          <Select value={billingCycle} onValueChange={(val) => setValue("billing_cycle", val as "monthly" | "yearly" | "weekly" | "custom")}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="monthly">Monthly</SelectItem>
              <SelectItem value="yearly">Yearly</SelectItem>
              <SelectItem value="weekly">Weekly</SelectItem>
              <SelectItem value="custom">Custom</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex-1 space-y-2">
          <Label>Status</Label>
          <Select value={status} onValueChange={(val) => setValue("status", val as "active" | "paused" | "cancelled")}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="paused">Paused</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Next Billing Date */}
      <div className="space-y-2">
        <Label>Next Billing Date</Label>
        <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
          <PopoverTrigger className="flex w-full items-center justify-start rounded-lg border border-input bg-transparent px-3 py-2 text-sm font-normal hover:bg-muted transition-colors">
            <CalendarIcon className="mr-2 h-4 w-4" />
            {dateVal ? format(new Date(dateVal + "T00:00:00"), "PPP") : "Pick a date"}
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={dateVal ? new Date(dateVal + "T00:00:00") : undefined}
              onSelect={(date) => {
                if (date) {
                  setValue("next_billing_date", format(date, "yyyy-MM-dd"));
                  setCalendarOpen(false);
                }
              }}
            />
          </PopoverContent>
        </Popover>
      </div>

      {/* Notes */}
      <div className="space-y-2">
        <Label htmlFor="notes">Notes (optional)</Label>
        <Textarea
          id="notes"
          placeholder="e.g. Cancel after March"
          {...register("notes")}
          rows={2}
        />
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="ghost" onClick={onCancel}>Cancel</Button>
        <Button type="submit" disabled={loading}>
          {loading ? "Saving..." : subscription ? "Update" : "Add Subscription"}
        </Button>
      </div>
    </form>
  );
}
