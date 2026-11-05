import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  addEmployee,
  bulkUploadEmployees,
  getEmployeeById,
  getEmployees,
  updateEmployee,
} from "../services/employeeService";
import type { EmployeeCreatePayload } from "../pages/employees/employeeForm";
import type { EmployeeListParams } from "../services/employeeTypes";

export const EMPLOYEES_QUERY_KEY = "employees" as const;
export const EMPLOYEE_DETAIL_QUERY_KEY = "employee-detail" as const;

export function useEmployees(params: EmployeeListParams, enabled = true) {
  return useQuery({
    queryKey: [EMPLOYEES_QUERY_KEY, params],
    queryFn: () => getEmployees(params),
    enabled,
    placeholderData: (prev) => prev,
  });
}

export function useEmployee(employeeId: string | undefined, enabled = true) {
  return useQuery({
    queryKey: [EMPLOYEE_DETAIL_QUERY_KEY, employeeId],
    queryFn: () => getEmployeeById(employeeId!),
    enabled: Boolean(employeeId) && enabled,
  });
}

export function useAddEmployee() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: EmployeeCreatePayload) => addEmployee(payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: [EMPLOYEES_QUERY_KEY] });
    },
  });
}

export function useUpdateEmployee() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: EmployeeCreatePayload;
    }) => updateEmployee(id, data),
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({ queryKey: [EMPLOYEES_QUERY_KEY] });
      void queryClient.invalidateQueries({
        queryKey: [EMPLOYEE_DETAIL_QUERY_KEY, variables.id],
      });
    },
  });
}

export function useBulkUploadEmployees() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (file: File) => bulkUploadEmployees(file),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: [EMPLOYEES_QUERY_KEY] });
    },
  });
}
