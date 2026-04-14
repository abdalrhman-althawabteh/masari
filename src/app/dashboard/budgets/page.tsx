"use client";

import { useEffect, useState, useCallback } from "react";
import { Plus, Pencil, Trash2, Target, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Topbar } from "@/components/layout/topbar";
import { formatCurrency, getUserCurrencies, type Currency } from "@/lib/currency";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface Category {
  id: string;
  name: string;
  icon: string | null;
  type: string;
}

interface BudgetWithSpent {
  id: string;
  user_id: string;
  category_id: string | null;
  amount: number;
  currency: string;
  period: string;
  budget_converted: number;
  spent: number;
  percentage: number;
  categories: { name: string; icon: string | null } | null;
}

interface BudgetData {
  budgets: BudgetWithSpent[];
  currency: string;
  totalSpending: number;
}

export default function BudgetsPage() {
  const [data, setData] = useState<BudgetData | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingBudget, setEditingBudget] = useState<BudgetWithSpent | undefined>();

  // Form state
  const [categoryId, setCategoryId] = useState<string>("overall");
  const [amount, setAmount] = useState("");
  const [budgetCurrency, setBudgetCurrency] = useState("USD");
  const [defaultCurrency, setDefaultCurrency] = useState<Currency>("USD");

  const fetchBudgets = useCallback(async () => {
    const res = await fetch("/api/budgets");
    if (res.ok) {
      setData(await res.json());
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchBudgets();
    fetch("/api/categories").then((res) => res.json()).then((cats) => setCategories(cats));
    fetch("/api/settings").then(r => r.json()).then(d => {
      if (d.default_currency) { setDefaultCurrency(d.default_currency as Currency); setBudgetCurrency(d.default_currency); }
    }).catch(() => {});
  }, [fetchBudgets]);

  const expenseCategories = categories.filter(
    (c) => c.type === "expense" || c.type === "both"
  );

  function openCreate() {
    setEditingBudget(undefined);
    setCategoryId("overall");
    setAmount("");
    setBudgetCurrency(data?.currency || "USD");
    setDialogOpen(true);
  }

  function openEdit(budget: BudgetWithSpent) {
    setEditingBudget(budget);
    setCategoryId(budget.category_id || "overall");
    setAmount(String(budget.amount));
    setBudgetCurrency(budget.currency);
    setDialogOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);

    const payload = {
      category_id: categoryId === "overall" ? null : categoryId,
      amount: parseFloat(amount),
      currency: budgetCurrency,
      period: "monthly",
    };

    const url = editingBudget ? `/api/budgets/${editingBudget.id}` : "/api/budgets";
    const method = editingBudget ? "PUT" : "POST";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (res.ok) {
      toast.success(editingBudget ? "Budget updated" : "Budget set");
      setDialogOpen(false);
      fetchBudgets();
    } else {
      const err = await res.json();
      toast.error(err.error || "Something went wrong");
    }
    setSaving(false);
  }

  async function confirmDelete() {
    if (!deleteId) return;
    const res = await fetch(`/api/budgets/${deleteId}`, { method: "DELETE" });
    if (res.ok) {
      toast.success("Budget removed");
      fetchBudgets();
    } else {
      toast.error("Failed to remove");
    }
    setDeleteId(null);
  }

  function getBarColor(percentage: number) {
    if (percentage >= 100) return "bg-[var(--expense)]";
    if (percentage >= 80) return "bg-[var(--warning)]";
    return "bg-[var(--income)]";
  }

  const displayCurrency = (data?.currency || "USD") as Currency;

  return (
    <>
      <Topbar title="Budgets">
        <Button onClick={openCreate} size="sm">
          <Plus className="h-4 w-4 mr-1" />
          Set Budget
        </Button>
      </Topbar>

      <div className="p-4 lg:p-6 space-y-6">
        {loading ? (
          <div className="space-y-4">
            <Skeleton className="h-24" />
            <Skeleton className="h-24" />
            <Skeleton className="h-24" />
          </div>
        ) : !data || data.budgets.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center text-muted-foreground">
              <Target className="h-10 w-10 mx-auto mb-3 text-muted-foreground/50" />
              <p>No budgets set yet.</p>
              <p className="text-xs mt-1">Set a total monthly budget or per-category limits to track your spending.</p>
              <Button variant="link" className="text-primary mt-2" onClick={openCreate}>
                Set your first budget
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {data.budgets.map((budget) => {
              const isOverall = !budget.category_id;
              const label = isOverall
                ? "Total Monthly Budget"
                : `${budget.categories?.icon || "📁"} ${budget.categories?.name}`;
              const isOver = budget.percentage >= 100;
              const isWarning = budget.percentage >= 80 && budget.percentage < 100;

              return (
                <Card key={budget.id} className={cn(isOver && "border-[var(--expense)]/30")}>
                  <CardContent className="p-5">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium">{label}</p>
                        {isOver && (
                          <span className="flex items-center gap-1 text-xs text-[var(--expense)]">
                            <AlertTriangle className="h-3 w-3" /> Over budget
                          </span>
                        )}
                        {isWarning && (
                          <span className="flex items-center gap-1 text-xs text-[var(--warning)]">
                            <AlertTriangle className="h-3 w-3" /> Approaching limit
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => openEdit(budget)}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-destructive hover:text-destructive"
                          onClick={() => setDeleteId(budget.id)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>

                    {/* Progress bar */}
                    <div className="w-full h-3 rounded-full bg-accent overflow-hidden">
                      <div
                        className={cn(
                          "h-full rounded-full transition-all duration-500",
                          getBarColor(budget.percentage)
                        )}
                        style={{ width: `${Math.min(budget.percentage, 100)}%` }}
                      />
                    </div>

                    <div className="flex items-center justify-between mt-2">
                      <p className="text-xs text-muted-foreground">
                        {formatCurrency(budget.spent, displayCurrency)} spent
                      </p>
                      <p className="text-xs">
                        <span className={cn(
                          "font-semibold",
                          isOver ? "text-[var(--expense)]" : isWarning ? "text-[var(--warning)]" : "text-foreground"
                        )}>
                          {budget.percentage}%
                        </span>
                        <span className="text-muted-foreground">
                          {" "}of {formatCurrency(budget.budget_converted, displayCurrency)}
                        </span>
                      </p>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingBudget ? "Edit Budget" : "Set Budget"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Category</Label>
              <Select
                value={categoryId}
                onValueChange={(val) => setCategoryId(val as string)}
                disabled={!!editingBudget}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="overall">Overall Total Budget</SelectItem>
                  {expenseCategories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.icon} {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {!editingBudget && (
                <p className="text-xs text-muted-foreground">
                  Choose &quot;Overall&quot; for a total monthly limit, or pick a specific category.
                </p>
              )}
            </div>

            <div className="flex gap-2">
              <div className="flex-1 space-y-2">
                <Label htmlFor="budget-amount">Monthly Limit</Label>
                <Input
                  id="budget-amount"
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  required
                />
              </div>
              <div className="w-24 space-y-2">
                <Label>Currency</Label>
                <Select value={budgetCurrency} onValueChange={(val) => val && setBudgetCurrency(val)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {getUserCurrencies(defaultCurrency).map((c) => (
                      <SelectItem key={c.code} value={c.code}>{c.code}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="ghost" onClick={() => setDialogOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={saving}>
                {saving ? "Saving..." : editingBudget ? "Update" : "Set Budget"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={!!deleteId} onOpenChange={(open) => { if (!open) setDeleteId(null); }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Remove Budget</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">Are you sure? This cannot be undone.</p>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setDeleteId(null)}>Cancel</Button>
            <Button variant="destructive" onClick={confirmDelete}>Remove</Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
