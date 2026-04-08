export type Currency = "USD" | "JOD";

export function convertCurrency(
  amount: number,
  from: Currency,
  to: Currency,
  exchangeRate: number // 1 USD = exchangeRate JOD
): number {
  if (from === to) return amount;
  if (from === "USD" && to === "JOD") return amount * exchangeRate;
  // JOD to USD
  return amount / exchangeRate;
}

export function formatCurrency(amount: number, currency: Currency): string {
  if (currency === "USD") {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  }
  return `${amount.toFixed(2)} JOD`;
}

export function formatCurrencyCompact(amount: number, currency: Currency): string {
  if (Math.abs(amount) >= 1000) {
    const formatted = (amount / 1000).toFixed(1);
    const suffix = currency === "USD" ? "$" : " JOD";
    return currency === "USD" ? `${suffix}${formatted}K` : `${formatted}K${suffix}`;
  }
  return formatCurrency(amount, currency);
}
