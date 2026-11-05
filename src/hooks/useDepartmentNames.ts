import { useQuery } from "@tanstack/react-query";
import { getDepartmentNames } from "../services/departmentService";

export const DEPARTMENT_NAMES_QUERY_KEY = "departmentNames" as const;

export function useDepartmentNames(vendorId: string | null | undefined) {
  return useQuery({
    queryKey: [DEPARTMENT_NAMES_QUERY_KEY, vendorId],
    queryFn: () => getDepartmentNames(String(vendorId)),
    enabled: Boolean(vendorId),
  });
}
