export const APP_VERSION = "2026-04-14-currencies";

export const DEFAULT_EXCHANGE_RATE = 0.709; // 1 USD = 0.709 JOD

export const TRANSACTION_TYPES = ["income", "expense"] as const;
export type TransactionType = (typeof TRANSACTION_TYPES)[number];

export const CURRENCIES = ["USD", "JOD", "EUR", "GBP", "SAR", "AED", "EGP", "TRY", "IQD", "KWD", "BHD", "OMR", "QAR", "LBP", "SYP", "YER", "MAD", "TND", "DZD", "LYD", "SDG"] as const;

export const NAV_ITEMS = [
  { label: "Dashboard", href: "/dashboard", icon: "LayoutDashboard" },
  { label: "Transactions", href: "/dashboard/transactions", icon: "ArrowLeftRight" },
  { label: "Categories", href: "/dashboard/categories", icon: "Tags" },
  { label: "Settings", href: "/dashboard/settings", icon: "Settings" },
] as const;
