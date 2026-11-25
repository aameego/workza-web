import { api } from "../lib/apiClient";

/** Action applied when overtime thresholds are met. */
export type OvertimeAction = "Incentive" | "Add Leave" | "None";

export type OvertimeTriggerType = "Daily" | "Weekly" | "Monthly";

export type Weekday =
  | "Monday"
  | "Tuesday"
  | "Wednesday"
  | "Thursday"
  | "Friday"
  | "Saturday"
  | "Sunday";

/** Row returned by GET /setting/getOvertimePolicies/:vendorId — thresholds are minutes. */
export type OvertimePolicy = {
  _id: string;
  vendorId?: string | { _id: string; name?: string; email?: string };
  policyName: string;
  policyDepartment?: string;
  OverTimeAction: OvertimeAction;
  triggerType: OvertimeTriggerType;
  rateMultiplier?: number;
  /** minutes */
  halfDayThreshold: number;
  /** minutes */
  fullDayThreshold: number;
  /** minutes */
  minHours: number;
  perHourRate: number;
  applicableDays: Weekday[];
  lastUpdated?: string;
};

/** Create/update body — thresholds in minutes (hours × 60 at the boundary). */
export type OvertimePolicyPayload = {
  vendorId: string;
  policyName: string;
  OverTimeAction: OvertimeAction;
  triggerType: OvertimeTriggerType;
  halfDayThreshold: number;
  fullDayThreshold: number;
  minHours: number;
  perHourRate: number;
  applicableDays: Weekday[];
};

type ListResponse = {
  success: boolean;
  count?: number;
  data?: OvertimePolicy[];
};

/** GET /setting/getOvertimePolicies/:vendorId */
export const getOvertimePolicies = async (
  vendorId: string,
): Promise<OvertimePolicy[]> => {
  if (!vendorId) return [];
  const body = await api.get<ListResponse | OvertimePolicy[]>(
    `/setting/getOvertimePolicies/${vendorId}`,
  );
  if (Array.isArray(body)) return body;
  return body.data ?? [];
};

/** POST /setting/createOvertimePolicy */
export const createOvertimePolicy = async (
  payload: OvertimePolicyPayload,
): Promise<void> => {
  await api.post("/setting/createOvertimePolicy", { json: payload });
};

/** PUT /setting/updateOvertimePolicy/:policyId */
export const updateOvertimePolicy = async (
  policyId: string,
  payload: OvertimePolicyPayload,
): Promise<void> => {
  await api.put(`/setting/updateOvertimePolicy/${policyId}`, { json: payload });
};

/** DELETE /setting/deleteOvertimePolicy/:policyId */
export const deleteOvertimePolicy = async (policyId: string): Promise<void> => {
  await api.delete(`/setting/deleteOvertimePolicy/${policyId}`);
};
