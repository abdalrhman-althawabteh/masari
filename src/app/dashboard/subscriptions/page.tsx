"use client";

import { useEffect, useState, useCallback } from "react";
import { format, differenceInDays, isPast, isToday } from "date-fns";
import { Plus, Pencil, Trash2, CalendarDays, DollarSign, Pause, Play, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Topbar } from "@/components/layout/topbar";
import { SubscriptionForm } from "@/components/subscriptions/subscription-form";
import { formatCurrency, type Currency } from "@/lib/currency";
import type { SubscriptionInput } from "@/lib/validations/subscription";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface SubscriptionWithCategory {
  id: string;
  user_id: string;
  name: string;
  amount: number;
  currency: string;
  category_id: string;
  billing_cycle: string;
  billing_day: number | null;
  next_billing_date: string;
  status: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
  categories: { name: string; icon: string | null };
}

export default function SubscriptionsPage() {
  const [subscriptions, setSubscriptions] = useState<SubscriptionWithCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingSub, setEditingSub] = useState<SubscriptionWithCategory | undefined>();

  const fetchSubscriptions = useCallback(async () => {
    const res = await fetch("/api/subscriptions");
    if (res.ok) {
      setSubscriptions(await res.json());
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchSubscriptions();
  }, [fetchSubscriptions]);

  const activeSubs = subscriptions.filter((s) => s.status === "active");
  const pausedSubs = subscriptions.filter((s) => s.status === "paused");
  const cancelledSubs = subscriptions.filter((s) => s.status === "cancelled");

  const monthlyTotal = activeSubs.reduce((sum, s) => {
    let monthly = s.amount;
    if (s.billing_cycle === "yearly") monthly = s.amount / 12;
    if (s.billing_cycle === "weekly") monthly = s.amount * 4.33;
    return sum + monthly;
  }, 0);

  const yearlyTotal = monthlyTotal * 12;

  async function handleSubmit(data: SubscriptionInput) {
    setSaving(true);
    const url = editingSub ? `/api/subscriptions/${editingSub.id}` : "/api/subscriptions";
    const method = editingSub ? "PUT" : "POST";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (res.ok) {
      toast.success(editingSub ? "Subscription updated" : "Subscription added");
      setDialogOpen(false);
      setEditingSub(undefined);
      fetchSubscriptions();
    } else {
      const err = await res.json();
      toast.error(err.error || "Something went wrong");
    }
    setSaving(false);
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this subscription?")) return;
    const res = await fetch(`/api/subscriptions/${id}`, { method: "DELETE" });
    if (res.ok) {
      toast.success("Subscription deleted");
      fetchSubscriptions();
    } else {
      toast.error("Failed to delete");
    }
  }

  function getDaysLabel(dateStr: string) {
    const date = new Date(dateStr + "T00:00:00");
    if (isToday(date)) return "Today";
    if (isPast(date)) return "Overdue";
    const days = differenceInDays(date, new Date());
    if (days === 1) return "Tomorrow";
    return `${days} days`;
  }

  function getDaysColor(dateStr: string) {
    const date = new Date(dateStr + "T00:00:00");
    if (isPast(date) || isToday(date)) return "text-[var(--expense)]";
    const days = differenceInDays(date, new Date());
    if (days <= 3) return "text-[var(--warning)]";
    return "text-muted-foreground";
  }

  const statusIcon = {
    active: <Play className="h-3 w-3" />,
    paused: <Pause className="h-3 w-3" />,
    cancelled: <XCircle className="h-3 w-3" />,
  };

  const statusColor: Record<string, string> = {
    active: "bg-[var(--income)]/10 text-[var(--income)] border-[var(--income)]/20",
    paused: "bg-[var(--warning)]/10 text-[var(--warning)] border-[var(--warning)]/20",
    cancelled: "bg-[var(--expense)]/10 text-[var(--expense)] border-[var(--expense)]/20",
  };

  return (
    <>
      <Topbar title="Subscriptions">
        <Button onClick={() => { setEditingSub(undefined); setDialogOpen(true); }} size="sm">
          <Plus className="h-4 w-4 mr-1" />
          Add
        </Button>
      </Topbar>

      <div className="p-4 lg:p-6 space-y-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">Active</p>
                <div className="p-2 rounded-lg bg-[var(--income)]/10">
                  <CalendarDays className="h-4 w-4 text-[var(--income)]" />
                </div>
              </div>
              <p className="text-2xl font-bold mt-2">{activeSubs.length}</p>
              <p className="text-xs text-muted-foreground mt-1">subscriptions</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">Monthly Cost</p>
                <div className="p-2 rounded-lg bg-[var(--warning)]/10">
                  <DollarSign className="h-4 w-4 text-[var(--warning)]" />
                </div>
              </div>
              <p className="text-2xl font-bold mt-2 text-[var(--warning)]">
                {formatCurrency(monthlyTotal, "USD")}
              </p>
              <p className="text-xs text-muted-foreground mt-1">per month</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">Yearly Cost</p>
                <div className="p-2 rounded-lg bg-[var(--expense)]/10">
                  <DollarSign className="h-4 w-4 text-[var(--expense)]" />
                </div>
              </div>
              <p className="text-2xl font-bold mt-2 text-[var(--expense)]">
                {formatCurrency(yearlyTotal, "USD")}
              </p>
              <p className="text-xs text-muted-foreground mt-1">per year</p>
            </CardContent>
          </Card>
        </div>

        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-20 w-full" />
            ))}
          </div>
        ) : subscriptions.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center text-muted-foreground">
              <p>No subscriptions yet.</p>
              <Button
                variant="link"
                className="text-primary mt-1"
                onClick={() => { setEditingSub(undefined); setDialogOpen(true); }}
              >
                Add your first subscription
              </Button>
            </CardContent>
          </Card>
        ) : (
          <>
            {activeSubs.length > 0 && (
              <SubscriptionSection
                title="Active"
                subs={activeSubs}
                statusIcon={statusIcon}
                statusColor={statusColor}
                getDaysLabel={getDaysLabel}
                getDaysColor={getDaysColor}
                onEdit={(s) => { setEditingSub(s); setDialogOpen(true); }}
                onDelete={handleDelete}
              />
            )}
            {pausedSubs.length > 0 && (
              <SubscriptionSection
                title="Paused"
                subs={pausedSubs}
                statusIcon={statusIcon}
                statusColor={statusColor}
                getDaysLabel={getDaysLabel}
                getDaysColor={getDaysColor}
                onEdit={(s) => { setEditingSub(s); setDialogOpen(true); }}
                onDelete={handleDelete}
              />
            )}
            {cancelledSubs.length > 0 && (
              <SubscriptionSection
                title="Cancelled"
                subs={cancelledSubs}
                statusIcon={statusIcon}
                statusColor={statusColor}
                getDaysLabel={getDaysLabel}
                getDaysColor={getDaysColor}
                onEdit={(s) => { setEditingSub(s); setDialogOpen(true); }}
                onDelete={handleDelete}
              />
            )}
          </>
        )}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingSub ? "Edit Subscription" : "New Subscription"}
            </DialogTitle>
          </DialogHeader>
          <SubscriptionForm
            subscription={editingSub}
            onSubmit={handleSubmit}
            onCancel={() => setDialogOpen(false)}
            loading={saving}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}

function SubscriptionSection({
  title,
  subs,
  statusIcon,
  statusColor,
  getDaysLabel,
  getDaysColor,
  onEdit,
  onDelete,
}: {
  title: string;
  subs: SubscriptionWithCategory[];
  statusIcon: Record<string, React.ReactNode>;
  statusColor: Record<string, string>;
  getDaysLabel: (d: string) => string;
  getDaysColor: (d: string) => string;
  onEdit: (s: SubscriptionWithCategory) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{title} ({subs.length})</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="divide-y divide-border">
          {subs.map((s) => (
            <div
              key={s.id}
              className="flex items-center justify-between px-4 lg:px-6 py-4 hover:bg-accent/30 group"
            >
              <div className="flex items-center gap-4 min-w-0">
                <span className="text-xl shrink-0">{s.categories?.icon || "💳"}</span>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium truncate">{s.name}</p>
                    <Badge
                      variant="outline"
                      className={cn("text-[10px] px-1.5 py-0 gap-1", statusColor[s.status])}
                    >
                      {statusIcon[s.status]}
                      {s.status}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {s.categories?.name} &middot; {s.billing_cycle}
                    {s.notes && <span className="italic"> &middot; {s.notes}</span>}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-4 shrink-0">
                <div className="text-right">
                  <p className="text-sm font-semibold">
                    {formatCurrency(s.amount, s.currency as Currency)}
                  </p>
                  <p className={cn("text-xs", getDaysColor(s.next_billing_date))}>
                    {getDaysLabel(s.next_billing_date)} &middot;{" "}
                    {format(new Date(s.next_billing_date + "T00:00:00"), "MMM d")}
                  </p>
                </div>
                <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => onEdit(s)}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-destructive hover:text-destructive"
                    onClick={() => onDelete(s.id)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
