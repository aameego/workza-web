import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  bulkUploadHolidays,
  createHoliday,
  deleteHoliday,
  getHolidays,
  updateHoliday,
  type HolidayListQuery,
  type HolidayPayload,
} from "../services/holidayService";

export const HOLIDAYS_KEY = "holidays";

export function useHolidays(query: HolidayListQuery, enabled = true) {
  const { vendorId, year, month, department } = query;
  return useQuery({
    queryKey: [HOLIDAYS_KEY, vendorId || "", year ?? null, month ?? null, department ?? null],
    queryFn: () => getHolidays({ vendorId, year, month, department }),
    enabled: Boolean(vendorId) && enabled,
  });
}

export function useCreateHoliday() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: HolidayPayload) => createHoliday(payload),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: [HOLIDAYS_KEY] });
    },
  });
}

export function useUpdateHoliday() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      holidayId,
      data,
    }: {
      holidayId: string;
      data: HolidayPayload;
    }) => updateHoliday(holidayId, data),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: [HOLIDAYS_KEY] });
    },
  });
}

export function useDeleteHoliday() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (holidayId: string) => deleteHoliday(holidayId),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: [HOLIDAYS_KEY] });
    },
  });
}

export function useBulkUploadHolidays() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (file: File) => bulkUploadHolidays(file),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: [HOLIDAYS_KEY] });
    },
  });
}
