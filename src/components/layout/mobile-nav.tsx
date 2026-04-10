"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Menu, LayoutDashboard, ArrowLeftRight, Tags, Settings, LogOut, CalendarDays, Target, PiggyBank, Handshake } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

const navItems = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard, badge: null as string | null },
  { label: "Transactions", href: "/dashboard/transactions", icon: ArrowLeftRight, badge: null },
  { label: "Subscriptions", href: "/dashboard/subscriptions", icon: CalendarDays, badge: "subs" },
  { label: "Budgets", href: "/dashboard/budgets", icon: Target, badge: null },
  { label: "Savings", href: "/dashboard/savings", icon: PiggyBank, badge: null },
  { label: "Debts", href: "/dashboard/debts", icon: Handshake, badge: "debts" },
  { label: "Categories", href: "/dashboard/categories", icon: Tags, badge: null },
  { label: "Settings", href: "/dashboard/settings", icon: Settings, badge: null },
];

export function MobileNav() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const [notifs, setNotifs] = useState({ overdueDebts: 0, upcomingSubs: 0 });

  useEffect(() => {
    fetch("/api/notifications")
      .then((r) => r.json())
      .then((data) => setNotifs(data))
      .catch(() => {});
  }, [pathname]);

  function getBadgeCount(badge: string | null): number {
    if (badge === "debts") return notifs.overdueDebts;
    if (badge === "subs") return notifs.upcomingSubs;
    return 0;
  }

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger
        className="lg:hidden inline-flex items-center justify-center rounded-lg p-2 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors relative"
      >
        <Menu className="h-5 w-5" />
        {/* Show a dot on hamburger if there are notifications */}
        {(notifs.overdueDebts > 0 || notifs.upcomingSubs > 0) && (
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[var(--expense)]" />
        )}
      </SheetTrigger>
      <SheetContent side="left" className="w-64 bg-sidebar p-0 flex flex-col">
        <SheetTitle className="sr-only">Navigation</SheetTitle>
        <div className="p-6 shrink-0">
          <Link href="/dashboard" onClick={() => setOpen(false)} className="flex items-center gap-2">
            <span className="text-xl font-bold text-primary">Masari</span>
            <span className="text-sm text-muted-foreground">مصاري</span>
          </Link>
        </div>

        <nav className="flex-1 px-3 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const isActive =
              item.href === "/dashboard"
                ? pathname === "/dashboard"
                : pathname.startsWith(item.href);
            const count = getBadgeCount(item.badge);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium transition-colors min-h-[44px]",
                  isActive
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:text-foreground hover:bg-accent"
                )}
              >
                <item.icon className="h-5 w-5" />
                {item.label}
                {count > 0 && (
                  <span className={cn(
                    "ml-auto text-[10px] font-bold min-w-[18px] h-[18px] flex items-center justify-center rounded-full",
                    item.badge === "debts"
                      ? "bg-[var(--expense)] text-white"
                      : "bg-[var(--warning)] text-black"
                  )}>
                    {count}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        <div className="p-3 shrink-0 border-t border-border">
          <button
            onClick={handleSignOut}
            className="flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent w-full transition-colors min-h-[44px]"
          >
            <LogOut className="h-5 w-5" />
            Sign Out
          </button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
