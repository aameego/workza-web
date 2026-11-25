import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createOvertimePolicy,
  deleteOvertimePolicy,
  getOvertimePolicies,
  updateOvertimePolicy,
  type OvertimePolicyPayload,
} from "../services/overtimeService";

export const OVERTIME_POLICIES_KEY = "overtime-policies";

export function useOvertimePolicies(vendorId?: string | null, enabled = true) {
  return useQuery({
    queryKey: [OVERTIME_POLICIES_KEY, vendorId || ""],
    queryFn: () => getOvertimePolicies(vendorId || ""),
    enabled: Boolean(vendorId) && enabled,
  });
}

export function useCreateOvertimePolicy() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: OvertimePolicyPayload) =>
      createOvertimePolicy(payload),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: [OVERTIME_POLICIES_KEY] });
    },
  });
}

export function useUpdateOvertimePolicy() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      policyId,
      data,
    }: {
      policyId: string;
      data: OvertimePolicyPayload;
    }) => updateOvertimePolicy(policyId, data),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: [OVERTIME_POLICIES_KEY] });
    },
  });
}

export function useDeleteOvertimePolicy() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (policyId: string) => deleteOvertimePolicy(policyId),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: [OVERTIME_POLICIES_KEY] });
    },
  });
}
