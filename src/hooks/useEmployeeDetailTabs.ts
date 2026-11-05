import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getEmployeeDocuments,
  uploadEmployeeDocument,
} from "../services/documentService";
import {
  getEmployeeStructure,
  previewEmployeeStructure,
} from "../services/employeeSalaryService";
import { getMonthlyAttendance } from "../services/attendanceService";

export const EMPLOYEE_DOCS_KEY = "employee-documents" as const;
export const EMPLOYEE_SALARY_KEY = "employee-salary" as const;
export const EMPLOYEE_ATTENDANCE_KEY = "employee-attendance" as const;

export function useEmployeeDocuments(employeeId: string | undefined, enabled = true) {
  return useQuery({
    queryKey: [EMPLOYEE_DOCS_KEY, employeeId],
    queryFn: () => getEmployeeDocuments(employeeId!),
    enabled: Boolean(employeeId) && enabled,
  });
}

export function useUploadEmployeeDocument(employeeId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { documentType: string; file: File }) =>
      uploadEmployeeDocument({
        employeeId: employeeId!,
        documentType: input.documentType,
        file: input.file,
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: [EMPLOYEE_DOCS_KEY, employeeId],
      });
    },
  });
}

export function useEmployeeSalary(employeeId: string | undefined, enabled = true) {
  return useQuery({
    queryKey: [EMPLOYEE_SALARY_KEY, employeeId],
    queryFn: async () => {
      const [structure, preview] = await Promise.all([
        getEmployeeStructure(employeeId!),
        previewEmployeeStructure(employeeId!).catch(() => null),
      ]);
      return { structure, preview };
    },
    enabled: Boolean(employeeId) && enabled,
  });
}

export function useEmployeeAttendanceMonth(
  employeeId: string | undefined,
  year: number,
  month: number,
  enabled = true,
) {
  return useQuery({
    queryKey: [EMPLOYEE_ATTENDANCE_KEY, employeeId, year, month],
    queryFn: () => getMonthlyAttendance(year, month, employeeId!),
    enabled: Boolean(employeeId) && enabled,
  });
}
