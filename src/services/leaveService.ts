import { api } from "../lib/apiClient";

export type LeaveTypeCode = "CL" | "SL" | "EL" | "CO" | "WFH" | "LOP" | "LWP" | string;

export type LeaveRequestStatus =
  | "Pending"
  | "Approved"
  | "Rejected"
  | "Cancelled"
  | string;

export type LeaveEmployeeRef = {
  _id?: string;
  name?: string;
  employeeCode?: string;
  designation?: string;
  email?: string;
  phone?: string;
  department?: string | { name?: string } | null;
};

export type LeaveRequest = {
  _id: string;
  employeeId?: string | LeaveEmployeeRef;
  leaveType?: LeaveTypeCode;
  requestType?: "Leave" | "WFH" | string;
  startDate?: string;
  endDate?: string;
  days?: number;
  dayPart?: "full" | "first-half" | "second-half" | string;
  reason?: string;
  status?: LeaveRequestStatus;
  isCoCredit?: boolean;
  /** What /leave/requests actually returns: the deciding user and when. */
  approverId?: string | { _id?: string; name?: string; email?: string } | null;
  decidedAt?: string | null;
  approvedBy?: string | LeaveEmployeeRef | null;
  approvedAt?: string | null;
  rejectedBy?: string | LeaveEmployeeRef | null;
  rejectedAt?: string | null;
  cancelReason?: string;
  /** Approver's note; the rejection reason on Rejected requests. */
  approverComment?: string;
  createdAt?: string;
  updatedAt?: string;
  medicalDocumentUrl?: string | null;
};

export type LeaveBalanceRow = {
  type: LeaveTypeCode;
  total?: number;
  used?: number;
  remaining?: number;
  label?: string;
};

export type LeaveBalanceEmployee = {
  employeeId?: string;
  _id?: string;
  name?: string;
  employeeCode?: string;
  balances?: LeaveBalanceRow[];
};

export type LeaveSummary = {
  wfhDaysThisMonth?: number;
  leaveDaysThisMonth?: number;
  pendingRequests?: number;
  pendingApprovals?: number;
  totalBalance?: number | null;
  avgBalance?: number | null;
  employeeCount?: number;
  /** Unique employees behind each card for the selected month. */
  employeeCounts?: {
    wfh?: number;
    leave?: number;
    pending?: number;
    rejected?: number;
  };
  rejectedRequests?: number;
  submittedRequests?: number;
  requestCounts?: {
    total?: number;
    pending?: number;
    approved?: number;
    cancelled?: number;
    rejected?: number;
  };
  wfhQuota?: {
    total?: number;
    used?: number;
    remaining?: number;
    monthlyLimit?: number | null;
    annualLimit?: number | null;
    usedThisMonth?: number;
    remainingThisMonth?: number | null;
  };
};

export type LeaveDashboardResponse = {
  role?: string;
  scope?: string;
  hasTeam?: boolean;
  teamCount?: number;
  summary?: LeaveSummary;
  selfSummary?: LeaveSummary;
  teamSummary?: LeaveSummary;
  orgSummary?: LeaveSummary;
  upcoming?: LeaveRequest[];
  recent?: LeaveRequest[];
  balances?: LeaveBalanceRow[] | LeaveBalanceEmployee[];
  pendingApprovals?: LeaveRequest[];
  teamPendingApprovals?: LeaveRequest[];
};

export type LeaveRequestsParams = {
  status?: string;
  employeeId?: string;
  search?: string;
  page?: number;
  limit?: number;
  leaveType?: string;
  requestType?: string;
  /** Month picker: requests overlapping this month. */
  year?: number;
  month?: number;
  /** My Team: direct reportees only, never the viewer's own requests. */
  team?: boolean;
};

export type LeaveRequestsResponse = {
  requests?: LeaveRequest[];
  total?: number;
  page?: number;
  limit?: number;
  totalPages?: number;
};

export type CreateLeavePayload = {
  employeeId?: string;
  leaveType: string;
  requestType: string;
  startDate: string;
  endDate: string;
  dayPart?: string;
  reason: string;
  isCoCredit?: boolean;
};

export type LeaveBalancesResponse = {
  employeeId?: string;
  name?: string;
  employeeCode?: string;
  balances?: LeaveBalanceRow[];
  wfhQuota?: LeaveSummary["wfhQuota"];
};

export type LeavePolicyType = {
  code: string;
  label?: string;
  name?: string;
  enabled?: boolean;
  paid?: boolean;
  hasBalance?: boolean;
  monthlyLimit?: number | null;
  annualLimit?: number | null;
  accrual?: {
    method?: string;
    monthlyCredit?: number | null;
    yearlyCap?: number | null;
    minPresentDays?: number | null;
    standardWorkingDays?: number | null;
  };
  yearEnd?: {
    lapseUnused?: boolean;
    carryForwardMax?: number | null;
    lapseExcessCarry?: boolean;
  };
  monthEnd?: {
    lapseUnused?: boolean;
  };
  /** SL only — ask for a medical document above this many days (blank = never). */
  documents?: {
    requiredWhenDaysGt?: number | null;
  };
  encashment?: {
    enabled?: boolean;
    on?: string | null;
    base?: string | null;
  };
};

export type LeavePolicy = {
  _id?: string;
  vendorId?: string;
  yearStartMonth?: number;
  yearStartDay?: number;
  templateKey?: string;
  /** When true, employees may apply CL/SL/EL while still on probation. Accrual always runs. */
  accruePaidLeaveDuringProbation?: boolean;
  types?: LeavePolicyType[];
};

export const getLeaveDashboard = async (
  params: { year?: number; month?: number } = {},
): Promise<LeaveDashboardResponse> =>
  api.get<LeaveDashboardResponse>("/leave/dashboard", { params });

export const getLeaveRequests = async (
  params: LeaveRequestsParams | string = {},
): Promise<LeaveRequestsResponse> => {
  const query =
    typeof params === "string" ? { status: params } : (params || {});
  return api.get<LeaveRequestsResponse>("/leave/requests", { params: query });
};

export const createLeaveRequest = async (
  payload: CreateLeavePayload,
): Promise<unknown> => api.post("/leave/requests", { json: payload });

export const createLeaveRequestMultipart = async (
  formData: FormData,
): Promise<unknown> => api.post("/leave/requests", { body: formData });

export const approveLeaveRequest = async (
  id: string,
  comment = "",
): Promise<unknown> =>
  api.patch(`/leave/requests/${id}/approve`, { json: { comment } });

export const rejectLeaveRequest = async (
  id: string,
  comment = "",
): Promise<unknown> =>
  api.patch(`/leave/requests/${id}/reject`, { json: { comment } });

export const cancelLeaveRequest = async (
  id: string,
  cancelReason: Record<string, unknown> | string = {},
): Promise<unknown> =>
  api.patch(`/leave/requests/${id}/cancel`, {
    json:
      typeof cancelReason === "string"
        ? { cancelReason }
        : cancelReason,
  });

export const getLeaveBalances = async (
  employeeId?: string,
): Promise<LeaveBalancesResponse> =>
  api.get<LeaveBalancesResponse>("/leave/balances", {
    params: employeeId ? { employeeId } : {},
  });

export type LeaveBalanceUpdatePayload = Partial<
  Record<
    "CL" | "SL" | "EL" | "CO" | "WFH",
    { total?: number; used?: number }
  >
>;

export const updateLeaveBalances = async (
  employeeId: string,
  payload: LeaveBalanceUpdatePayload,
): Promise<unknown> =>
  api.put(`/leave/balances/${employeeId}`, { json: payload });

/** Enabled leave types, readable by every signed-in user. */
export const getLeaveTypes = async (): Promise<{ types: Array<{ code: string; label?: string }> }> =>
  api.get<{ types: Array<{ code: string; label?: string }> }>("/leave/types");

export const getLeavePolicy = async (): Promise<{ policy: LeavePolicy }> =>
  api.get<{ policy: LeavePolicy }>("/leave/policy");

/** PUT /leave/policy response — `sync` reports how many balances were updated. */
export type LeavePolicySaveResponse = {
  policy: LeavePolicy;
  sync?: { employeeCount?: number };
};

export const updateLeavePolicy = async (
  payload: Partial<LeavePolicy> & { types?: LeavePolicyType[] },
): Promise<LeavePolicySaveResponse> =>
  api.put<LeavePolicySaveResponse>("/leave/policy", { json: payload });

export const applyLeavePolicyTemplate = async (
  templateKey: string,
): Promise<{ policy: LeavePolicy }> =>
  api.post<{ policy: LeavePolicy }>("/leave/policy/apply-template", {
    json: { templateKey },
  });

export const runLeaveAccrual = async (
  payload: { year?: number; month?: number } = {},
): Promise<unknown> => api.post("/leave/accrual/run", { json: payload });

export const directEditLeave = async (
  leaveRequestId: string,
  payload: Record<string, unknown>,
): Promise<unknown> =>
  api.patch(`/regularization/direct/leave/${leaveRequestId}`, {
    json: payload,
  });
