type AccrualDetail = { status?: string; reason?: string };
type AccrualResult = { message?: string; details?: AccrualDetail[] } | unknown;

const REASONS: Record<string, string> = {
  "zero-credit": "nothing due — yearly cap or attendance rule",
  "not-joined-yet": "not joined yet",
  exited: "exited",
  inactive: "inactive",
  deleted: "deleted",
};

/** Backend summary ("Credited: X · Already credited: Y · Skipped: Z") plus why people were skipped. */
export const accrualResultMessage = (result: AccrualResult): string => {
  const r = (result || {}) as { message?: string; details?: AccrualDetail[] };
  const counts = new Map<string, number>();
  for (const d of r.details || []) {
    if (d.status !== "skipped") continue;
    const key = REASONS[d.reason || ""] || d.reason || "other";
    counts.set(key, (counts.get(key) || 0) + 1);
  }
  const why = [...counts].map(([k, n]) => `${n} ${k}`).join(", ");
  return `${r.message || "Accrual run completed."}${why ? ` (${why})` : ""}`;
};

/** Current month and the 12 before it, newest first, as "YYYY-M". */
export const accrualMonthOptions = (now = new Date()) =>
  Array.from({ length: 13 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    return {
      value: `${d.getFullYear()}-${d.getMonth() + 1}`,
      label: d.toLocaleString("en-GB", { month: "long", year: "numeric" }),
    };
  });
