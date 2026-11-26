/**
 * Leave-policy form helpers — ported from AameegoGig-Frontend
 * `utils/leavePolicyForm.js` + `LeavePolicyManager.jsx` (describeType /
 * handleSaveCustom) so the Settings tab edits, validates and saves the same
 * payload the backend `sanitizeCustomLeaveTypes` accepts.
 */
import type { LeavePolicy, LeavePolicyType } from "../../services/leaveService";

export const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

/** Types that show as their own card (with a balance / quota). */
export const BALANCE_CODES = ["CL", "SL", "EL", "CO", "WFH"];
/** Types whose accrual is a plain fixed monthly credit. */
export const STANDARD_CODES = ["CL", "SL", "EL"];

export const EL_ACCRUAL_METHODS = [
  "fixed_monthly",
  "full_if_min_present",
  "prorate_paid_days",
];

export const asNumberOrNull = (
  v: number | string | null | undefined,
): number | null => {
  if (v === "" || v === null || v === undefined) return null;
  const n = Number(v);
  return Number.isNaN(n) ? null : n;
};

export const monthLabel = (month: number | string | undefined): string =>
  MONTHS[Number(month) - 1] || "January";

/** True when a limit/threshold field actually holds a value (blank = unset). */
const isSet = (v: number | string | null | undefined): boolean =>
  v !== "" && v !== null && v !== undefined;

export const elAccrualMethod = (t?: LeavePolicyType): string =>
  t?.code === "EL" && EL_ACCRUAL_METHODS.includes(t?.accrual?.method || "")
    ? (t.accrual?.method as string)
    : t?.accrual?.method || "fixed_monthly";

export const needsMonthlyCredit = (method: string): boolean =>
  ["fixed_monthly", "prorate_paid_days", "full_if_min_present"].includes(
    method,
  );

export const showsMinPaidDaysField = (method: string): boolean =>
  method === "full_if_min_present" || method === "prorate_paid_days";

export const showsWorkingDaysField = (method: string): boolean =>
  method === "prorate_paid_days";

/** CL/SL/EL accrual as the API expects it (EL may use the richer methods). */
export const elAccrualFieldsForSave = (t?: LeavePolicyType) => {
  const method = t?.code === "EL" ? elAccrualMethod(t) : t?.accrual?.method || "fixed_monthly";
  return {
    method,
    monthlyCredit: Number(t?.accrual?.monthlyCredit ?? 0.5),
    yearlyCap: Number(t?.accrual?.yearlyCap ?? 6),
    minPresentDays: showsMinPaidDaysField(method)
      ? Math.max(0, Number(t?.accrual?.minPresentDays) || 0)
      : 0,
    standardWorkingDays: showsWorkingDaysField(method)
      ? Math.max(0, Number(t?.accrual?.standardWorkingDays) || 0)
      : 0,
  };
};

const roundTo2 = (n: number) => Math.round(n * 100) / 100;

export const projectedAnnualCredit = (monthlyCredit: number | null | undefined) => {
  const n = Number(monthlyCredit);
  if (!Number.isFinite(n) || n <= 0) return 0;
  return roundTo2(n * 12);
};

/** e.g. "Annual credit of 12 days (1 × 12) exceeds the yearly maximum of 6 days." */
export const monthlyCreditExceedsYearlyCapWarning = ({
  monthlyCredit,
  yearlyCap,
}: {
  monthlyCredit?: number | null;
  yearlyCap?: number | null;
} = {}): string | null => {
  const projected = projectedAnnualCredit(monthlyCredit);
  const cap = Number(yearlyCap);
  if (!(projected > 0) || !Number.isFinite(cap) || cap < 0) return null;
  if (projected <= cap) return null;
  return `Annual credit of ${projected} days (${monthlyCredit} × 12) exceeds the yearly maximum of ${cap} days.`;
};

/** Card filter — the balance/quota cards shown on the policy page. */
export const isBalanceType = (t: LeavePolicyType): boolean =>
  BALANCE_CODES.includes(t.code) || Boolean(t.hasBalance) || Boolean(t.enabled);

/** Card filter — everything else (no balance, request-only types). */
export const isOtherType = (t: LeavePolicyType): boolean =>
  !BALANCE_CODES.includes(t.code) && !t.hasBalance && !t.enabled;

/** One-line summary under the type name — mirrors LeavePolicyManager.describeType. */
export const describeType = (
  t: LeavePolicyType,
  policy?: LeavePolicy,
): string => {
  if (!t.enabled) return "Turned off — employees cannot apply for this type.";

  if (t.code === "WFH") {
    const ml = t.monthlyLimit ?? null;
    const al = t.annualLimit ?? null;
    const monthPart = isSet(ml)
      ? `${ml} days added to balance every month`
      : "No monthly quota";
    const yearPart = isSet(al) ? `max ${al} per year` : "no yearly cap";
    const endPart =
      t.monthEnd?.lapseUnused !== false
        ? "unused days expire monthly"
        : "leftover days carry forward";
    return `${monthPart}, ${yearPart}, ${endPart}.`;
  }

  if (!t.hasBalance) return "Employees can apply. Remaining days are not tracked.";

  if (t.code === "CO") {
    const cap = t.accrual?.yearlyCap ?? 0;
    const earnPart = isSet(cap)
      ? `No days granted upfront — employees earn CO through approved credit requests (worked on off-days), up to ${cap} per year.`
      : "No days granted upfront — employees earn CO through approved credit requests (worked on off-days).";
    if (t.yearEnd?.lapseUnused) return `${earnPart} Unused days expire at year end.`;
    return `${earnPart} Unused days can be carried forward.`;
  }

  if (STANDARD_CODES.includes(t.code)) {
    const monthly = t.accrual?.monthlyCredit ?? 0.5;
    const cap = t.accrual?.yearlyCap ?? 6;
    const parts: string[] = [];
    if (t.code === "EL" && t.accrual?.method === "full_if_min_present") {
      const min = t.accrual?.minPresentDays ?? 0;
      parts.push(
        `${monthly} day${monthly === 1 ? "" : "s"} added after a month closes if paid days reach ${min}, up to ${cap} per year.`,
      );
    } else if (t.code === "EL" && t.accrual?.method === "prorate_paid_days") {
      const working = t.accrual?.standardWorkingDays ?? 0;
      const min = t.accrual?.minPresentDays ?? 0;
      const minPart =
        min > 0
          ? ` if paid days reach ${min}, then scaled`
          : ", scaled down if they work fewer";
      parts.push(
        `${monthly} day${monthly === 1 ? "" : "s"} for ${working} paid days after a month closes${minPart}, up to ${cap} per year.`,
      );
    } else {
      parts.push(
        `${monthly} day${monthly === 1 ? "" : "s"} added each month, up to ${cap} per year.`,
      );
    }
    if (t.yearEnd?.lapseUnused !== false) {
      parts.push("Unused days expire at year end.");
    } else if (isSet(t.yearEnd?.carryForwardMax)) {
      parts.push(
        `Up to ${t.yearEnd.carryForwardMax} unused days can be carried to next year.`,
      );
    } else {
      parts.push("Unused days can be carried forward.");
    }
    if (policy?.accruePaidLeaveDuringProbation !== true) {
      parts.push("Collects during probation; can be taken after confirmation.");
    } else {
      parts.push("Can be taken during probation.");
    }
    if (t.code === "SL" && t.documents?.requiredWhenDaysGt != null) {
      parts.push(
        `Medical document needed when sick leave is more than ${t.documents.requiredWhenDaysGt} day${t.documents.requiredWhenDaysGt === 1 ? "" : "s"}.`,
      );
    }
    return parts.join(" ");
  }

  const method = t.accrual?.method;
  const monthly = t.accrual?.monthlyCredit ?? 0;
  const cap = t.accrual?.yearlyCap ?? 0;
  const parts: string[] = [];

  if (method === "fixed_monthly") {
    parts.push(
      `${monthly} day${monthly === 1 ? "" : "s"} added each month, up to ${cap} per year.`,
    );
  } else if (method === "prorate_paid_days") {
    parts.push(
      `Up to ${monthly} day${monthly === 1 ? "" : "s"} each month based on paid attendance, up to ${cap} per year.`,
    );
  } else if (method === "full_if_min_present") {
    parts.push(
      `${monthly} day${monthly === 1 ? "" : "s"} each month if they complete ${t.accrual?.minPresentDays ?? 0} paid days, up to ${cap} per year.`,
    );
  } else if (method === "upfront_annual") {
    parts.push(`${cap} days available from the start of the leave year.`);
  } else {
    parts.push(`${cap} days available. Credit them manually when needed.`);
  }

  if (t.yearEnd?.lapseUnused) {
    parts.push("Unused days expire at year end.");
  } else if (t.yearEnd?.carryForwardMax != null) {
    parts.push(
      `Up to ${t.yearEnd.carryForwardMax} unused days can be carried to next year.`,
    );
  } else {
    parts.push("Unused days can be carried forward.");
  }

  if (t.code === "SL" && t.documents?.requiredWhenDaysGt != null) {
    parts.push(
      `Medical document needed when sick leave is more than ${t.documents.requiredWhenDaysGt} day${t.documents.requiredWhenDaysGt === 1 ? "" : "s"}.`,
    );
  }

  if (t.code === "EL" && t.encashment?.enabled) {
    parts.push("Remaining earned leave can be paid at full & final (gross ÷ 30).");
  }

  return parts.join(" ");
};

/** Client-side guard before PUT /leave/policy — returns "" when valid. */
export const validatePolicy = (policy: LeavePolicy): string => {
  const day = asNumberOrNull(policy.yearStartDay);
  if (day == null || day < 1 || day > 31) {
    return "On Day must be a number between 1 and 31.";
  }
  const month = asNumberOrNull(policy.yearStartMonth);
  if (month == null || month < 1 || month > 12) {
    return "Starts in must be a valid month.";
  }

  for (const t of policy.types || []) {
    if (!t.enabled) continue;
    const name = t.name || t.label || t.code;
    const standard = STANDARD_CODES.includes(t.code);
    const method = elAccrualMethod(t);

    if (t.code === "WFH") {
      for (const [label, raw] of [
        ["WFH days per month", t.monthlyLimit],
        ["WFH days per year", t.annualLimit],
      ] as const) {
        const n = asNumberOrNull(raw);
        if (isSet(raw) && (n == null || n < 0)) {
          return `${label} must be 0 or more (blank = unlimited).`;
        }
      }
      continue;
    }

    if (t.hasBalance === false) continue;

    if (
      standard ||
      (needsMonthlyCredit(method) && t.code !== "WFH" && t.code !== "CO")
    ) {
      const n = asNumberOrNull(t.accrual?.monthlyCredit);
      if (n == null) return `${name} — Days each month is required.`;
      if (n < 0) return `${name} — Days each month must be 0 or more.`;
    }
    if (t.code !== "WFH") {
      const n = asNumberOrNull(t.accrual?.yearlyCap);
      if (n == null) {
        return `${name} — ${t.code === "CO" ? "Maximum earnable per year" : "Maximum per year"} is required.`;
      }
      if (n < 0) return `${name} — Maximum per year must be 0 or more.`;
    }

    if (t.code === "EL" && showsMinPaidDaysField(method)) {
      const n = asNumberOrNull(t.accrual?.minPresentDays);
      if (n == null || n < 0) return "EL minimum paid days must be 0 or more";
    }
    if (t.code === "EL" && showsWorkingDaysField(method)) {
      const n = asNumberOrNull(t.accrual?.standardWorkingDays);
      if (n == null || n <= 0) {
        return "EL working days in a full month must be more than 0";
      }
    }
    if (isSet(t.yearEnd?.carryForwardMax)) {
      const n = asNumberOrNull(t.yearEnd?.carryForwardMax);
      if (n == null || n < 0) return `${name} — carry-forward limit must be 0 or more.`;
    }
    if (t.code === "SL" && t.documents?.requiredWhenDaysGt != null) {
      const n = asNumberOrNull(t.documents.requiredWhenDaysGt);
      if (n == null || n < 0) {
        return "Sick leave document threshold must be 0 or more days.";
      }
    }
  }
  return "";
};

/**
 * Save payload for PUT /leave/policy — CL/SL stay fixed monthly, EL keeps its
 * chosen method, CO stays earn-only and WFH stays quota-only, matching the
 * backend's `sanitizeCustomLeaveTypes`.
 */
export const buildPolicyPayload = (
  policy: LeavePolicy,
): Partial<LeavePolicy> & { templateKey: "custom"; types: LeavePolicyType[] } => ({
  templateKey: "custom",
  yearStartMonth: asNumberOrNull(policy.yearStartMonth) ?? 1,
  yearStartDay: asNumberOrNull(policy.yearStartDay) ?? 1,
  accruePaidLeaveDuringProbation:
    policy.accruePaidLeaveDuringProbation === true,
  types: (policy.types || []).map((t) => {
    if (t.code === "CL" || t.code === "SL" || t.code === "EL") {
      const accrual =
        t.code === "EL"
          ? elAccrualFieldsForSave(t)
          : {
              ...(t.accrual || {}),
              method: "fixed_monthly",
              monthlyCredit: Number(t.accrual?.monthlyCredit ?? 0.5),
              yearlyCap: Number(t.accrual?.yearlyCap ?? 6),
              minPresentDays: 0,
              standardWorkingDays: 0,
            };
      return {
        ...t,
        hasBalance: true,
        accrual: { ...(t.accrual || {}), ...accrual },
        yearEnd: {
          ...(t.yearEnd || {}),
          lapseUnused: t.yearEnd?.lapseUnused !== false,
          carryForwardMax: asNumberOrNull(t.yearEnd?.carryForwardMax),
          lapseExcessCarry: false,
        },
        monthEnd: { ...(t.monthEnd || {}) },
        documents:
          t.code === "SL"
            ? { ...(t.documents || {}) }
            : { requiredWhenDaysGt: null },
        encashment: { enabled: false, on: null, base: null },
      };
    }
    return {
      ...t,
      // WFH never uses balance tracking — quota runs on its two fields.
      hasBalance:
        t.code === "WFH" ? false : t.code === "CO" ? true : t.hasBalance,
      accrual:
        t.code === "CO"
          ? {
              ...(t.accrual || {}),
              method: "none",
              monthlyCredit: 0,
              minPresentDays: 0,
            }
          : { ...(t.accrual || {}) },
      yearEnd: { ...(t.yearEnd || {}) },
      monthEnd: { ...(t.monthEnd || {}) },
      documents: { ...(t.documents || {}) },
      encashment: { ...(t.encashment || {}) },
    };
  }),
});
