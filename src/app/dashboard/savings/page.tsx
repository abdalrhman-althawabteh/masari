"use client";

import { useEffect, useState, useCallback } from "react";
import { format, differenceInDays } from "date-fns";
import { Plus, Pencil, Trash2, PiggyBank, Target, HandCoins } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Topbar } from "@/components/layout/topbar";
import { formatCurrency, type Currency } from "@/lib/currency";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface SavingsGoal {
  id: string;
  name: string;
  target_amount: number;
  target_currency: string;
  current_amount: number;
  deadline: string | null;
  status: string;
  created_at: string;
}

export default function SavingsPage() {
  const [goals, setGoals] = useState<SavingsGoal[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [goalDialog, setGoalDialog] = useState(false);
  const [contribDialog, setContribDialog] = useState<string | null>(null);
  const [editingGoal, setEditingGoal] = useState<SavingsGoal | undefined>();
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // Goal form
  const [goalName, setGoalName] = useState("");
  const [goalTarget, setGoalTarget] = useState("");
  const [goalCurrency, setGoalCurrency] = useState("USD");
  const [goalDeadline, setGoalDeadline] = useState("");

  // Contribution form
  const [contribAmount, setContribAmount] = useState("");
  const [contribCurrency, setContribCurrency] = useState("USD");
  const [contribNotes, setContribNotes] = useState("");

  const fetchGoals = useCallback(async () => {
    const res = await fetch("/api/savings-goals");
    if (res.ok) setGoals(await res.json());
    setLoading(false);
  }, []);

  useEffect(() => { fetchGoals(); }, [fetchGoals]);

  const activeGoals = goals.filter((g) => g.status === "active");
  const completedGoals = goals.filter((g) => g.status === "completed");
  const totalSaved = goals.reduce((sum, g) => sum + g.current_amount, 0);

  function openCreate() {
    setEditingGoal(undefined);
    setGoalName("");
    setGoalTarget("");
    setGoalCurrency("USD");
    setGoalDeadline("");
    setGoalDialog(true);
  }

  function openEdit(goal: SavingsGoal) {
    setEditingGoal(goal);
    setGoalName(goal.name);
    setGoalTarget(String(goal.target_amount));
    setGoalCurrency(goal.target_currency);
    setGoalDeadline(goal.deadline || "");
    setGoalDialog(true);
  }

  async function handleGoalSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);

    const payload = {
      name: goalName,
      target_amount: parseFloat(goalTarget),
      target_currency: goalCurrency,
      deadline: goalDeadline || null,
    };

    const url = editingGoal ? `/api/savings-goals/${editingGoal.id}` : "/api/savings-goals";
    const method = editingGoal ? "PUT" : "POST";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (res.ok) {
      toast.success(editingGoal ? "Goal updated" : "Goal created");
      setGoalDialog(false);
      fetchGoals();
    } else {
      const err = await res.json();
      toast.error(err.error || "Something went wrong");
    }
    setSaving(false);
  }

  async function handleContribute(e: React.FormEvent) {
    e.preventDefault();
    if (!contribDialog) return;
    setSaving(true);

    const res = await fetch(`/api/savings-goals/${contribDialog}/contribute`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        amount: parseFloat(contribAmount),
        currency: contribCurrency,
        notes: contribNotes || null,
      }),
    });

    if (res.ok) {
      const updated = await res.json();
      toast.success(
        updated.status === "completed"
          ? "Goal completed! Congratulations!"
          : "Contribution added"
      );
      setContribDialog(null);
      fetchGoals();
    } else {
      const err = await res.json();
      toast.error(err.error || "Something went wrong");
    }
    setSaving(false);
  }

  async function confirmDelete() {
    if (!deleteId) return;
    const res = await fetch(`/api/savings-goals/${deleteId}`, { method: "DELETE" });
    if (res.ok) { toast.success("Goal deleted"); fetchGoals(); }
    else toast.error("Failed to delete");
    setDeleteId(null);
  }

  function getProjectedDate(goal: SavingsGoal): string | null {
    if (goal.current_amount <= 0 || goal.current_amount >= goal.target_amount) return null;
    const daysSinceCreated = Math.max(1, differenceInDays(new Date(), new Date(goal.created_at)));
    const dailyRate = goal.current_amount / daysSinceCreated;
    const remaining = goal.target_amount - goal.current_amount;
    const daysLeft = Math.ceil(remaining / dailyRate);
    const projected = new Date();
    projected.setDate(projected.getDate() + daysLeft);
    return format(projected, "MMM d, yyyy");
  }

  return (
    <>
      <Topbar title="Savings Goals">
        <Button onClick={openCreate} size="sm">
          <Plus className="h-4 w-4 mr-1" /> New Goal
        </Button>
      </Topbar>

      <div className="p-4 lg:p-6 space-y-6">
        {/* Summary */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">Active Goals</p>
                <div className="p-2 rounded-lg bg-primary/10"><Target className="h-4 w-4 text-primary" /></div>
              </div>
              <p className="text-2xl font-bold mt-2">{activeGoals.length}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">Completed</p>
                <div className="p-2 rounded-lg bg-[var(--income)]/10"><PiggyBank className="h-4 w-4 text-[var(--income)]" /></div>
              </div>
              <p className="text-2xl font-bold mt-2 text-[var(--income)]">{completedGoals.length}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">Total Saved</p>
                <div className="p-2 rounded-lg bg-[var(--warning)]/10"><HandCoins className="h-4 w-4 text-[var(--warning)]" /></div>
              </div>
              <p className="text-2xl font-bold mt-2 text-[var(--warning)]">{formatCurrency(totalSaved, "USD")}</p>
            </CardContent>
          </Card>
        </div>

        {loading ? (
          <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-32" />)}</div>
        ) : goals.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center text-muted-foreground">
              <PiggyBank className="h-10 w-10 mx-auto mb-3 text-muted-foreground/50" />
              <p>No savings goals yet.</p>
              <Button variant="link" className="text-primary mt-1" onClick={openCreate}>Create your first goal</Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {goals.map((goal) => {
              const pct = goal.target_amount > 0 ? Math.round((goal.current_amount / goal.target_amount) * 100) : 0;
              const isComplete = goal.status === "completed";
              const projected = getProjectedDate(goal);
              const curr = goal.target_currency as Currency;

              return (
                <Card key={goal.id} className={cn(isComplete && "border-[var(--income)]/30")}>
                  <CardContent className="p-5">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium">{goal.name}</p>
                        {isComplete && <Badge className="bg-[var(--income)]/10 text-[var(--income)] border-[var(--income)]/20 text-[10px]">Completed</Badge>}
                        {goal.status === "abandoned" && <Badge variant="secondary" className="text-[10px]">Abandoned</Badge>}
                      </div>
                      <div className="flex items-center gap-1">
                        {goal.status === "active" && (
                          <Button variant="ghost" size="sm" onClick={() => {
                            setContribDialog(goal.id);
                            setContribAmount("");
                            setContribCurrency(goal.target_currency);
                            setContribNotes("");
                          }}>
                            <HandCoins className="h-3.5 w-3.5 mr-1" /> Add
                          </Button>
                        )}
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(goal)}>
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => setDeleteId(goal.id)}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>

                    <div className="w-full h-3 rounded-full bg-accent overflow-hidden">
                      <div
                        className={cn("h-full rounded-full transition-all duration-500", isComplete ? "bg-[var(--income)]" : "bg-primary")}
                        style={{ width: `${Math.min(pct, 100)}%` }}
                      />
                    </div>

                    <div className="flex items-center justify-between mt-2">
                      <p className="text-xs text-muted-foreground">
                        {formatCurrency(goal.current_amount, curr)} of {formatCurrency(goal.target_amount, curr)}
                      </p>
                      <p className="text-xs">
                        <span className={cn("font-semibold", isComplete ? "text-[var(--income)]" : "text-foreground")}>{pct}%</span>
                        {goal.deadline && (
                          <span className="text-muted-foreground"> &middot; Due {format(new Date(goal.deadline + "T00:00:00"), "MMM d, yyyy")}</span>
                        )}
                      </p>
                    </div>
                    {projected && !isComplete && (
                      <p className="text-xs text-muted-foreground mt-1">
                        At current rate, you&apos;ll reach this by <span className="text-primary">{projected}</span>
                      </p>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Create/Edit Goal Dialog */}
      <Dialog open={goalDialog} onOpenChange={setGoalDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editingGoal ? "Edit Goal" : "New Savings Goal"}</DialogTitle></DialogHeader>
          <form onSubmit={handleGoalSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Goal Name</Label>
              <Input value={goalName} onChange={(e) => setGoalName(e.target.value)} placeholder="e.g. Emergency Fund" required />
            </div>
            <div className="flex gap-2">
              <div className="flex-1 space-y-2">
                <Label>Target Amount</Label>
                <Input type="number" step="0.01" min="0.01" value={goalTarget} onChange={(e) => setGoalTarget(e.target.value)} placeholder="0.00" required />
              </div>
              <div className="w-24 space-y-2">
                <Label>Currency</Label>
                <Select value={goalCurrency} onValueChange={(val) => setGoalCurrency(val as string)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="USD">USD</SelectItem>
                    <SelectItem value="JOD">JOD</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Deadline (optional)</Label>
              <Input type="date" value={goalDeadline} onChange={(e) => setGoalDeadline(e.target.value)} />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="ghost" onClick={() => setGoalDialog(false)}>Cancel</Button>
              <Button type="submit" disabled={saving}>{saving ? "Saving..." : editingGoal ? "Update" : "Create Goal"}</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Contribute Dialog */}
      <Dialog open={!!contribDialog} onOpenChange={() => setContribDialog(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add Contribution</DialogTitle></DialogHeader>
          <form onSubmit={handleContribute} className="space-y-4">
            <div className="flex gap-2">
              <div className="flex-1 space-y-2">
                <Label>Amount</Label>
                <Input type="number" step="0.01" min="0.01" value={contribAmount} onChange={(e) => setContribAmount(e.target.value)} placeholder="0.00" required />
              </div>
              <div className="w-24 space-y-2">
                <Label>Currency</Label>
                <Select value={contribCurrency} onValueChange={(val) => setContribCurrency(val as string)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="USD">USD</SelectItem>
                    <SelectItem value="JOD">JOD</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Notes (optional)</Label>
              <Input value={contribNotes} onChange={(e) => setContribNotes(e.target.value)} placeholder="e.g. From this month's savings" />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="ghost" onClick={() => setContribDialog(null)}>Cancel</Button>
              <Button type="submit" disabled={saving}>{saving ? "Saving..." : "Add Contribution"}</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={!!deleteId} onOpenChange={(open) => { if (!open) setDeleteId(null); }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete Savings Goal</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">Are you sure? This cannot be undone.</p>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setDeleteId(null)}>Cancel</Button>
            <Button variant="destructive" onClick={confirmDelete}>Delete</Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
