export const CURRENCY_CODES = [
  "USD", "JOD", "EUR", "GBP", "SAR", "AED", "EGP", "TRY",
  "IQD", "KWD", "BHD", "OMR", "QAR", "LBP", "SYP", "YER",
  "MAD", "TND", "DZD", "LYD", "SDG",
] as const;

export type Currency = (typeof CURRENCY_CODES)[number];

interface CurrencyInfo {
  code: Currency;
  symbol: string;
  flag: string;
  /** Approximate rate: 1 USD = X of this currency */
  defaultRate: number;
}

const INFO: Record<Currency, Omit<CurrencyInfo, "code">> = {
  USD: { symbol: "$", flag: "🇺🇸", defaultRate: 1 },
  JOD: { symbol: "JD", flag: "🇯🇴", defaultRate: 0.709 },
  EUR: { symbol: "€", flag: "🇪🇺", defaultRate: 0.92 },
  GBP: { symbol: "£", flag: "🇬🇧", defaultRate: 0.79 },
  SAR: { symbol: "﷼", flag: "🇸🇦", defaultRate: 3.75 },
  AED: { symbol: "د.إ", flag: "🇦🇪", defaultRate: 3.67 },
  EGP: { symbol: "E£", flag: "🇪🇬", defaultRate: 50.5 },
  TRY: { symbol: "₺", flag: "🇹🇷", defaultRate: 38.5 },
  IQD: { symbol: "ع.د", flag: "🇮🇶", defaultRate: 1310 },
  KWD: { symbol: "د.ك", flag: "🇰🇼", defaultRate: 0.307 },
  BHD: { symbol: "BD", flag: "🇧🇭", defaultRate: 0.376 },
  OMR: { symbol: "ر.ع", flag: "🇴🇲", defaultRate: 0.385 },
  QAR: { symbol: "ر.ق", flag: "🇶🇦", defaultRate: 3.64 },
  LBP: { symbol: "ل.ل", flag: "🇱🇧", defaultRate: 89500 },
  SYP: { symbol: "ل.س", flag: "🇸🇾", defaultRate: 13000 },
  YER: { symbol: "ر.ي", flag: "🇾🇪", defaultRate: 250 },
  MAD: { symbol: "د.م", flag: "🇲🇦", defaultRate: 9.9 },
  TND: { symbol: "د.ت", flag: "🇹🇳", defaultRate: 3.12 },
  DZD: { symbol: "د.ج", flag: "🇩🇿", defaultRate: 135 },
  LYD: { symbol: "ل.د", flag: "🇱🇾", defaultRate: 4.85 },
  SDG: { symbol: "ج.س", flag: "🇸🇩", defaultRate: 601 },
};

export const CURRENCY_LIST: (CurrencyInfo & { code: Currency })[] = CURRENCY_CODES.map((code) => ({
  code,
  ...INFO[code],
}));

/** Returns [USD, userCurrency] — only the currencies the user works with */
export function getUserCurrencies(defaultCurrency: Currency) {
  if (defaultCurrency === "USD") return CURRENCY_LIST.filter((c) => c.code === "USD");
  return CURRENCY_LIST.filter((c) => c.code === "USD" || c.code === defaultCurrency);
}

export function getCurrencySymbol(currency: Currency): string {
  return INFO[currency]?.symbol || currency;
}

export function getDefaultRate(currency: Currency): number {
  return INFO[currency]?.defaultRate ?? 1;
}

/**
 * Convert between any two currencies using USD as the base.
 * exchangeRate = how many units of the user's default currency per 1 USD.
 */
export function convertCurrency(
  amount: number,
  from: Currency,
  to: Currency,
  exchangeRate: number
): number {
  if (from === to) return amount;
  if (from === "USD") return amount * exchangeRate;
  if (to === "USD") return amount / exchangeRate;
  return amount;
}

export function formatCurrency(amount: number, currency: Currency): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatCurrencyCompact(amount: number, currency: Currency): string {
  if (Math.abs(amount) >= 1000) {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
      notation: "compact",
      maximumFractionDigits: 1,
    }).format(amount);
  }
  return formatCurrency(amount, currency);
}
