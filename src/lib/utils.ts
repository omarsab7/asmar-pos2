export const money = (n: number) => "$" + (Math.round(n * 100) / 100).toFixed(2);

// start of today (local server time)
export function startOfToday(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

// Normalize Arabic text: strip tashkeel, unify alef/ya, lowercase latin
export function normAr(s: string): string {
  return (s || "")
    .replace(/[\u064B-\u0652\u0670]/g, "")
    .replace(/[إأآا]/g, "ا")
    .replace(/ى/g, "ي")
    .replace(/ة/g, "ه")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}
