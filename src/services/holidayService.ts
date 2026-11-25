import { api } from "../lib/apiClient";

/** Holiday category — backend enum (AameegoGig contract uses "Festival"). */
export type HolidayType = "National" | "Festival" | "Restricted" | "Company";

/** Row returned by GET /holidays. */
export type Holiday = {
  _id: string | null;
  vendorId?: string;
  name: string;
  /** ISO date string (YYYY-MM-DD or full ISO). */
  date: string;
  /** Department name, or null/undefined for all departments. */
  department?: string | null;
  type: HolidayType;
  description?: string;
  /** Indian state name, or null/undefined for all states. */
  state?: string | null;
  isActive?: boolean;
  /** Not in the backend schema yet — falls back to "HR/Admin" in the list. */
  createdBy?: string;
  /** Legacy rows merged from WeekOff settings — not editable here. */
  source?: "weekOff";
  createdAt?: string;
  updatedAt?: string;
};

export type HolidayPayload = {
  vendorId: string;
  name: string;
  /** YYYY-MM-DD */
  date: string;
  department: string | null;
  state: string | null;
  type: HolidayType;
  description: string;
};

export type HolidayListQuery = {
  vendorId: string;
  year?: number;
  month?: number;
  department?: string;
};

/** Shape of POST /holidays/bulk-upload result data. */
export type BulkUploadResult = {
  totalRows: number;
  inserted: number;
  skipped: number;
  errors?: string[];
};

type ListResponse = {
  success: boolean;
  count?: number;
  data?: Holiday[];
};

type MutationResponse = {
  success: boolean;
  message?: string;
  data?: Holiday;
};

type BulkResponse = {
  success: boolean;
  message?: string;
  data?: BulkUploadResult;
  errors?: string[];
};

/** Indian states — mirrors backend enum used for validation. */
export const INDIAN_STATES = [
  "Andhra Pradesh",
  "Arunachal Pradesh",
  "Assam",
  "Bihar",
  "Chhattisgarh",
  "Goa",
  "Gujarat",
  "Haryana",
  "Himachal Pradesh",
  "Jharkhand",
  "Karnataka",
  "Kerala",
  "Madhya Pradesh",
  "Maharashtra",
  "Manipur",
  "Meghalaya",
  "Mizoram",
  "Nagaland",
  "Odisha",
  "Punjab",
  "Rajasthan",
  "Sikkim",
  "Tamil Nadu",
  "Telangana",
  "Tripura",
  "Uttar Pradesh",
  "Uttarakhand",
  "West Bengal",
  "Chandigarh",
  "Delhi",
] as const;

/** Display order matches the Figma filter (National / Festive / Company / Restricted). */
export const HOLIDAY_TYPES: HolidayType[] = [
  "National",
  "Festival",
  "Company",
  "Restricted",
];

/**
 * UI labels — the mock shows "Festive", but the backend enum (and bulk-upload
 * validator) only accepts "Festival", so the wire value stays "Festival".
 */
export const HOLIDAY_TYPE_LABELS: Record<HolidayType, string> = {
  National: "National",
  Festival: "Festive",
  Company: "Company",
  Restricted: "Restricted",
};

export const holidayTypeLabel = (type?: HolidayType | null): string =>
  (type && HOLIDAY_TYPE_LABELS[type]) || "National";

/** GET /holidays?vendorId=&year=&month=&department= */
export const getHolidays = async ({
  vendorId,
  year,
  month,
  department,
}: HolidayListQuery): Promise<Holiday[]> => {
  if (!vendorId) return [];
  const body = await api.get<ListResponse>("/holidays", {
    params: { vendorId, year, month, department },
  });
  return body.data ?? [];
};

/** POST /holidays */
export const createHoliday = async (
  payload: HolidayPayload,
): Promise<Holiday | null> => {
  const body = await api.post<MutationResponse>("/holidays", { json: payload });
  return body.data ?? null;
};

/** PUT /holidays/:holidayId */
export const updateHoliday = async (
  holidayId: string,
  payload: HolidayPayload,
): Promise<Holiday | null> => {
  const body = await api.put<MutationResponse>(`/holidays/${holidayId}`, {
    json: payload,
  });
  return body.data ?? null;
};

/** DELETE /holidays/:holidayId */
export const deleteHoliday = async (holidayId: string): Promise<void> => {
  await api.delete(`/holidays/${holidayId}`);
};

/** POST /holidays/bulk-upload (multipart field "file"). */
export const bulkUploadHolidays = async (
  file: File,
): Promise<BulkUploadResult> => {
  const form = new FormData();
  form.append("file", file);
  // Let fetch set the multipart boundary — do NOT set Content-Type manually.
  const body = await api.post<BulkResponse>("/holidays/bulk-upload", {
    body: form,
  });
  return {
    totalRows: body.data?.totalRows ?? 0,
    inserted: body.data?.inserted ?? 0,
    skipped: body.data?.skipped ?? 0,
    errors: body.data?.errors ?? body.errors ?? undefined,
  };
};
