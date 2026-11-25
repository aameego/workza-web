import { api } from "../lib/apiClient";

/** Late Mark Policy — backend `Shift.status` enum. */
export type LateMarkPolicy = "Present" | "Late" | "Half Day" | "Absent";

export type Weekday =
  | "Monday"
  | "Tuesday"
  | "Wednesday"
  | "Thursday"
  | "Friday"
  | "Saturday"
  | "Sunday";

/** Row returned by GET /setting/getShift/:vendorId. */
export type Shift = {
  _id: string;
  vendorId?: string | { _id: string; name?: string; email?: string };
  shiftName: string;
  /** HH:MM (24h) */
  startTime: string;
  /** HH:MM (24h) */
  endTime: string;
  /** minutes */
  graceTime: number;
  status: LateMarkPolicy;
  /** Not in the backend schema yet — defaults to Active when absent. */
  isActive?: boolean;
};

/** Create/update body for /setting/createShift | /setting/updateShift/:id. */
export type ShiftPayload = {
  vendorId: string;
  shiftName: string;
  /** HH:MM */
  startTime: string;
  /** HH:MM */
  endTime: string;
  /** minutes */
  graceTime: number;
  status: LateMarkPolicy;
};

/** Row returned by GET /setting/getWeekOffs/:vendorId. */
export type WeekOffPolicy = {
  _id: string;
  vendorId?: string;
  /** Department NAME, or null/undefined for the org-wide default. */
  department?: string | null;
  weekOffDays: Weekday[];
  createdAt?: string;
  updatedAt?: string;
};

/** Create/update body for /setting/createWeekOff | /setting/updateWeekOff/:id. */
export type WeekOffPayload = {
  vendorId: string;
  department: string | null;
  weekOffDays: Weekday[];
};

type ListResponse<T> = {
  success: boolean;
  count?: number;
  data?: T[];
};

export const LATE_MARK_POLICIES: LateMarkPolicy[] = [
  "Present",
  "Late",
  "Half Day",
  "Absent",
];

export const WEEKDAYS: Weekday[] = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

/* ── Shifts ─────────────────────────────────────────────── */

/** GET /setting/getShift/:vendorId */
export const getShiftSettings = async (vendorId: string): Promise<Shift[]> => {
  if (!vendorId) return [];
  const body = await api.get<ListResponse<Shift> | Shift[]>(
    `/setting/getShift/${vendorId}`,
  );
  if (Array.isArray(body)) return body;
  return body.data ?? [];
};

/** POST /setting/createShift */
export const createShift = async (payload: ShiftPayload): Promise<void> => {
  await api.post("/setting/createShift", { json: payload });
};

/** PUT /setting/updateShift/:shiftId */
export const updateShift = async (
  shiftId: string,
  payload: ShiftPayload,
): Promise<void> => {
  await api.put(`/setting/updateShift/${shiftId}`, { json: payload });
};

/** DELETE /setting/deleteShift/:shiftId */
export const deleteShift = async (shiftId: string): Promise<void> => {
  await api.delete(`/setting/deleteShift/${shiftId}`);
};

/* ── Week-off policies ──────────────────────────────────── */

/** GET /setting/getWeekOffs/:vendorId */
export const getWeekOffs = async (
  vendorId: string,
): Promise<WeekOffPolicy[]> => {
  if (!vendorId) return [];
  const body = await api.get<ListResponse<WeekOffPolicy> | WeekOffPolicy[]>(
    `/setting/getWeekOffs/${vendorId}`,
  );
  if (Array.isArray(body)) return body;
  return body.data ?? [];
};

/** POST /setting/createWeekOff */
export const createWeekOff = async (
  payload: WeekOffPayload,
): Promise<void> => {
  await api.post("/setting/createWeekOff", { json: payload });
};

/** PUT /setting/updateWeekOff/:weekOffId */
export const updateWeekOff = async (
  weekOffId: string,
  payload: WeekOffPayload,
): Promise<void> => {
  await api.put(`/setting/updateWeekOff/${weekOffId}`, { json: payload });
};

/** DELETE /setting/deleteWeekOff/:weekOffId */
export const deleteWeekOff = async (weekOffId: string): Promise<void> => {
  await api.delete(`/setting/deleteWeekOff/${weekOffId}`);
};
