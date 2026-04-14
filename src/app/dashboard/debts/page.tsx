"use client";

import { useEffect, useState, useCallback } from "react";
import { format, differenceInDays, isPast, isToday } from "date-fns";
import { Plus, Pencil, Trash2, Handshake, ArrowUpRight, ArrowDownLeft, CheckCircle2, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Topbar } from "@/components/layout/topbar";
import { formatCurrency, convertCurrency, getUserCurrencies, type Currency } from "@/lib/currency";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface DebtItem {
  id: string;
  direction: string;
  person_name: string;
  amount: number;
  currency: string;
  reason: string | null;
  due_date: string | null;
  status: string;
  paid_date: string | null;
  created_at: string;
}

export default function DebtsPage() {
  const [debts, setDebts] = useState<DebtItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingDebt, setEditingDebt] = useState<DebtItem | undefined>();
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [payDebt, setPayDebt] = useState<{ id: string; name: string } | null>(null);
  const [defaultCurrency, setDefaultCurrency] = useState<Currency>("USD");
  const [exchangeRate, setExchangeRate] = useState(0.709);

  // Form state
  const [direction, setDirection] = useState<string>("i_owe");
  const [personName, setPersonName] = useState("");
  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState("USD");
  const [reason, setReason] = useState("");
  const [dueDate, setDueDate] = useState("");

  const fetchDebts = useCallback(async () => {
    const res = await fetch("/api/debts");
    if (res.ok) setDebts(await res.json());
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchDebts();
    fetch("/api/settings")
      .then((res) => res.json())
      .then((p) => {
        if (p.default_currency) setDefaultCurrency(p.default_currency as Currency);
        if (p.exchange_rate) setExchangeRate(p.exchange_rate);
      })
      .catch(() => {});
  }, [fetchDebts]);

  const activeDebts = debts.filter((d) => d.status === "active");
  const paidDebts = debts.filter((d) => d.status === "paid");
  const iOwe = activeDebts.filter((d) => d.direction === "i_owe");
  const theyOwe = activeDebts.filter((d) => d.direction === "they_owe");

  const totalIOwe = iOwe.reduce((sum, d) => sum + convertCurrency(d.amount, d.currency as Currency, defaultCurrency, exchangeRate), 0);
  const totalTheyOwe = theyOwe.reduce((sum, d) => sum + convertCurrency(d.amount, d.currency as Currency, defaultCurrency, exchangeRate), 0);

  function openCreate() {
    setEditingDebt(undefined);
    setDirection("i_owe");
    setPersonName("");
    setAmount("");
    setCurrency(defaultCurrency);
    setReason("");
    setDueDate("");
    setDialogOpen(true);
  }

  function openEdit(debt: DebtItem) {
    setEditingDebt(debt);
    setDirection(debt.direction);
    setPersonName(debt.person_name);
    setAmount(String(debt.amount));
    setCurrency(debt.currency);
    setReason(debt.reason || "");
    setDueDate(debt.due_date || "");
    setDialogOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);

    const payload = {
      direction,
      person_name: personName,
      amount: parseFloat(amount),
      currency,
      reason: reason || null,
      due_date: dueDate || null,
    };

    const url = editingDebt ? `/api/debts/${editingDebt.id}` : "/api/debts";
    const method = editingDebt ? "PUT" : "POST";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (res.ok) {
      toast.success(editingDebt ? "Debt updated" : "Debt added");
      setDialogOpen(false);
      fetchDebts();
    } else {
      const err = await res.json();
      toast.error(err.error || "Something went wrong");
    }
    setSaving(false);
  }

  async function confirmPay() {
    if (!payDebt) return;
    const res = await fetch(`/api/debts/${payDebt.id}/pay`, { method: "POST" });
    if (res.ok) {
      toast.success("Debt marked as paid — transaction created");
      fetchDebts();
    } else {
      const err = await res.json();
      toast.error(err.error || "Failed");
    }
    setPayDebt(null);
  }

  async function confirmDelete() {
    if (!deleteId) return;
    const res = await fetch(`/api/debts/${deleteId}`, { method: "DELETE" });
    if (res.ok) { toast.success("Debt deleted"); fetchDebts(); }
    else toast.error("Failed to delete");
    setDeleteId(null);
  }

  function getDueInfo(dueDate: string | null) {
    if (!dueDate) return { label: "No due date", color: "text-muted-foreground" };
    const date = new Date(dueDate + "T00:00:00");
    if (isPast(date) && !isToday(date)) return { label: "Overdue", color: "text-[var(--expense)]" };
    if (isToday(date)) return { label: "Due today", color: "text-[var(--expense)]" };
    const days = differenceInDays(date, new Date());
    if (days <= 3) return { label: `${days}d left`, color: "text-[var(--warning)]" };
    return { label: `${days}d left`, color: "text-muted-foreground" };
  }

  return (
    <>
      <Topbar title="Debts">
        <Button onClick={openCreate} size="sm">
          <Plus className="h-4 w-4 mr-1" /> Add Debt
        </Button>
      </Topbar>

      <div className="p-4 lg:p-6 space-y-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">I Owe</p>
                <div className="p-2 rounded-lg bg-[var(--expense)]/10">
                  <ArrowUpRight className="h-4 w-4 text-[var(--expense)]" />
                </div>
              </div>
              <p className="text-2xl font-bold mt-2 text-[var(--expense)]">
                {formatCurrency(totalIOwe, defaultCurrency)}
              </p>
              <p className="text-xs text-muted-foreground mt-1">{iOwe.length} active</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">Owed to Me</p>
                <div className="p-2 rounded-lg bg-[var(--income)]/10">
                  <ArrowDownLeft className="h-4 w-4 text-[var(--income)]" />
                </div>
              </div>
              <p className="text-2xl font-bold mt-2 text-[var(--income)]">
                {formatCurrency(totalTheyOwe, defaultCurrency)}
              </p>
              <p className="text-xs text-muted-foreground mt-1">{theyOwe.length} active</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">Net</p>
                <div className="p-2 rounded-lg bg-primary/10">
                  <Handshake className="h-4 w-4 text-primary" />
                </div>
              </div>
              <p className={cn(
                "text-2xl font-bold mt-2",
                totalTheyOwe - totalIOwe >= 0 ? "text-[var(--income)]" : "text-[var(--expense)]"
              )}>
                {totalTheyOwe - totalIOwe >= 0 ? "+" : "-"}
                {formatCurrency(Math.abs(totalTheyOwe - totalIOwe), defaultCurrency)}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {totalTheyOwe - totalIOwe >= 0 ? "People owe you more" : "You owe more"}
              </p>
            </CardContent>
          </Card>
        </div>

        {loading ? (
          <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-20" />)}</div>
        ) : activeDebts.length === 0 && paidDebts.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center text-muted-foreground">
              <Handshake className="h-10 w-10 mx-auto mb-3 text-muted-foreground/50" />
              <p>No debts tracked yet.</p>
              <Button variant="link" className="text-primary mt-1" onClick={openCreate}>Add your first debt</Button>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* I Owe Section */}
            {iOwe.length > 0 && (
              <DebtSection
                title="I Owe"
                icon={<ArrowUpRight className="h-4 w-4 text-[var(--expense)]" />}
                debts={iOwe}
                defaultCurrency={defaultCurrency}
                getDueInfo={getDueInfo}
                onEdit={openEdit}
                onPay={(id, name) => setPayDebt({ id, name })}
                onDelete={(id) => setDeleteId(id)}
              />
            )}

            {/* They Owe Section */}
            {theyOwe.length > 0 && (
              <DebtSection
                title="Owed to Me"
                icon={<ArrowDownLeft className="h-4 w-4 text-[var(--income)]" />}
                debts={theyOwe}
                defaultCurrency={defaultCurrency}
                getDueInfo={getDueInfo}
                onEdit={openEdit}
                onPay={(id, name) => setPayDebt({ id, name })}
                onDelete={(id) => setDeleteId(id)}
              />
            )}

            {/* Paid Section */}
            {paidDebts.length > 0 && (
              <DebtSection
                title="Paid"
                icon={<CheckCircle2 className="h-4 w-4 text-muted-foreground" />}
                debts={paidDebts}
                defaultCurrency={defaultCurrency}
                getDueInfo={getDueInfo}
                onEdit={openEdit}
                onPay={(id, name) => setPayDebt({ id, name })}
                onDelete={(id) => setDeleteId(id)}
                isPaidSection
              />
            )}
          </>
        )}
      </div>

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingDebt ? "Edit Debt" : "Add Debt"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Direction toggle */}
            <div className="flex rounded-lg border border-border overflow-hidden">
              <button
                type="button"
                onClick={() => setDirection("i_owe")}
                className={cn(
                  "flex-1 py-2 text-sm font-medium transition-colors",
                  direction === "i_owe"
                    ? "bg-[var(--expense)]/10 text-[var(--expense)]"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                I Owe Someone
              </button>
              <button
                type="button"
                onClick={() => setDirection("they_owe")}
                className={cn(
                  "flex-1 py-2 text-sm font-medium transition-colors",
                  direction === "they_owe"
                    ? "bg-[var(--income)]/10 text-[var(--income)]"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                Someone Owes Me
              </button>
            </div>

            <div className="space-y-2">
              <Label>Person Name</Label>
              <Input value={personName} onChange={(e) => setPersonName(e.target.value)} placeholder="e.g. Ahmed" required />
            </div>

            <div className="flex gap-2">
              <div className="flex-1 space-y-2">
                <Label>Amount</Label>
                <Input type="number" step="0.01" min="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.00" required />
              </div>
              <div className="w-24 space-y-2">
                <Label>Currency</Label>
                <Select value={currency} onValueChange={(val) => val && setCurrency(val)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {getUserCurrencies(defaultCurrency).map((c) => (
                      <SelectItem key={c.code} value={c.code}>{c.code}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Reason (optional)</Label>
              <Textarea value={reason} onChange={(e) => setReason(e.target.value)} placeholder="What is the debt for?" rows={2} />
            </div>

            <div className="space-y-2">
              <Label>Due Date (optional)</Label>
              <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="ghost" onClick={() => setDialogOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={saving}>{saving ? "Saving..." : editingDebt ? "Update" : "Add Debt"}</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={!!deleteId} onOpenChange={(open) => { if (!open) setDeleteId(null); }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete Debt</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">Are you sure? This cannot be undone.</p>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setDeleteId(null)}>Cancel</Button>
            <Button variant="destructive" onClick={confirmDelete}>Delete</Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!payDebt} onOpenChange={(open) => { if (!open) setPayDebt(null); }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Mark as Paid</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">Mark debt with {payDebt?.name} as paid? This will create a transaction.</p>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setPayDebt(null)}>Cancel</Button>
            <Button onClick={confirmPay}>Confirm</Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

function DebtSection({
  title,
  icon,
  debts,
  defaultCurrency,
  getDueInfo,
  onEdit,
  onPay,
  onDelete,
  isPaidSection = false,
}: {
  title: string;
  icon: React.ReactNode;
  debts: DebtItem[];
  defaultCurrency: Currency;
  getDueInfo: (d: string | null) => { label: string; color: string };
  onEdit: (d: DebtItem) => void;
  onPay: (id: string, name: string) => void;
  onDelete: (id: string) => void;
  isPaidSection?: boolean;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          {icon} {title} ({debts.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="divide-y divide-border">
          {debts.map((d) => {
            const due = getDueInfo(d.due_date);
            const isOverdue = d.due_date && isPast(new Date(d.due_date + "T00:00:00")) && !isToday(new Date(d.due_date + "T00:00:00"));

            return (
              <div key={d.id} className="flex items-center justify-between px-4 lg:px-6 py-4">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium">{d.person_name}</p>
                    {isOverdue && !isPaidSection && (
                      <Badge className="bg-[var(--expense)]/10 text-[var(--expense)] border-[var(--expense)]/20 text-[10px] gap-1">
                        <AlertTriangle className="h-2.5 w-2.5" /> Overdue
                      </Badge>
                    )}
                    {isPaidSection && (
                      <Badge variant="secondary" className="text-[10px]">
                        Paid {d.paid_date ? format(new Date(d.paid_date + "T00:00:00"), "MMM d") : ""}
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {d.reason || "No reason"}
                    {d.due_date && !isPaidSection && (
                      <span className={cn(" ml-1", due.color)}>
                        &middot; Due {format(new Date(d.due_date + "T00:00:00"), "MMM d")} ({due.label})
                      </span>
                    )}
                  </p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className={cn(
                    "text-sm font-semibold",
                    d.direction === "i_owe" ? "text-[var(--expense)]" : "text-[var(--income)]"
                  )}>
                    {formatCurrency(d.amount, d.currency as Currency)}
                  </span>
                  <div className="flex items-center gap-0.5">
                    {!isPaidSection && (
                      <Button variant="ghost" size="sm" className="h-7 text-xs text-primary" onClick={() => onPay(d.id, d.person_name)}>
                        <CheckCircle2 className="h-3.5 w-3.5 mr-1" /> Pay
                      </Button>
                    )}
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onEdit(d)}>
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => onDelete(d.id)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
