import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getProbationPolicy,
  runProbationAutoConfirmNow,
  updateProbationPolicy,
  type ProbationPolicy,
  type ProbationPolicyUpdate,
} from "../services/probationService";
import { showSuccessToast } from "../design-system";

export const PROBATION_POLICY_KEY = "probation-policy" as const;

export function useProbationPolicy() {
  return useQuery({
    queryKey: [PROBATION_POLICY_KEY],
    queryFn: getProbationPolicy,
  });
}

export function useUpdateProbationPolicy() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: ProbationPolicyUpdate) =>
      updateProbationPolicy(payload),
    onSuccess: (data) => {
      qc.setQueryData<ProbationPolicy>([PROBATION_POLICY_KEY], data);
      showSuccessToast("Probation policy saved successfully.");
    },
  });
}

export function useRunProbationAutoConfirm() {
  return useMutation({
    mutationFn: runProbationAutoConfirmNow,
  });
}

export type { ProbationPolicy, ProbationPolicyUpdate };
