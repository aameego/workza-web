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
  const r = (result || {}) as {
    message?: string;
    details?: AccrualDetail[];
    credited?: number;
    alreadyCredited?: number;
  };
  const counts = new Map<string, number>();
  for (const d of r.details || []) {
    if (d.status !== "skipped") continue;
    const key = REASONS[d.reason || ""] || d.reason || "other";
    counts.set(key, (counts.get(key) || 0) + 1);
  }
  const why = [...counts].map(([k, n]) => `${n} ${k}`).join(", ");
  // A month credits once (ledger-guarded); say so instead of looking like nothing ran (BUG-73).
  const once =
    !r.credited && r.alreadyCredited
      ? " This month was already credited, so balances were not added again. Attendance-based leave (e.g. EL) is credited after the month ends."
      : "";
  return `${r.message || "Accrual run completed."}${why ? ` (${why})` : ""}${once}`;
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
