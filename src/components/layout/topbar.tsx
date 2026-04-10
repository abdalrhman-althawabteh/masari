"use client";

import { Search } from "lucide-react";
import { MobileNav } from "./mobile-nav";

interface TopbarProps {
  title: string;
  children?: React.ReactNode;
}

export function Topbar({ title, children }: TopbarProps) {
  function openSearch() {
    // Trigger Cmd+K programmatically
    window.dispatchEvent(new KeyboardEvent("keydown", { key: "k", metaKey: true }));
  }

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b border-border bg-background/80 backdrop-blur-sm px-4 lg:px-6">
      <MobileNav />
      <h1 className="text-lg font-semibold">{title}</h1>
      <div className="ml-auto flex items-center gap-2">
        <button
          onClick={openSearch}
          className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg border border-border text-sm text-muted-foreground hover:text-foreground hover:border-foreground/20 transition-colors"
        >
          <Search className="h-3.5 w-3.5" />
          <span>Search...</span>
          <kbd className="ml-2 px-1.5 py-0.5 rounded bg-accent text-[10px] font-mono">⌘K</kbd>
        </button>
        <button
          onClick={openSearch}
          className="sm:hidden p-2 rounded-lg text-muted-foreground hover:text-foreground transition-colors"
        >
          <Search className="h-5 w-5" />
        </button>
        {children}
      </div>
    </header>
  );
}
