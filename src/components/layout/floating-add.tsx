"use client";

import { useState, useEffect } from "react";
import { Plus } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { TransactionForm } from "@/components/transactions/transaction-form";
import type { TransactionInput } from "@/lib/validations/transaction";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export function FloatingAdd() {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const router = useRouter();

  // Keyboard shortcut: N to open
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (
        e.key === "n" &&
        !e.metaKey &&
        !e.ctrlKey &&
        !e.altKey &&
        !(e.target instanceof HTMLInputElement) &&
        !(e.target instanceof HTMLTextAreaElement) &&
        !(e.target instanceof HTMLSelectElement)
      ) {
        e.preventDefault();
        setOpen(true);
      }
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, []);

  async function handleSubmit(data: TransactionInput) {
    setSaving(true);
    const res = await fetch("/api/transactions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (res.ok) {
      toast.success("Transaction added");
      setOpen(false);
      router.refresh();
    } else {
      const err = await res.json();
      toast.error(err.error || "Something went wrong");
    }
    setSaving(false);
  }

  return (
    <>
      {/* Floating button — visible on mobile */}
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 z-40 lg:hidden flex items-center justify-center w-14 h-14 rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/25 hover:bg-primary/90 active:scale-95 transition-all"
        aria-label="Add transaction"
      >
        <Plus className="h-6 w-6" />
      </button>

      {/* Keyboard shortcut hint — visible on desktop */}
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 z-40 hidden lg:flex items-center gap-2 px-4 py-2.5 rounded-xl bg-card border border-border text-sm text-muted-foreground hover:text-foreground hover:border-primary/30 transition-all shadow-lg"
        aria-label="Add transaction"
      >
        <Plus className="h-4 w-4" />
        New transaction
        <kbd className="ml-1 px-1.5 py-0.5 rounded bg-accent text-[10px] font-mono font-medium">N</kbd>
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>New Transaction</DialogTitle>
          </DialogHeader>
          <TransactionForm
            onSubmit={handleSubmit}
            onCancel={() => setOpen(false)}
            loading={saving}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}
