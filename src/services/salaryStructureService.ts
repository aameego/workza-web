import { api } from "../lib/apiClient";

export type SalaryStructureOption = {
  _id: string;
  name: string;
};

type StructureListResponse = {
  success?: boolean;
  data?: SalaryStructureOption[];
};

export const getSalaryStructures = async (
  vendorId: string,
): Promise<SalaryStructureOption[]> => {
  const data = await api.get<StructureListResponse | SalaryStructureOption[]>(
    `/salary-components/structure/${vendorId}/salary-structure`,
  );
  if (Array.isArray(data)) return data;
  return Array.isArray(data?.data) ? data.data : [];
};

/* ── Settings → Salary: full structure records ──────────── */

/** Component reference inside a structure — populated or a raw id. */
export type StructureComponentRef =
  | string
  | {
      _id: string;
      name?: string;
      code?: string;
      category?: string;
      calculationType?: string;
      rate?: number;
      defaultValue?: number;
      cap?: number | null;
      threshold?: number | null;
      baseComponent?: string;
      formulaExpression?: string;
      isPartOfCTC?: boolean;
      isEmployerContribution?: boolean;
      sortOrder?: number;
    };

/**
 * One component line in a structure. `null` override = use the global
 * component definition (backend `sanitizeStructureItems` behaviour).
 */
export type StructureItem = {
  componentId: StructureComponentRef;
  rateOverride?: number | null;
  fixedAmountOverride?: number | null;
  formulaOverride?: string | null;
  calculationTypeOverride?: string | null;
  baseComponentOverride?: string | null;
  capOverride?: number | null;
  thresholdOverride?: number | null;
  isEnabled?: boolean;
  isPartOfCTC?: boolean | null;
};

/** Row returned by GET /salary-components/structure/:vendorId/salary-structure. */
export type SalaryStructure = {
  _id: string;
  name: string;
  description?: string;
  earnings?: StructureItem[];
  deductions?: StructureItem[];
  structureType?: string;
  isDefault?: boolean;
  isActive?: boolean;
};

export type StructurePayload = {
  vendorId?: string;
  name: string;
  description: string;
  earnings: StructureItem[];
  deductions: StructureItem[];
};

type StructureListFullResponse = {
  success?: boolean;
  data?: SalaryStructure[];
};

/** Resolve the component id whether the item is populated or a raw id. */
export const structureItemId = (
  item: StructureItem,
): string | null => {
  const ref = item?.componentId;
  if (!ref) return null;
  if (typeof ref === "string") return ref;
  return ref._id || null;
};

/** GET — full structures for the Settings → Salary table. */
export const getSalaryStructureList = async (
  vendorId: string,
): Promise<SalaryStructure[]> => {
  if (!vendorId) return [];
  const body = await api.get<StructureListFullResponse | SalaryStructure[]>(
    `/salary-components/structure/${vendorId}/salary-structure`,
  );
  if (Array.isArray(body)) return body;
  return Array.isArray(body?.data) ? body.data : [];
};

/** POST /salary-components/structure/:vendorId/salary-structure */
export const createSalaryStructure = async (
  payload: StructurePayload,
): Promise<void> => {
  await api.post(
    `/salary-components/structure/${payload.vendorId}/salary-structure`,
    { json: payload },
  );
};

/** PUT /salary-components/structure/:vendorId/salary-structure/:id */
export const updateSalaryStructure = async (
  vendorId: string,
  structureId: string,
  payload: StructurePayload,
): Promise<void> => {
  await api.put(
    `/salary-components/structure/${vendorId}/salary-structure/${structureId}`,
    { json: payload },
  );
};

/** DELETE /salary-components/structure/:vendorId/salary-structure/:id */
export const deleteSalaryStructure = async (
  vendorId: string,
  structureId: string,
): Promise<void> => {
  await api.delete(
    `/salary-components/structure/${vendorId}/salary-structure/${structureId}`,
  );
};
