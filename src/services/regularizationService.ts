import { api } from "../lib/apiClient";

export type RegularizationKind = "attendance" | "leave";
export type RegularizationStatus = "Pending" | "Approved" | "Rejected" | "Cancelled";

export type RegularizationEmployee = {
  _id?: string;
  name?: string;
  employeeCode?: string;
};

/** Attendance: date/status/checkIn/checkOut. Leave: leaveType/startDate/endDate/reason. */
export type RegularizationValues = {
  date?: string;
  status?: string;
  checkIn?: string | null;
  checkOut?: string | null;
  leaveType?: string;
  requestType?: string;
  startDate?: string;
  endDate?: string;
  reason?: string;
  dayPart?: string;
};

export type RegularizationRequest = {
  _id: string;
  kind: RegularizationKind;
  status: RegularizationStatus;
  reason?: string;
  employeeId?: RegularizationEmployee | string | null;
  requested?: RegularizationValues | null;
  previous?: RegularizationValues | null;
  approverId?: { name?: string; email?: string } | null;
  approverComment?: string;
  decidedAt?: string | null;
  createdAt?: string;
};

export type RegularizationDashboard = {
  canApprove: boolean;
  counts: {
    allRequests?: number;
    awaitingApproval?: number;
    approvedThisMonth?: number;
  };
};

export type RegularizationConfig = {
  monthlyLimit: number | null;
  monthlyLeaveLimit: number | null;
  attendanceWindowDays: number | null;
  leaveWindowDays: number | null;
};

export const getRegularizationDashboard = () =>
  api.get<RegularizationDashboard>("/regularization/dashboard");

/**
 * ponytail: backend caps a page at 100 and has no search/date params, so the
 * tables filter the newest 100 client-side; add server paging if orgs outgrow it.
 */
export const getRegularizationRequests = async (params: {
  status?: RegularizationStatus;
  kind?: RegularizationKind;
}): Promise<RegularizationRequest[]> => {
  const res = await api.get<{ requests?: RegularizationRequest[] }>("/regularization/requests", {
    params: { ...params, limit: 100 },
  });
  return res.requests || [];
};

export const decideRegularization = (id: string, decision: "approve" | "reject", comment: string) =>
  api.patch(`/regularization/requests/${id}/${decision}`, { json: { comment } });

export const getRegularizationConfig = async (): Promise<RegularizationConfig> =>
  (await api.get<{ config: RegularizationConfig }>("/regularization/config")).config;

export const updateRegularizationConfig = (config: RegularizationConfig) =>
  api.put("/regularization/config", { json: config });
