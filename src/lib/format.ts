/** Formats an integer amount of Taka for display (e.g. 2500 -> "৳2,500"). */
export function formatTaka(amount: number): string {
  return `৳${amount.toLocaleString("en-US")}`;
}
