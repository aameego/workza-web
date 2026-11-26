import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  decideRegularization,
  getRegularizationConfig,
  getRegularizationDashboard,
  getRegularizationRequests,
  updateRegularizationConfig,
  type RegularizationConfig,
  type RegularizationStatus,
} from "../services/regularizationService";

const KEY = "regularization" as const;

export function useRegularizationDashboard() {
  return useQuery({ queryKey: [KEY, "dashboard"], queryFn: getRegularizationDashboard });
}

export function useRegularizationRequests(status?: RegularizationStatus, enabled = true) {
  return useQuery({
    queryKey: [KEY, "requests", status || "all"],
    queryFn: () => getRegularizationRequests({ status }),
    enabled,
  });
}

/** Any regularization write (decide, direct edit) refreshes counts and every list. */
export function useInvalidateRegularization() {
  const qc = useQueryClient();
  return () => void qc.invalidateQueries({ queryKey: [KEY] });
}

export function useDecideRegularization() {
  const invalidate = useInvalidateRegularization();
  return useMutation({
    mutationFn: (v: { id: string; decision: "approve" | "reject"; comment: string }) =>
      decideRegularization(v.id, v.decision, v.comment),
    onSuccess: invalidate,
  });
}

export function useRegularizationConfig(enabled = true) {
  return useQuery({ queryKey: [KEY, "config"], queryFn: getRegularizationConfig, enabled });
}

export function useSaveRegularizationConfig() {
  const invalidate = useInvalidateRegularization();
  return useMutation({
    mutationFn: (config: RegularizationConfig) => updateRegularizationConfig(config),
    onSuccess: invalidate,
  });
}
