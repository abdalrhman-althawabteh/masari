"use client";

import { useState, useEffect } from "react";
import { X, Sparkles } from "lucide-react";
import { APP_VERSION } from "@/lib/constants";

const UPDATES = [
  "21 currencies now supported — SAR, AED, EGP, KWD, QAR, and more",
];

export function WhatsNew() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const lastVersion = localStorage.getItem("masari_last_version");
    const onboarded = localStorage.getItem("masari_onboarding_done");

    // Only show to returning users (who completed onboarding before)
    if (onboarded && lastVersion !== APP_VERSION) {
      setVisible(true);
    }

    // Always update the version so it doesn't show again
    localStorage.setItem("masari_last_version", APP_VERSION);
  }, []);

  if (!visible) return null;

  return (
    <div className="bg-[#1a2a10] border border-[#A3FF3C]/20 rounded-xl p-4 flex items-start gap-3 animate-in fade-in slide-in-from-top-2 duration-300">
      <Sparkles className="h-5 w-5 text-[#A3FF3C] mt-0.5 shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-[#A3FF3C] mb-1">What&apos;s New</p>
        {UPDATES.map((update, i) => (
          <p key={i} className="text-sm text-muted-foreground">{update}</p>
        ))}
      </div>
      <button
        onClick={() => setVisible(false)}
        className="text-muted-foreground hover:text-foreground shrink-0 p-1"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
