import { useQuery } from "@tanstack/react-query";
import { getSalaryStructures } from "../services/salaryStructureService";

export const SALARY_STRUCTURES_QUERY_KEY = "salary-structures" as const;

export function useSalaryStructures(vendorId: string | null, enabled = true) {
  return useQuery({
    queryKey: [SALARY_STRUCTURES_QUERY_KEY, vendorId],
    queryFn: () => getSalaryStructures(vendorId!),
    enabled: Boolean(vendorId) && enabled,
  });
}
