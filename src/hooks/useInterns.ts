import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  addIntern,
  configureInternStipend,
  convertInternToEmployee,
  deleteIntern,
  extendInternship,
  getInternById,
  getInternDocuments,
  getInterns,
  getInternStats,
  resendInternCredentials,
  restoreIntern,
  searchInterns,
  toggleInternAppLogin,
  updateIntern,
  updateInternStatus,
} from "../services/internService";
import type {
  ConfigureInternStipendPayload,
  ConvertInternPayload,
  InternListParams,
  InternSearchParams,
} from "../services/internTypes";
import { EMPLOYEES_QUERY_KEY } from "./useEmployees";

export const INTERNS_QUERY_KEY = "interns" as const;
export const INTERN_SEARCH_QUERY_KEY = "internSearch" as const;
export const INTERN_STATS_QUERY_KEY = "internStats" as const;

export function useInterns(params: InternListParams = {}, enabled = true) {
  return useQuery({
    queryKey: [INTERNS_QUERY_KEY, params],
    queryFn: () => getInterns(params),
    enabled,
    placeholderData: (prev) => prev,
  });
}

export function useInternDetail(id: string | undefined, enabled = true) {
  return useQuery({
    queryKey: [INTERNS_QUERY_KEY, "detail", id],
    queryFn: () => getInternById(id!),
    enabled: Boolean(id) && enabled,
  });
}

export function useInternSearch(params: InternSearchParams, enabled = true) {
  const hasQuery = Boolean(
    params &&
      Object.keys(params).some(
        (k) => params[k as keyof InternSearchParams] !== undefined,
      ),
  );
  return useQuery({
    queryKey: [INTERN_SEARCH_QUERY_KEY, params],
    queryFn: () => searchInterns(params),
    enabled: enabled && hasQuery,
  });
}

export function useInternStats(enabled = true) {
  return useQuery({
    queryKey: [INTERN_STATS_QUERY_KEY],
    queryFn: () => getInternStats(),
    enabled,
  });
}

export function useInternDocuments(id: string | undefined, enabled = true) {
  return useQuery({
    queryKey: [INTERNS_QUERY_KEY, "documents", id],
    queryFn: () => getInternDocuments(id!),
    enabled: Boolean(id) && enabled,
  });
}

export function useAddIntern() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => addIntern(data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: [INTERNS_QUERY_KEY] });
      void queryClient.invalidateQueries({ queryKey: [INTERN_STATS_QUERY_KEY] });
    },
  });
}

export function useUpdateIntern() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: Record<string, unknown>;
    }) => updateIntern(id, data),
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({ queryKey: [INTERNS_QUERY_KEY] });
      void queryClient.invalidateQueries({
        queryKey: [INTERNS_QUERY_KEY, "detail", variables.id],
      });
    },
  });
}

export function useUpdateInternStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      status,
      remark,
    }: {
      id: string;
      status: string;
      remark?: string;
    }) => updateInternStatus(id, { status, remark }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: [INTERNS_QUERY_KEY] });
      void queryClient.invalidateQueries({ queryKey: [INTERN_STATS_QUERY_KEY] });
    },
  });
}

export function useExtendInternship() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      newEndDate,
      remark,
    }: {
      id: string;
      newEndDate: string;
      remark?: string;
    }) => extendInternship(id, { newEndDate, remark }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: [INTERNS_QUERY_KEY] });
    },
  });
}

export function useConfigureInternStipend() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      ...payload
    }: { id: string } & ConfigureInternStipendPayload) =>
      configureInternStipend(id, payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: [INTERNS_QUERY_KEY] });
    },
  });
}

export function useConvertInternToEmployee() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      ...payload
    }: { id: string } & ConvertInternPayload) =>
      convertInternToEmployee(id, payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: [INTERNS_QUERY_KEY] });
      void queryClient.invalidateQueries({ queryKey: [INTERN_STATS_QUERY_KEY] });
      void queryClient.invalidateQueries({ queryKey: [EMPLOYEES_QUERY_KEY] });
    },
  });
}

export function useDeleteIntern() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteIntern(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: [INTERNS_QUERY_KEY] });
      void queryClient.invalidateQueries({ queryKey: [INTERN_STATS_QUERY_KEY] });
    },
  });
}

export function useRestoreIntern() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => restoreIntern(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: [INTERNS_QUERY_KEY] });
      void queryClient.invalidateQueries({ queryKey: [INTERN_STATS_QUERY_KEY] });
    },
  });
}

export function useToggleInternAppLogin() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, enable }: { id: string; enable: boolean }) =>
      toggleInternAppLogin(id, enable),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: [INTERNS_QUERY_KEY] });
    },
  });
}

export function useResendInternCredentials() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => resendInternCredentials(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: [INTERNS_QUERY_KEY] });
    },
  });
}