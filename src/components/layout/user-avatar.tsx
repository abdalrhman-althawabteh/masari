"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

interface UserInfo {
  name: string;
  email: string;
  avatar_url: string | null;
}

export function useUser() {
  const [user, setUser] = useState<UserInfo | null>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user: authUser } }) => {
      if (authUser) {
        setUser({
          name:
            authUser.user_metadata?.name ||
            authUser.user_metadata?.full_name ||
            authUser.email?.split("@")[0] ||
            "User",
          email: authUser.email || "",
          avatar_url:
            authUser.user_metadata?.avatar_url ||
            authUser.user_metadata?.picture ||
            null,
        });
      }
    });
  }, []);

  return user;
}

export function UserAvatar({
  size = "default",
  className,
}: {
  size?: "sm" | "default";
  className?: string;
}) {
  const user = useUser();

  if (!user) return null;

  const sizeClass = size === "sm" ? "h-7 w-7 text-[10px]" : "h-9 w-9 text-xs";

  const initials = user.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  if (user.avatar_url) {
    return (
      <img
        src={user.avatar_url}
        alt={user.name}
        className={cn("rounded-full object-cover", sizeClass, className)}
        referrerPolicy="no-referrer"
      />
    );
  }

  return (
    <div
      className={cn(
        "rounded-full bg-primary/10 text-primary font-semibold flex items-center justify-center",
        sizeClass,
        className
      )}
    >
      {initials}
    </div>
  );
}

export function UserProfile({ compact = false }: { compact?: boolean }) {
  const user = useUser();

  if (!user) return null;

  return (
    <div className="flex items-center gap-3 min-w-0">
      <UserAvatar size={compact ? "sm" : "default"} />
      <div className="min-w-0">
        <p className="text-sm font-medium truncate">{user.name}</p>
        {!compact && (
          <p className="text-xs text-muted-foreground truncate">{user.email}</p>
        )}
      </div>
    </div>
  );
}
