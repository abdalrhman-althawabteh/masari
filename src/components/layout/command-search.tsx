"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import {
  Search,
  ArrowLeftRight,
  CalendarDays,
  Handshake,
  PiggyBank,
  Settings,
  LayoutDashboard,
  Target,
  Tags,
} from "lucide-react";
import { formatCurrency, type Currency } from "@/lib/currency";
import { cn } from "@/lib/utils";

interface SearchResults {
  transactions: Array<{
    id: string;
    type: string;
    amount: number;
    currency: string;
    description: string;
    date: string;
    categories: { name: string; icon: string | null };
  }>;
  subscriptions: Array<{
    id: string;
    name: string;
    amount: number;
    currency: string;
    status: string;
  }>;
  debts: Array<{
    id: string;
    direction: string;
    person_name: string;
    amount: number;
    currency: string;
  }>;
  savings: Array<{
    id: string;
    name: string;
    target_amount: number;
    current_amount: number;
    target_currency: string;
  }>;
}

const quickActions = [
  { icon: LayoutDashboard, label: "Dashboard", href: "/dashboard" },
  { icon: ArrowLeftRight, label: "Transactions", href: "/dashboard/transactions" },
  { icon: CalendarDays, label: "Subscriptions", href: "/dashboard/subscriptions" },
  { icon: Target, label: "Budgets", href: "/dashboard/budgets" },
  { icon: PiggyBank, label: "Savings Goals", href: "/dashboard/savings" },
  { icon: Handshake, label: "Debts", href: "/dashboard/debts" },
  { icon: Tags, label: "Categories", href: "/dashboard/categories" },
  { icon: Settings, label: "Settings", href: "/dashboard/settings" },
];

export function CommandSearch() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResults | null>(null);
  const [searching, setSearching] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, []);

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 100);
    } else {
      setQuery("");
      setResults(null);
    }
  }, [open]);

  const search = useCallback(async (q: string) => {
    if (q.length < 2) {
      setResults(null);
      return;
    }
    setSearching(true);
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`);
      if (res.ok) setResults(await res.json());
    } catch { /* ignore */ }
    setSearching(false);
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => search(query), 300);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [query, search]);

  function navigate(path: string) {
    setOpen(false);
    router.push(path);
  }

  const hasResults = results && (
    results.transactions.length > 0 ||
    results.subscriptions.length > 0 ||
    results.debts.length > 0 ||
    results.savings.length > 0
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="p-0 gap-0 max-w-lg" showCloseButton={false}>
        <DialogTitle className="sr-only">Search</DialogTitle>

        {/* Search input */}
        <div className="flex items-center gap-3 px-4 border-b border-border">
          <Search className="h-4 w-4 text-muted-foreground shrink-0" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Search transactions, subscriptions, debts..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1 h-12 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          />
          <kbd className="px-1.5 py-0.5 rounded bg-accent text-[10px] font-mono text-muted-foreground">ESC</kbd>
        </div>

        {/* Results */}
        <div className="max-h-80 overflow-y-auto p-2">
          {query.length < 2 ? (
            <div>
              <p className="px-3 py-1.5 text-xs font-medium text-muted-foreground">Navigate</p>
              {quickActions.map((action) => (
                <button
                  key={action.href}
                  onClick={() => navigate(action.href)}
                  className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                >
                  <action.icon className="h-4 w-4" />
                  {action.label}
                </button>
              ))}
            </div>
          ) : searching ? (
            <p className="py-8 text-center text-sm text-muted-foreground">Searching...</p>
          ) : !hasResults ? (
            <p className="py-8 text-center text-sm text-muted-foreground">No results found for &quot;{query}&quot;</p>
          ) : (
            <div className="space-y-1">
              {results!.transactions.length > 0 && (
                <div>
                  <p className="px-3 py-1.5 text-xs font-medium text-muted-foreground">Transactions</p>
                  {results!.transactions.map((tx) => (
                    <button
                      key={tx.id}
                      onClick={() => navigate("/dashboard/transactions")}
                      className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm hover:bg-accent transition-colors"
                    >
                      <span>{tx.categories?.icon || "📁"}</span>
                      <span className="flex-1 text-left truncate">{tx.description}</span>
                      <span className={cn("text-xs font-medium", tx.type === "income" ? "text-[var(--income)]" : "text-[var(--expense)]")}>
                        {tx.type === "income" ? "+" : "-"}{formatCurrency(tx.amount, tx.currency as Currency)}
                      </span>
                    </button>
                  ))}
                </div>
              )}

              {results!.subscriptions.length > 0 && (
                <div>
                  <p className="px-3 py-1.5 text-xs font-medium text-muted-foreground">Subscriptions</p>
                  {results!.subscriptions.map((sub) => (
                    <button
                      key={sub.id}
                      onClick={() => navigate("/dashboard/subscriptions")}
                      className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm hover:bg-accent transition-colors"
                    >
                      <CalendarDays className="h-4 w-4 text-muted-foreground" />
                      <span className="flex-1 text-left truncate">{sub.name}</span>
                      <span className="text-xs text-muted-foreground">{formatCurrency(sub.amount, sub.currency as Currency)}</span>
                    </button>
                  ))}
                </div>
              )}

              {results!.debts.length > 0 && (
                <div>
                  <p className="px-3 py-1.5 text-xs font-medium text-muted-foreground">Debts</p>
                  {results!.debts.map((debt) => (
                    <button
                      key={debt.id}
                      onClick={() => navigate("/dashboard/debts")}
                      className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm hover:bg-accent transition-colors"
                    >
                      <Handshake className="h-4 w-4 text-muted-foreground" />
                      <span className="flex-1 text-left truncate">
                        {debt.direction === "i_owe" ? `I owe ${debt.person_name}` : `${debt.person_name} owes me`}
                      </span>
                      <span className="text-xs text-muted-foreground">{formatCurrency(debt.amount, debt.currency as Currency)}</span>
                    </button>
                  ))}
                </div>
              )}

              {results!.savings.length > 0 && (
                <div>
                  <p className="px-3 py-1.5 text-xs font-medium text-muted-foreground">Savings Goals</p>
                  {results!.savings.map((goal) => (
                    <button
                      key={goal.id}
                      onClick={() => navigate("/dashboard/savings")}
                      className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm hover:bg-accent transition-colors"
                    >
                      <PiggyBank className="h-4 w-4 text-muted-foreground" />
                      <span className="flex-1 text-left truncate">{goal.name}</span>
                      <span className="text-xs text-muted-foreground">
                        {Math.round((goal.current_amount / goal.target_amount) * 100)}%
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
