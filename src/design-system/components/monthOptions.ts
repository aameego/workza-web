export const monthIndex = (year: number, month: number) => year * 12 + (month - 1);

/** Months offered: two years back to one year ahead of today, always including the selected one. */
export const monthOptions = (year: number, month: number, today = new Date()) => {
  const now = monthIndex(today.getFullYear(), today.getMonth() + 1);
  const selected = monthIndex(year, month);
  const out: { value: number; label: string }[] = [];
  for (let i = Math.max(now + 12, selected); i >= Math.min(now - 24, selected); i -= 1) {
    out.push({
      value: i,
      label: new Date(Math.floor(i / 12), i % 12, 1).toLocaleString("en-US", {
        month: "long",
        year: "numeric",
      }),
    });
  }
  return out;
};
