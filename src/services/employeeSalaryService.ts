import { api } from "../lib/apiClient";

export type SalaryComponentRow = {
  code?: string;
  name?: string;
  category?: string;
  enabled?: boolean;
  isEmployerContribution?: boolean;
  isPartOfCTC?: boolean;
  isStatutory?: boolean;
  calculationType?: string;
  amount?: number;
  monthlyAmount?: number;
  dailyAmount?: number;
  annualAmount?: number;
  percentage?: number;
};

export type LibrarySalaryComponent = {
  code: string;
  name: string;
  category?: string;
  calculationType?: string;
  isEmployerContribution?: boolean;
  isPartOfCTC?: boolean;
  isActive?: boolean;
};

export type EmployeeSalaryStructure = {
  wageType?: string;
  ctcAnnual?: number;
  monthlyGross?: number;
  dailyWage?: number;
  dailyGross?: number;
  components?: SalaryComponentRow[];
  salaryStructure?: { _id?: string; name?: string } | string | null;
};

export type SaveEmployeeStructurePayload = {
  wageType: "MONTHLY" | "DAILY" | "CALENDAR_DAILY" | string;
  ctcAnnual?: number;
  dailyWage?: number;
  monthlyGross?: number;
  dailyGross?: number;
  daysInMonth?: number;
  structureId?: string;
  components: SalaryComponentRow[];
  revisionType?: string;
  revisionReason?: string;
};

export type CalculateSplitPayload = {
  wageType?: string;
  ctcAnnual?: number;
  dailyWage?: number;
  structureId?: string;
  daysInMonth?: number;
  basicFixedAmount?: number;
};

export type CalculateSplitResult = {
  components?: SalaryComponentRow[];
  summary?: {
    ctcEarnings?: number;
    totalEarnings?: number;
  };
};

export type EmployeeSalaryPreview = {
  earnings?: SalaryComponentRow[];
  deductions?: SalaryComponentRow[];
  employerContributions?: SalaryComponentRow[];
  grossSalary?: number;
  totalDeduction?: number;
  netSalary?: number;
  ctcAnnual?: number;
};

type Envelope<T> = { success?: boolean; data?: T } | T;

const unwrap = <T>(body: Envelope<T>): T | null => {
  if (body && typeof body === "object" && "data" in body) {
    return (body as { data?: T }).data ?? null;
  }
  return (body as T) ?? null;
};

export const getEmployeeStructure = async (
  employeeId: string,
): Promise<EmployeeSalaryStructure | null> => {
  const body = await api.get<Envelope<EmployeeSalaryStructure>>(
    `/salary-components/structure/${employeeId}`,
  );
  return unwrap(body);
};

export const previewEmployeeStructure = async (
  employeeId: string,
): Promise<EmployeeSalaryPreview | null> => {
  const body = await api.get<Envelope<EmployeeSalaryPreview>>(
    `/salary-components/structure/${employeeId}/preview`,
  );
  return unwrap(body);
};

export const saveEmployeeStructure = async (
  employeeId: string,
  payload: SaveEmployeeStructurePayload,
): Promise<EmployeeSalaryStructure | null> => {
  const body = await api.post<Envelope<EmployeeSalaryStructure>>(
    `/salary-components/structure/${employeeId}`,
    { json: payload },
  );
  return unwrap(body);
};

export const getSalaryComponentLibrary = async (
  includeInactive = true,
): Promise<LibrarySalaryComponent[]> => {
  const body = await api.get<Envelope<LibrarySalaryComponent[]>>(
    "/salary-components/components",
    { params: { includeInactive: includeInactive ? "true" : "false" } },
  );
  const data = unwrap(body);
  return Array.isArray(data) ? data : [];
};

const parseSplitBody = (body: unknown): CalculateSplitResult => {
  if (!body || typeof body !== "object") return {};
  const root = body as {
    data?: CalculateSplitResult | SalaryComponentRow[];
    components?: SalaryComponentRow[];
    summary?: CalculateSplitResult["summary"];
  };
  const inner = root.data;
  if (Array.isArray(inner)) return { components: inner };
  if (inner && typeof inner === "object") {
    if (Array.isArray(inner.components)) return inner;
    if (Array.isArray(inner as unknown as SalaryComponentRow[])) {
      return { components: inner as unknown as SalaryComponentRow[] };
    }
    return inner;
  }
  if (Array.isArray(root.components)) {
    return { components: root.components, summary: root.summary };
  }
  return {};
};

export const calculateStructureSplit = async (
  vendorId: string,
  payload: CalculateSplitPayload,
): Promise<CalculateSplitResult> => {
  const body = await api.post(
    `/salary-components/structure/${vendorId}/calculate-split`,
    { json: payload },
  );
  return parseSplitBody(body);
};

export const calculateCalendarDailySplit = async (
  vendorId: string,
  payload: CalculateSplitPayload,
): Promise<CalculateSplitResult> => {
  const body = await api.post(
    `/salary-components/structure/${vendorId}/calculate-calendar-daily-split`,
    { json: payload },
  );
  return parseSplitBody(body);
};
