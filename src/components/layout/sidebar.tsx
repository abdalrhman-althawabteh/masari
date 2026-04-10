"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, ArrowLeftRight, Tags, Settings, LogOut, CalendarDays, Target, PiggyBank, Handshake } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
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

interface Notifications {
  overdueDebts: number;
  upcomingSubs: number;
}

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [notifs, setNotifs] = useState<Notifications>({ overdueDebts: 0, upcomingSubs: 0 });

  useEffect(() => {
    fetch("/api/notifications")
      .then((r) => r.json())
      .then((data) => setNotifs(data))
      .catch(() => {});
  }, [pathname]); // Re-fetch when navigating

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  function getBadgeCount(badge: string | null): number {
    if (badge === "debts") return notifs.overdueDebts;
    if (badge === "subs") return notifs.upcomingSubs;
    return 0;
  }

  return (
    <aside className="hidden lg:flex lg:flex-col lg:w-64 border-r border-border bg-sidebar h-screen sticky top-0">
      <div className="p-6">
        <Link href="/dashboard" className="flex items-center gap-2">
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
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:text-foreground hover:bg-accent"
              )}
            >
              <item.icon className="h-5 w-5" />
              {item.label}
              {count > 0 && !isActive && (
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

      <div className="p-3 border-t border-border">
        <button
          onClick={handleSignOut}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent w-full transition-colors"
        >
          <LogOut className="h-5 w-5" />
          Sign Out
        </button>
      </div>
    </aside>
  );
}
