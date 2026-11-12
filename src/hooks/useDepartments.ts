import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createDepartment,
  deleteDepartment,
  getDepartments,
  getOtPolicies,
  getShifts,
  updateDepartment,
  type DepartmentPayload,
} from "../services/departmentService";
import { DEPARTMENT_NAMES_QUERY_KEY } from "./useDepartmentNames";

export const DEPARTMENTS_KEY = "departments" as const;
export const SHIFTS_KEY = "department-shifts" as const;
export const OT_POLICIES_KEY = "department-ot-policies" as const;

export function useDepartments(vendorId?: string | null, enabled = true) {
  return useQuery({
    queryKey: [DEPARTMENTS_KEY, vendorId || ""],
    queryFn: () => getDepartments(vendorId || ""),
    enabled: Boolean(vendorId) && enabled,
  });
}

export function useShifts(vendorId?: string | null, enabled = true) {
  return useQuery({
    queryKey: [SHIFTS_KEY, vendorId || ""],
    queryFn: () => getShifts(vendorId || ""),
    enabled: Boolean(vendorId) && enabled,
  });
}

export function useOtPolicies(vendorId?: string | null, enabled = true) {
  return useQuery({
    queryKey: [OT_POLICIES_KEY, vendorId || ""],
    queryFn: () => getOtPolicies(vendorId || ""),
    enabled: Boolean(vendorId) && enabled,
  });
}

const invalidateDepartmentQueries = (
  qc: ReturnType<typeof useQueryClient>,
) => {
  void qc.invalidateQueries({ queryKey: [DEPARTMENTS_KEY] });
  void qc.invalidateQueries({ queryKey: [DEPARTMENT_NAMES_QUERY_KEY] });
};

export function useCreateDepartment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: DepartmentPayload) => createDepartment(payload),
    onSuccess: () => invalidateDepartmentQueries(qc),
  });
}

export function useUpdateDepartment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: DepartmentPayload;
    }) => updateDepartment(id, payload),
    onSuccess: () => invalidateDepartmentQueries(qc),
  });
}

export function useDeleteDepartment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteDepartment(id),
    onSuccess: () => invalidateDepartmentQueries(qc),
  });
}
