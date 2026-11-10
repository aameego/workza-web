import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  approveLeaveRequest,
  applyLeavePolicyTemplate,
  cancelLeaveRequest,
  createLeaveRequest,
  createLeaveRequestMultipart,
  directEditLeave,
  getLeaveBalances,
  getLeaveDashboard,
  getLeavePolicy,
  getLeaveRequests,
  rejectLeaveRequest,
  runLeaveAccrual,
  updateLeaveBalances,
  updateLeavePolicy,
  type CreateLeavePayload,
  type LeaveBalanceUpdatePayload,
  type LeavePolicy,
  type LeavePolicyType,
  type LeaveRequestsParams,
} from "../services/leaveService";

export const LEAVE_DASHBOARD_KEY = "leave-dashboard" as const;
export const LEAVE_REQUESTS_KEY = "leave-requests" as const;
export const LEAVE_BALANCES_KEY = "leave-balances" as const;
export const LEAVE_POLICY_KEY = "leave-policy" as const;

const invalidateLeave = (qc: ReturnType<typeof useQueryClient>) => {
  void qc.invalidateQueries({ queryKey: [LEAVE_DASHBOARD_KEY] });
  void qc.invalidateQueries({ queryKey: [LEAVE_REQUESTS_KEY] });
  void qc.invalidateQueries({ queryKey: [LEAVE_BALANCES_KEY] });
};

export function useLeaveDashboard(enabled = true) {
  return useQuery({
    queryKey: [LEAVE_DASHBOARD_KEY],
    queryFn: getLeaveDashboard,
    enabled,
  });
}

export function useLeaveRequests(
  params: LeaveRequestsParams = {},
  enabled = true,
) {
  return useQuery({
    queryKey: [LEAVE_REQUESTS_KEY, params],
    queryFn: () => getLeaveRequests(params),
    enabled,
  });
}

export function useLeaveBalances(employeeId?: string, enabled = true) {
  return useQuery({
    queryKey: [LEAVE_BALANCES_KEY, employeeId || "self"],
    queryFn: () => getLeaveBalances(employeeId),
    enabled,
  });
}

export function useCreateLeaveRequest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateLeavePayload) => createLeaveRequest(payload),
    onSuccess: () => invalidateLeave(qc),
  });
}

export function useCreateLeaveRequestMultipart() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (formData: FormData) => createLeaveRequestMultipart(formData),
    onSuccess: () => invalidateLeave(qc),
  });
}

export function useApproveLeaveRequest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, comment }: { id: string; comment?: string }) =>
      approveLeaveRequest(id, comment || ""),
    onSuccess: () => invalidateLeave(qc),
  });
}

export function useRejectLeaveRequest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, comment }: { id: string; comment?: string }) =>
      rejectLeaveRequest(id, comment || ""),
    onSuccess: () => invalidateLeave(qc),
  });
}

export function useCancelLeaveRequest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      cancelReason,
    }: {
      id: string;
      cancelReason?: string;
    }) => cancelLeaveRequest(id, cancelReason ? { cancelReason } : {}),
    onSuccess: () => invalidateLeave(qc),
  });
}

export function useUpdateLeaveBalances() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      employeeId,
      payload,
    }: {
      employeeId: string;
      payload: LeaveBalanceUpdatePayload;
    }) => updateLeaveBalances(employeeId, payload),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: [LEAVE_BALANCES_KEY] });
      void qc.invalidateQueries({ queryKey: [LEAVE_DASHBOARD_KEY] });
    },
  });
}

export function useLeavePolicy(enabled = true) {
  return useQuery({
    queryKey: [LEAVE_POLICY_KEY],
    queryFn: getLeavePolicy,
    enabled,
  });
}

export function useUpdateLeavePolicy() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (
      payload: Partial<LeavePolicy> & { types?: LeavePolicyType[] },
    ) => updateLeavePolicy(payload),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: [LEAVE_POLICY_KEY] });
    },
  });
}

export function useApplyLeavePolicyTemplate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (templateKey: string) => applyLeavePolicyTemplate(templateKey),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: [LEAVE_POLICY_KEY] });
    },
  });
}

export function useRunLeaveAccrual() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: { year?: number; month?: number } = {}) =>
      runLeaveAccrual(payload),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: [LEAVE_BALANCES_KEY] });
      void qc.invalidateQueries({ queryKey: [LEAVE_DASHBOARD_KEY] });
    },
  });
}

export function useDirectEditLeave() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      leaveRequestId,
      payload,
    }: {
      leaveRequestId: string;
      payload: Record<string, unknown>;
    }) => directEditLeave(leaveRequestId, payload),
    onSuccess: () => invalidateLeave(qc),
  });
}
