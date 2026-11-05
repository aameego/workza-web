/**
 * Salary structure validation — mirrors AameegoGig-Frontend/utils/salaryValidation.js
 * (CTC / daily wage match rules used by the employee salary editor).
 */

export const MIN_ANNUAL_CTC = 12;
export const MIN_DAILY_WAGE = 10;
export const MAX_DAILY_WAGE = 100_000;
export const CTC_MATCH_ROUNDING_TOLERANCE = 6;

export type SalaryComponentLike = {
  code?: string;
  name?: string;
  category?: string;
  enabled?: boolean;
  isEmployerContribution?: boolean;
  isPartOfCTC?: boolean;
  calculationType?: string;
  monthlyAmount?: number | string;
  dailyAmount?: number | string;
};

export const monthlyCtcFromAnnual = (annualCTC: unknown): number => {
  const annual = Number(annualCTC) || 0;
  return annual > 0 ? Math.round(annual / 12) : 0;
};

export const isOutsideCtc = (comp: SalaryComponentLike) =>
  comp.isPartOfCTC === false;

export const validateAnnualCtc = (value: unknown): string => {
  if (value === "" || value === null || value === undefined) {
    return "Annual CTC is required";
  }
  const n = Number(value);
  if (!Number.isFinite(n)) return "Annual CTC must be a valid number";
  if (n < MIN_ANNUAL_CTC) {
    return `Annual CTC must be at least ₹${MIN_ANNUAL_CTC}`;
  }
  return "";
};

export const validateDailyWage = (value: unknown): string => {
  if (value === "" || value === null || value === undefined) {
    return "Daily Wage is required";
  }
  const n = Number(value);
  if (!Number.isFinite(n)) return "Daily Wage must be a valid number";
  if (n < MIN_DAILY_WAGE) {
    return `Daily Wage must be at least ₹${MIN_DAILY_WAGE}`;
  }
  if (n > MAX_DAILY_WAGE) {
    return `Daily Wage must be at most ₹${MAX_DAILY_WAGE.toLocaleString("en-IN")}`;
  }
  return "";
};

export const validateComponentsMatchCtc = ({
  ctcAnnual,
  components = [],
}: {
  ctcAnnual: unknown;
  components?: SalaryComponentLike[];
}): string => {
  const annualCtc = Number(ctcAnnual) || 0;
  if (annualCtc <= 0) return "";

  const lines = (components || []).filter(
    (comp) => comp && comp.enabled !== false,
  );
  if (!lines.length) return "";

  const earnings = lines
    .filter((comp) => comp.category === "Earning" && !isOutsideCtc(comp))
    .reduce((sum, comp) => sum + (Number(comp.monthlyAmount) || 0), 0);

  const employerContributions = lines
    .filter((comp) => comp.isEmployerContribution && !isOutsideCtc(comp))
    .reduce((sum, comp) => sum + (Number(comp.monthlyAmount) || 0), 0);

  const monthlyTotal = earnings + employerContributions;
  const actualAnnual = monthlyTotal * 12;
  const difference = Math.abs(annualCtc - actualAnnual);
  if (difference <= CTC_MATCH_ROUNDING_TOLERANCE) return "";

  const fmt = (n: number) => Math.round(n).toLocaleString("en-IN");
  return actualAnnual > annualCtc
    ? `Total Earnings + Employer Contributions (₹${fmt(actualAnnual)}) exceeds Annual CTC (₹${fmt(annualCtc)}) by ₹${fmt(difference)}. Please adjust the amounts to match.`
    : `Total Earnings + Employer Contributions (₹${fmt(actualAnnual)}) is ₹${fmt(difference)} less than Annual CTC (₹${fmt(annualCtc)}). Please increase the amounts to match.`;
};

export const validateComponentsMatchDailyWage = ({
  dailyWage,
  components = [],
}: {
  dailyWage: unknown;
  components?: SalaryComponentLike[];
}): string => {
  const wage = Number(dailyWage) || 0;
  if (wage <= 0) return "";
  const lines = (components || []).filter(
    (comp) => comp && comp.enabled !== false,
  );
  if (!lines.length) return "";
  const earnings = lines
    .filter(
      (comp) =>
        comp.category === "Earning" && comp.isPartOfCTC !== false,
    )
    .reduce(
      (sum, comp) =>
        sum + (Number(comp.dailyAmount ?? comp.monthlyAmount) || 0),
      0,
    );
  const difference = Math.abs(wage - earnings);
  if (difference <= CTC_MATCH_ROUNDING_TOLERANCE) return "";
  const fmt = (n: number) => Math.round(n).toLocaleString("en-IN");
  return earnings > wage
    ? `Total Earnings (₹${fmt(earnings)}/day) exceeds Daily Wage (₹${fmt(wage)}/day) by ₹${fmt(difference)}. Please adjust.`
    : `Total Earnings (₹${fmt(earnings)}/day) is ₹${fmt(difference)} less than Daily Wage (₹${fmt(wage)}/day). Please adjust.`;
};

export const validateComponentsMatchCalendarDaily = ({
  dailyWage,
  components = [],
}: {
  dailyWage: unknown;
  components?: SalaryComponentLike[];
}): string => {
  const wageErr = validateDailyWage(dailyWage);
  if (wageErr) return wageErr;
  const lines = (components || []).filter(
    (comp) => comp && comp.enabled !== false,
  );
  if (!lines.length) return "At least one salary component is required";

  const basic = lines.find(
    (c) => String(c.code || "").toUpperCase() === "BASIC",
  );
  if (!basic) return "BASIC is required for Calendar Daily wage type";
  const basicAmt = Number(basic.monthlyAmount) || 0;
  if (basicAmt <= 0) {
    return "BASIC fixed amount must be greater than 0 for Calendar Daily wage type";
  }
  return "";
};

export type SalaryDraft = {
  wageType?: string;
  ctcAnnual?: number | string;
  dailyWage?: number | string;
  structureId?: string;
  components?: SalaryComponentLike[];
};

export const hasSalaryData = (draft: SalaryDraft | null | undefined): boolean => {
  if (!draft) return false;
  if (Number(draft.ctcAnnual) > 0) return true;
  if (Number(draft.dailyWage) > 0) return true;
  return (Array.isArray(draft.components) ? draft.components : []).some(
    (c) =>
      c.enabled !== false &&
      (Number(c.monthlyAmount) > 0 || Number(c.dailyAmount) > 0) &&
      (c.category === "Earning" || !c.category),
  );
};

export const validateStructureDraft = (
  draft: SalaryDraft | null | undefined,
): string[] => {
  if (!draft || !hasSalaryData(draft)) return [];
  const wt = String(draft.wageType || "MONTHLY").toUpperCase();
  const components = draft.components || [];

  if (wt === "CALENDAR_DAILY") {
    const errors: string[] = [];
    const wageErr = validateDailyWage(draft.dailyWage);
    if (wageErr) errors.push(wageErr);
    const matchErr = validateComponentsMatchCalendarDaily({
      dailyWage: draft.dailyWage,
      components,
    });
    if (matchErr) errors.push(matchErr);
    return errors;
  }

  if (wt === "DAILY") {
    const errors: string[] = [];
    const wageErr = validateDailyWage(draft.dailyWage);
    if (wageErr) errors.push(wageErr);
    const matchErr = validateComponentsMatchDailyWage({
      dailyWage: draft.dailyWage,
      components,
    });
    if (matchErr) errors.push(matchErr);
    return errors;
  }

  const errors: string[] = [];
  const ctcErr = validateAnnualCtc(draft.ctcAnnual);
  if (ctcErr) errors.push(ctcErr);
  const matchErr = validateComponentsMatchCtc({
    ctcAnnual: draft.ctcAnnual,
    components,
  });
  if (matchErr) errors.push(matchErr);
  return errors;
};
