import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  applySalaryTemplate,
  createSalaryComponent,
  deleteSalaryComponent,
  getSalaryComponents,
  getSalaryTemplates,
  updateSalaryComponent,
  type SalaryComponentPayload,
} from "../services/salaryComponentService";
import {
  createSalaryStructure,
  deleteSalaryStructure,
  getSalaryStructureList,
  updateSalaryStructure,
  type StructurePayload,
} from "../services/salaryStructureService";
import { SALARY_STRUCTURES_QUERY_KEY } from "./useSalaryStructures";

/**
 * Settings → Salary keys.
 * `salary-structure-list` holds the full records (table + modal);
 * `salary-structures` (useSalaryStructures) holds the lightweight dropdown
 * options used by the employee editor — same endpoint, separate cache slot.
 */
export const SALARY_COMPONENTS_QUERY_KEY = "salary-components";
export const SALARY_TEMPLATES_QUERY_KEY = "salary-templates";
export const SALARY_STRUCTURE_LIST_QUERY_KEY = "salary-structure-list";

export function useSalaryComponents(vendorId?: string | null, enabled = true) {
  return useQuery({
    queryKey: [SALARY_COMPONENTS_QUERY_KEY, vendorId || ""],
    queryFn: () => getSalaryComponents(true),
    enabled: Boolean(vendorId) && enabled,
  });
}

export function useSalaryTemplates(vendorId?: string | null, enabled = true) {
  return useQuery({
    queryKey: [SALARY_TEMPLATES_QUERY_KEY, vendorId || ""],
    queryFn: () => getSalaryTemplates(),
    enabled: Boolean(vendorId) && enabled,
  });
}

export function useSalaryStructureList(
  vendorId?: string | null,
  enabled = true,
) {
  return useQuery({
    queryKey: [SALARY_STRUCTURE_LIST_QUERY_KEY, vendorId || ""],
    queryFn: () => getSalaryStructureList(vendorId || ""),
    enabled: Boolean(vendorId) && enabled,
  });
}

/** Component edits also refresh structure rows (they embed component data). */
const useInvalidateSalary = () => {
  const qc = useQueryClient();
  return (extraKeys: string[] = []) => {
    void qc.invalidateQueries({ queryKey: [SALARY_COMPONENTS_QUERY_KEY] });
    void qc.invalidateQueries({ queryKey: [SALARY_STRUCTURE_LIST_QUERY_KEY] });
    void qc.invalidateQueries({ queryKey: [SALARY_STRUCTURES_QUERY_KEY] });
    extraKeys.forEach((key) => {
      void qc.invalidateQueries({ queryKey: [key] });
    });
  };
};

export function useCreateSalaryComponent() {
  const invalidate = useInvalidateSalary();
  return useMutation({
    mutationFn: (payload: SalaryComponentPayload) =>
      createSalaryComponent(payload),
    onSuccess: () => invalidate(),
  });
}

export function useUpdateSalaryComponent() {
  const invalidate = useInvalidateSalary();
  return useMutation({
    mutationFn: ({
      code,
      data,
    }: {
      code: string;
      data: Partial<SalaryComponentPayload> & { isActive?: boolean };
    }) => updateSalaryComponent(code, data),
    onSuccess: () => invalidate(),
  });
}

export function useDeleteSalaryComponent() {
  const invalidate = useInvalidateSalary();
  return useMutation({
    mutationFn: (code: string) => deleteSalaryComponent(code),
    onSuccess: () => invalidate(),
  });
}

export function useApplySalaryTemplate() {
  const invalidate = useInvalidateSalary();
  return useMutation({
    mutationFn: (templateKey: string) => applySalaryTemplate(templateKey),
    onSuccess: () => invalidate(),
  });
}

export function useCreateSalaryStructure() {
  const invalidate = useInvalidateSalary();
  return useMutation({
    mutationFn: (payload: StructurePayload) => createSalaryStructure(payload),
    onSuccess: () => invalidate(),
  });
}

export function useUpdateSalaryStructure() {
  const invalidate = useInvalidateSalary();
  return useMutation({
    mutationFn: ({
      structureId,
      vendorId,
      data,
    }: {
      structureId: string;
      vendorId: string;
      data: StructurePayload;
    }) => updateSalaryStructure(vendorId, structureId, data),
    onSuccess: () => invalidate(),
  });
}

export function useDeleteSalaryStructure() {
  const invalidate = useInvalidateSalary();
  return useMutation({
    mutationFn: ({ structureId, vendorId }: { structureId: string; vendorId: string }) =>
      deleteSalaryStructure(vendorId, structureId),
    onSuccess: () => invalidate(),
  });
}
