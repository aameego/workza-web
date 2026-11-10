/**
 * Pure helpers for Manual salary structure mode (guided hand-entry, not auto-split).
 */

import {
  CTC_MATCH_ROUNDING_TOLERANCE,
  isOutsideCtc,
  monthlyCtcFromAnnual,
  type SalaryComponentLike,
  validateComponentsMatchCalendarDaily,
  validateComponentsMatchCtc,
  validateComponentsMatchDailyWage,
} from "./salaryValidation";

export type ManualWageType = "MONTHLY" | "DAILY" | "CALENDAR_DAILY";

export type ManualLibraryComponent = {
  code: string;
  name: string;
  category: string;
  calculationType?: string;
  isEmployerContribution?: boolean;
  isPartOfCTC?: boolean;
};

export type ManualComponentRow = SalaryComponentLike & {
  code: string;
  name: string;
  category: string;
  monthlyAmount: number;
  dailyAmount: number;
  enabled: boolean;
  isEmployerContribution: boolean;
  isPartOfCTC: boolean;
  calculationType: string;
};

/** Card / hint copy that depends on wage type. */
export const manualModeAmountHint = (wageType: ManualWageType): string => {
  if (wageType === "DAILY") {
    return "Pick components; Apply splits Daily Wage using each component’s library rates";
  }
  if (wageType === "CALENDAR_DAILY") {
    return "Choose components (BASIC required) with Fixed Basic — sheet formulas, not CTC % split";
  }
  return "Pick components; Apply splits Target CTC using each component’s library rates";
};

export const manualTargetAmountLabel = (wageType: ManualWageType): string => {
  if (wageType === "CALENDAR_DAILY") return "1. Per Day Pay (₹/day)";
  if (wageType === "DAILY") return "1. Daily Wage (₹/day)";
  return "1. Target Annual CTC (₹)";
};

/**
 * Codes sent to calculate-split for Manual Apply.
 * Ensures SPECIAL is included when present in the library so the engine can balance CTC.
 */
export const resolveManualSplitCodes = (
  selectedCodes: string[],
  library: ManualLibraryComponent[],
  wageType: ManualWageType,
): string[] => {
  const codes = [
    ...new Set(
      (selectedCodes || [])
        .map((c) => String(c || "").trim().toUpperCase())
        .filter(Boolean),
    ),
  ];
  if (wageType === "CALENDAR_DAILY") return codes;

  const hasSpecialSelected = codes.includes("SPECIAL");
  const libSpecial = library.find(
    (c) => String(c.code || "").toUpperCase() === "SPECIAL",
  );
  if (!hasSpecialSelected && libSpecial) {
    codes.push(String(libSpecial.code).toUpperCase());
  }
  return codes;
};

export const buildManualComponentsFromLibrary = (
  library: ManualLibraryComponent[],
  selectedCodes: string[],
): ManualComponentRow[] =>
  library
    .filter((c) => selectedCodes.includes(c.code))
    .map((c) => ({
      code: c.code,
      name: c.name,
      category: c.category,
      monthlyAmount: 0,
      dailyAmount: 0,
      calculationType: c.calculationType || "Custom",
      enabled: true,
      isEmployerContribution: Boolean(c.isEmployerContribution),
      isPartOfCTC: c.isPartOfCTC !== false,
    }));

/**
 * Ensure BASIC exists for Calendar Daily and apply Fixed Basic monthly amount.
 * Returns null if BASIC is not in the library when codes need it.
 */
export const applyCalendarDailyBasic = (
  components: ManualComponentRow[],
  library: ManualLibraryComponent[],
  basicFixedAmount: number,
): { components: ManualComponentRow[]; error: string } => {
  const basicAmt = Number(basicFixedAmount) || 0;
  if (basicAmt <= 0) {
    return {
      components,
      error: "Enter Fixed Basic amount (required for Calendar Daily).",
    };
  }

  const next = components.map((c) => ({ ...c }));
  let basicIdx = next.findIndex(
    (c) => String(c.code || "").toUpperCase() === "BASIC",
  );

  if (basicIdx === -1) {
    const libBasic = library.find(
      (c) => String(c.code || "").toUpperCase() === "BASIC",
    );
    if (!libBasic) {
      return {
        components,
        error: "BASIC is required for Calendar Daily but is not in the component library.",
      };
    }
    next.unshift({
      code: libBasic.code,
      name: libBasic.name,
      category: libBasic.category,
      monthlyAmount: basicAmt,
      dailyAmount: 0,
      calculationType: libBasic.calculationType || "Custom",
      enabled: true,
      isEmployerContribution: Boolean(libBasic.isEmployerContribution),
      isPartOfCTC: libBasic.isPartOfCTC !== false,
    });
    basicIdx = 0;
  } else {
    next[basicIdx] = {
      ...next[basicIdx],
      monthlyAmount: basicAmt,
      dailyAmount: 0,
    };
  }

  return { components: next, error: "" };
};

export type ManualMatchSummary = {
  status: "empty" | "ok" | "short" | "over" | "incomplete";
  message: string;
  current: number;
  target: number;
  difference: number;
};

const fmtInr = (n: number) => Math.round(n).toLocaleString("en-IN");

const monthlyCtcParts = (components: SalaryComponentLike[]) => {
  const lines = (components || []).filter((c) => c && c.enabled !== false);
  const earnings = lines
    .filter((c) => c.category === "Earning" && !isOutsideCtc(c))
    .reduce((sum, c) => sum + (Number(c.monthlyAmount) || 0), 0);
  const employer = lines
    .filter((c) => c.isEmployerContribution && !isOutsideCtc(c))
    .reduce((sum, c) => sum + (Number(c.monthlyAmount) || 0), 0);
  return { monthlyTotal: earnings + employer, lines };
};

const dailyEarnings = (components: SalaryComponentLike[]) =>
  (components || [])
    .filter(
      (c) =>
        c &&
        c.enabled !== false &&
        c.category === "Earning" &&
        c.isPartOfCTC !== false,
    )
    .reduce(
      (sum, c) => sum + (Number(c.dailyAmount ?? c.monthlyAmount) || 0),
      0,
    );

/** Live match feedback while typing amounts in Manual mode. */
export const buildManualMatchSummary = ({
  wageType,
  ctcAnnual,
  dailyWage,
  components,
}: {
  wageType: ManualWageType;
  ctcAnnual?: unknown;
  dailyWage?: unknown;
  components?: SalaryComponentLike[];
}): ManualMatchSummary => {
  const comps = Array.isArray(components) ? components : [];
  if (!comps.length) {
    return {
      status: "empty",
      message: "Select components and click Apply & Split to fill amounts from library rates.",
      current: 0,
      target: 0,
      difference: 0,
    };
  }

  if (wageType === "CALENDAR_DAILY") {
    const err = validateComponentsMatchCalendarDaily({
      dailyWage,
      components: comps,
    });
    if (err) {
      return {
        status: "incomplete",
        message: err,
        current: 0,
        target: Number(dailyWage) || 0,
        difference: 0,
      };
    }
    const basic = comps.find(
      (c) => String(c.code || "").toUpperCase() === "BASIC",
    );
    const basicAmt = Number(basic?.monthlyAmount) || 0;
    return {
      status: "ok",
      message: `BASIC fixed ₹${fmtInr(basicAmt)}/mo ready. Other components are optional monthly preview amounts.`,
      current: basicAmt,
      target: Number(dailyWage) || 0,
      difference: 0,
    };
  }

  if (wageType === "DAILY") {
    const target = Number(dailyWage) || 0;
    if (target <= 0) {
      return {
        status: "incomplete",
        message: "Enter Daily Wage first.",
        current: 0,
        target: 0,
        difference: 0,
      };
    }
    const current = dailyEarnings(comps);
    const difference = Math.abs(target - current);
    if (difference <= CTC_MATCH_ROUNDING_TOLERANCE) {
      return {
        status: "ok",
        message: `Earnings ₹${fmtInr(current)}/day match Daily Wage ₹${fmtInr(target)}/day.`,
        current,
        target,
        difference: 0,
      };
    }
    const err = validateComponentsMatchDailyWage({
      dailyWage: target,
      components: comps,
    });
    return {
      status: current < target ? "short" : "over",
      message:
        err ||
        (current < target
          ? `Earnings ₹${fmtInr(current)}/day — ₹${fmtInr(difference)} short of Daily Wage ₹${fmtInr(target)}/day.`
          : `Earnings ₹${fmtInr(current)}/day exceed Daily Wage by ₹${fmtInr(difference)}.`),
      current,
      target,
      difference,
    };
  }

  const annual = Number(ctcAnnual) || 0;
  if (annual <= 0) {
    return {
      status: "incomplete",
      message: "Enter Annual CTC first.",
      current: 0,
      target: 0,
      difference: 0,
    };
  }
  const targetMonthly = monthlyCtcFromAnnual(annual);
  const { monthlyTotal } = monthlyCtcParts(comps);
  const currentAnnual = monthlyTotal * 12;
  const difference = Math.abs(annual - currentAnnual);
  if (difference <= CTC_MATCH_ROUNDING_TOLERANCE) {
    return {
      status: "ok",
      message: `Earnings + employer (₹${fmtInr(currentAnnual)}/yr) match Annual CTC ₹${fmtInr(annual)}.`,
      current: currentAnnual,
      target: annual,
      difference: 0,
    };
  }
  const err = validateComponentsMatchCtc({
    ctcAnnual: annual,
    components: comps,
  });
  return {
    status: currentAnnual < annual ? "short" : "over",
    message:
      err ||
      (currentAnnual < annual
        ? `Earnings + employer ₹${fmtInr(monthlyTotal)}/mo (₹${fmtInr(currentAnnual)}/yr) — ₹${fmtInr(difference)} short of CTC. Target monthly ≈ ₹${fmtInr(targetMonthly)}.`
        : `Earnings + employer exceed Annual CTC by ₹${fmtInr(difference)}.`),
    current: currentAnnual,
    target: annual,
    difference,
  };
};

export const partitionSalaryComponents = <T extends SalaryComponentLike>(
  components: T[],
) => ({
  earnings: components.filter((c) => c.category === "Earning"),
  deductions: components.filter(
    (c) => c.category === "Deduction" && !c.isEmployerContribution,
  ),
  employerContributions: components.filter((c) => c.isEmployerContribution),
});
