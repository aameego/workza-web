import { api } from "../lib/apiClient";

/** Backend `SalaryComponent.category` enum. */
export type SalaryComponentCategory = "Earning" | "Deduction";

/** Backend `SalaryComponent.calculationType` enum. */
export type CalculationType =
  | "FixedMonthly"
  | "PercentOfComponent"
  | "PercentOfGross"
  | "PercentOfCTC"
  | "SlabBased"
  | "AttendanceBased"
  | "Manual"
  | "Formula"
  | "CustomFormula";

/** Row returned by GET /salary-components/components. */
export type SalaryComponent = {
  _id: string;
  vendorId?: string;
  code: string;
  name: string;
  description?: string;
  category: SalaryComponentCategory;
  componentType?: "Recurring" | "Ad-hoc" | "Reimbursement";
  calculationType?: CalculationType;
  formulaExpression?: string;
  /** Fixed monthly amount (₹). */
  defaultValue?: number;
  /** Fraction — 0.4 means 40%. */
  rate?: number;
  /** Uppercase component code, e.g. "BASIC". */
  baseComponent?: string;
  threshold?: number | null;
  cap?: number | null;
  isPartOfCTC?: boolean;
  isTaxable?: boolean;
  isEmployerContribution?: boolean;
  isStatutory?: boolean;
  isProRata?: boolean;
  isOptional?: boolean;
  showOnPayslip?: boolean;
  hideIfZero?: boolean;
  isActive?: boolean;
  isSystem?: boolean;
  sortOrder?: number;
  departments?: string[];
  grades?: string[];
  locations?: string[];
  slabs?: unknown[];
};

/** Body for POST /salary-components/components and PUT /salary-components/components/:code. */
export type SalaryComponentPayload = {
  name: string;
  code: string;
  category: SalaryComponentCategory;
  calculationType: CalculationType;
  formulaExpression?: string;
  defaultValue?: number;
  rate?: number;
  baseComponent?: string;
  threshold?: number | null;
  cap?: number | null;
  isPartOfCTC?: boolean;
  isStatutory?: boolean;
  isEmployerContribution?: boolean;
  showOnPayslip?: boolean;
  description?: string;
};

/** UI labels — mirrors AameegoGig `CALC_LABELS`. */
export const CALC_LABELS: Record<string, string> = {
  FixedMonthly: "Fixed monthly",
  PercentOfComponent: "% of component",
  PercentOfGross: "% of gross",
  PercentOfCTC: "% of CTC",
  CustomFormula: "Custom Formula",
};

/** Types a seeded component can carry but the create dropdown does not offer. */
const EXTRA_CALC_LABELS: Record<string, string> = {
  Formula: "Custom Formula",
  Manual: "Manual",
  AttendanceBased: "Attendance based",
  SlabBased: "Slab based",
};

export const calculationTypeLabel = (type?: string | null): string => {
  if (!type) return CALC_LABELS.FixedMonthly;
  return CALC_LABELS[type] ?? EXTRA_CALC_LABELS[type] ?? type;
};

export const FORMULA_TYPES: ReadonlySet<string> = new Set([
  "CustomFormula",
  "Formula",
]);

export const PERCENT_TYPES = [
  "PercentOfComponent",
  "PercentOfGross",
  "PercentOfCTC",
] as const;

export const FIXED_TYPES = ["FixedMonthly", "Manual"] as const;

export type ComponentPreset = {
  code: string;
  name: string;
  category: SalaryComponentCategory;
  isEmployerContribution?: boolean;
};

/** Preset picker options — mirrors AameegoGig `codes`. */
export const COMPONENT_PRESETS: ComponentPreset[] = [
  { code: "BASIC", name: "Basic Pay", category: "Earning" },
  { code: "HRA", name: "House Rent Allowance", category: "Earning" },
  { code: "CONVEYANCE", name: "Conveyance Allowance", category: "Earning" },
  { code: "MEDICAL", name: "Medical Allowance", category: "Earning" },
  { code: "LTA", name: "Leave Travel Allowance", category: "Earning" },
  { code: "SPECIAL", name: "Special Allowance", category: "Earning" },
  { code: "BONUS", name: "Performance Bonus", category: "Earning" },
  { code: "CCA", name: "City Compensatory Allowance", category: "Earning" },
  {
    code: "PF_EE",
    name: "Employee Provident Fund",
    category: "Deduction",
    isEmployerContribution: false,
  },
  {
    code: "ESIC_EE",
    name: "Employee State Insurance",
    category: "Deduction",
    isEmployerContribution: false,
  },
  { code: "PT", name: "Professional Tax", category: "Deduction" },
  { code: "TDS", name: "Tax Deducted at Source", category: "Deduction" },
  {
    code: "LWF_EE",
    name: "Labour Welfare Fund (Employee)",
    category: "Deduction",
    isEmployerContribution: false,
  },
  {
    code: "PF_ER",
    name: "Employer Provident Fund",
    category: "Deduction",
    isEmployerContribution: true,
  },
  {
    code: "ESIC_ER",
    name: "Employer State Insurance",
    category: "Deduction",
    isEmployerContribution: true,
  },
  {
    code: "GRATUITY",
    name: "Gratuity Provision",
    category: "Deduction",
    isEmployerContribution: true,
  },
  {
    code: "LWF_ER",
    name: "Labour Welfare Fund (Employer)",
    category: "Deduction",
    isEmployerContribution: true,
  },
  {
    code: "INSURANCE",
    name: "Corporate Insurance Premium",
    category: "Deduction",
    isEmployerContribution: true,
  },
  { code: "OTHER", name: "Custom (Other)", category: "Earning" },
];

/** Row sub-label under the component name — mirrors AameegoGig `getCalcLabel`. */
export const componentCalcLabel = (comp: SalaryComponent): string => {
  const type = comp.calculationType || "FixedMonthly";
  if (FORMULA_TYPES.has(type)) {
    const expr = (comp.formulaExpression || "").trim();
    return expr
      ? `Custom: ${expr.length > 30 ? `${expr.slice(0, 30)}…` : expr}`
      : "Custom Formula";
  }
  if (type === "PercentOfComponent") return `% of ${comp.baseComponent || "—"}`;
  return calculationTypeLabel(type);
};

export type SalaryTemplate = { key: string; label: string };

type Envelope<T> = { success?: boolean; data?: T } | T;

const unwrap = <T>(body: Envelope<T>): T | null => {
  if (body && typeof body === "object" && "data" in body) {
    return (body as { data?: T }).data ?? null;
  }
  return (body as T) ?? null;
};

/* ── Component library ──────────────────────────────────── */

/** GET /salary-components/components */
export const getSalaryComponents = async (
  includeInactive = true,
): Promise<SalaryComponent[]> => {
  const body = await api.get<Envelope<SalaryComponent[]>>(
    "/salary-components/components",
    { params: { includeInactive: includeInactive ? "true" : "false" } },
  );
  const data = unwrap(body);
  return Array.isArray(data) ? data : [];
};

/** POST /salary-components/components */
export const createSalaryComponent = async (
  payload: SalaryComponentPayload,
): Promise<void> => {
  await api.post("/salary-components/components", { json: payload });
};

/** PUT /salary-components/components/:code */
export const updateSalaryComponent = async (
  code: string,
  payload: Partial<SalaryComponentPayload> & { isActive?: boolean },
): Promise<void> => {
  await api.put(`/salary-components/components/${encodeURIComponent(code)}`, {
    json: payload,
  });
};

/** DELETE /salary-components/components/:code — soft-deletes when in use. */
export const deleteSalaryComponent = async (
  code: string,
): Promise<{ softDeleted: boolean; message?: string }> => {
  const body = await api.delete<{
    softDeleted?: boolean;
    message?: string;
  }>(`/salary-components/components/${encodeURIComponent(code)}`);
  return { softDeleted: Boolean(body?.softDeleted), message: body?.message };
};

/* ── Templates ──────────────────────────────────────────── */

/** GET /salary-components/templates */
export const getSalaryTemplates = async (): Promise<SalaryTemplate[]> => {
  const body = await api.get<Envelope<SalaryTemplate[]>>(
    "/salary-components/templates",
  );
  const data = unwrap(body);
  return Array.isArray(data) ? data : [];
};

/**
 * POST /salary-components/templates/apply
 * Replaces the org library (non-system rows) with the template — confirm first.
 */
export const applySalaryTemplate = async (
  templateKey: string,
): Promise<void> => {
  await api.post("/salary-components/templates/apply", {
    json: { templateKey },
  });
};
