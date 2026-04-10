"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandSeparator,
} from "@/components/ui/command";
import {
  ArrowLeftRight,
  CalendarDays,
  Handshake,
  PiggyBank,
  Plus,
  Settings,
  LayoutDashboard,
  Target,
  Tags,
} from "lucide-react";
import { formatCurrency, type Currency } from "@/lib/currency";

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

export function CommandSearch() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResults | null>(null);
  const [searching, setSearching] = useState(false);
  const router = useRouter();
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  // Cmd+K / Ctrl+K to open
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

  const search = useCallback(async (q: string) => {
    if (q.length < 2) {
      setResults(null);
      return;
    }
    setSearching(true);
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`);
      if (res.ok) setResults(await res.json());
    } catch {
      // ignore
    }
    setSearching(false);
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => search(query), 300);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [query, search]);

  function navigate(path: string) {
    setOpen(false);
    setQuery("");
    setResults(null);
    router.push(path);
  }

  const hasResults = results && (
    results.transactions.length > 0 ||
    results.subscriptions.length > 0 ||
    results.debts.length > 0 ||
    results.savings.length > 0
  );

  return (
    <CommandDialog open={open} onOpenChange={setOpen} title="Search" description="Search across your finances">
      <CommandInput
        placeholder="Search transactions, subscriptions, debts..."
        value={query}
        onValueChange={setQuery}
      />
      <CommandList>
        {query.length < 2 ? (
          <>
            {/* Quick actions when no search */}
            <CommandGroup heading="Quick Actions">
              <CommandItem onSelect={() => navigate("/dashboard")}>
                <LayoutDashboard className="mr-2 h-4 w-4 text-muted-foreground" />
                Dashboard
              </CommandItem>
              <CommandItem onSelect={() => navigate("/dashboard/transactions")}>
                <ArrowLeftRight className="mr-2 h-4 w-4 text-muted-foreground" />
                Transactions
              </CommandItem>
              <CommandItem onSelect={() => navigate("/dashboard/subscriptions")}>
                <CalendarDays className="mr-2 h-4 w-4 text-muted-foreground" />
                Subscriptions
              </CommandItem>
              <CommandItem onSelect={() => navigate("/dashboard/budgets")}>
                <Target className="mr-2 h-4 w-4 text-muted-foreground" />
                Budgets
              </CommandItem>
              <CommandItem onSelect={() => navigate("/dashboard/savings")}>
                <PiggyBank className="mr-2 h-4 w-4 text-muted-foreground" />
                Savings Goals
              </CommandItem>
              <CommandItem onSelect={() => navigate("/dashboard/debts")}>
                <Handshake className="mr-2 h-4 w-4 text-muted-foreground" />
                Debts
              </CommandItem>
              <CommandItem onSelect={() => navigate("/dashboard/categories")}>
                <Tags className="mr-2 h-4 w-4 text-muted-foreground" />
                Categories
              </CommandItem>
              <CommandItem onSelect={() => navigate("/dashboard/settings")}>
                <Settings className="mr-2 h-4 w-4 text-muted-foreground" />
                Settings
              </CommandItem>
            </CommandGroup>
          </>
        ) : searching ? (
          <div className="py-6 text-center text-sm text-muted-foreground">Searching...</div>
        ) : !hasResults ? (
          <CommandEmpty>No results found.</CommandEmpty>
        ) : (
          <>
            {results!.transactions.length > 0 && (
              <CommandGroup heading="Transactions">
                {results!.transactions.map((tx) => (
                  <CommandItem key={tx.id} onSelect={() => navigate("/dashboard/transactions")}>
                    <span className="mr-2">{tx.categories?.icon || "📁"}</span>
                    <span className="flex-1 truncate">{tx.description}</span>
                    <span className={`text-xs font-medium ${tx.type === "income" ? "text-[var(--income)]" : "text-[var(--expense)]"}`}>
                      {tx.type === "income" ? "+" : "-"}{formatCurrency(tx.amount, tx.currency as Currency)}
                    </span>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}

            {results!.subscriptions.length > 0 && (
              <>
                <CommandSeparator />
                <CommandGroup heading="Subscriptions">
                  {results!.subscriptions.map((sub) => (
                    <CommandItem key={sub.id} onSelect={() => navigate("/dashboard/subscriptions")}>
                      <CalendarDays className="mr-2 h-4 w-4 text-muted-foreground" />
                      <span className="flex-1 truncate">{sub.name}</span>
                      <span className="text-xs text-muted-foreground">
                        {formatCurrency(sub.amount, sub.currency as Currency)}
                      </span>
                    </CommandItem>
                  ))}
                </CommandGroup>
              </>
            )}

            {results!.debts.length > 0 && (
              <>
                <CommandSeparator />
                <CommandGroup heading="Debts">
                  {results!.debts.map((debt) => (
                    <CommandItem key={debt.id} onSelect={() => navigate("/dashboard/debts")}>
                      <Handshake className="mr-2 h-4 w-4 text-muted-foreground" />
                      <span className="flex-1 truncate">
                        {debt.direction === "i_owe" ? `I owe ${debt.person_name}` : `${debt.person_name} owes me`}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {formatCurrency(debt.amount, debt.currency as Currency)}
                      </span>
                    </CommandItem>
                  ))}
                </CommandGroup>
              </>
            )}

            {results!.savings.length > 0 && (
              <>
                <CommandSeparator />
                <CommandGroup heading="Savings Goals">
                  {results!.savings.map((goal) => (
                    <CommandItem key={goal.id} onSelect={() => navigate("/dashboard/savings")}>
                      <PiggyBank className="mr-2 h-4 w-4 text-muted-foreground" />
                      <span className="flex-1 truncate">{goal.name}</span>
                      <span className="text-xs text-muted-foreground">
                        {Math.round((goal.current_amount / goal.target_amount) * 100)}%
                      </span>
                    </CommandItem>
                  ))}
                </CommandGroup>
              </>
            )}
          </>
        )}
      </CommandList>
    </CommandDialog>
  );
}
