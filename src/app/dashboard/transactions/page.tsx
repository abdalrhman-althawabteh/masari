"use client";

import { useEffect, useState, useCallback } from "react";
import { format } from "date-fns";
import { Plus, Pencil, Trash2, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Topbar } from "@/components/layout/topbar";
import { TransactionForm } from "@/components/transactions/transaction-form";
import { formatCurrency } from "@/lib/currency";
import type { TransactionInput } from "@/lib/validations/transaction";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface TransactionWithCategory {
  id: string;
  user_id: string;
  type: "income" | "expense";
  amount: number;
  currency: "USD" | "JOD";
  category_id: string;
  description: string;
  source: string | null;
  date: string;
  is_subscription: boolean;
  subscription_id: string | null;
  created_via: "app" | "telegram";
  created_at: string;
  updated_at: string;
  categories: {
    name: string;
    icon: string | null;
    type: string;
  };
}

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<TransactionWithCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<TransactionWithCategory | undefined>();
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [total, setTotal] = useState(0);

  const fetchTransactions = useCallback(async () => {
    const params = new URLSearchParams();
    if (typeFilter !== "all") params.set("type", typeFilter);
    if (search) params.set("search", search);

    const res = await fetch(`/api/transactions?${params}`);
    if (res.ok) {
      const json = await res.json();
      setTransactions(json.data);
      setTotal(json.count || 0);
    }
    setLoading(false);
  }, [typeFilter, search]);

  useEffect(() => {
    const timer = setTimeout(fetchTransactions, search ? 300 : 0);
    return () => clearTimeout(timer);
  }, [fetchTransactions, search]);

  async function handleSubmit(data: TransactionInput) {
    setSaving(true);
    const url = editingTransaction
      ? `/api/transactions/${editingTransaction.id}`
      : "/api/transactions";
    const method = editingTransaction ? "PUT" : "POST";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (res.ok) {
      toast.success(editingTransaction ? "Transaction updated" : "Transaction added");
      setDialogOpen(false);
      setEditingTransaction(undefined);
      fetchTransactions();
    } else {
      const err = await res.json();
      toast.error(err.error || "Something went wrong");
    }
    setSaving(false);
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this transaction?")) return;

    const res = await fetch(`/api/transactions/${id}`, { method: "DELETE" });
    if (res.ok) {
      toast.success("Transaction deleted");
      fetchTransactions();
    } else {
      toast.error("Failed to delete");
    }
  }

  return (
    <>
      <Topbar title="Transactions">
        <Button onClick={() => { setEditingTransaction(undefined); setDialogOpen(true); }} size="sm">
          <Plus className="h-4 w-4 mr-1" />
          Add
        </Button>
      </Topbar>

      <div className="p-4 lg:p-6 space-y-4">
        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search transactions..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={typeFilter} onValueChange={(val) => setTypeFilter(val as string)}>
            <SelectTrigger className="w-full sm:w-36">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="expense">Expenses</SelectItem>
              <SelectItem value="income">Income</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Results count */}
        <p className="text-sm text-muted-foreground">{total} transaction{total !== 1 ? "s" : ""}</p>

        {/* Transaction list */}
        <Card>
          <CardContent className="p-0">
            {loading ? (
              <div className="p-4 space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-14 w-full" />
                ))}
              </div>
            ) : transactions.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                <p>No transactions found.</p>
                <Button
                  variant="link"
                  className="text-primary mt-1"
                  onClick={() => { setEditingTransaction(undefined); setDialogOpen(true); }}
                >
                  Add your first transaction
                </Button>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {transactions.map((t) => (
                  <div
                    key={t.id}
                    className="flex items-center justify-between px-4 py-3 hover:bg-accent/30 group"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="text-lg shrink-0">
                        {t.categories?.icon || "📁"}
                      </span>
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{t.description}</p>
                        <p className="text-xs text-muted-foreground">
                          {t.categories?.name} &middot; {format(new Date(t.date + "T00:00:00"), "MMM d, yyyy")}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span
                        className={cn(
                          "text-sm font-semibold",
                          t.type === "income" ? "text-[var(--income)]" : "text-[var(--expense)]"
                        )}
                      >
                        {t.type === "income" ? "+" : "-"}
                        {formatCurrency(t.amount, t.currency)}
                      </span>
                      <div className="flex items-center gap-0.5">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => {
                            setEditingTransaction(t);
                            setDialogOpen(true);
                          }}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-destructive hover:text-destructive"
                          onClick={() => handleDelete(t.id)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingTransaction ? "Edit Transaction" : "New Transaction"}
            </DialogTitle>
          </DialogHeader>
          <TransactionForm
            transaction={editingTransaction}
            onSubmit={handleSubmit}
            onCancel={() => setDialogOpen(false)}
            loading={saving}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}
