import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  bulkUploadMonthAttendance,
  checkInAttendance,
  checkOutAttendance,
  directEditAttendance,
  downloadAttendanceReport,
  downloadMonthlyAttendanceReport,
  downloadMonthlyUploadTemplate,
  getAttendanceList,
  getMonthlyAttendance,
  markAttendance,
  markMonthAttendance,
  type AttendanceListParams,
  type AttendanceTarget,
  type DirectEditAttendancePayload,
  type GetMonthlyAttendanceOptions,
  type MarkMonthAttendancePayload,
  type MonthlyReportParams,
  type MonthlyUploadTemplateParams,
} from "../services/attendanceService";

export const ATTENDANCE_MONTH_KEY = "attendance-month" as const;
export const ATTENDANCE_LIST_KEY = "attendance-list" as const;

export function useAttendanceMonth(
  year: number,
  month: number,
  options: GetMonthlyAttendanceOptions,
  enabled = true,
) {
  return useQuery({
    queryKey: [
      ATTENDANCE_MONTH_KEY,
      year,
      month,
      options.target || "self",
      options.employeeId || "",
    ],
    queryFn: () => getMonthlyAttendance(year, month, options),
    enabled,
  });
}

export function useAttendanceList(
  params: AttendanceListParams,
  enabled = true,
) {
  return useQuery({
    queryKey: [ATTENDANCE_LIST_KEY, params],
    queryFn: () => getAttendanceList(params),
    enabled,
  });
}

export function useDownloadAttendanceReport() {
  return useMutation({
    mutationFn: (params: AttendanceListParams) =>
      downloadAttendanceReport(params),
  });
}

export function useMarkAttendance() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: Record<string, unknown>) => markAttendance(payload),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: [ATTENDANCE_LIST_KEY] });
      void qc.invalidateQueries({ queryKey: [ATTENDANCE_MONTH_KEY] });
    },
  });
}

export function useDirectEditAttendance() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: DirectEditAttendancePayload) =>
      directEditAttendance(payload),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: [ATTENDANCE_LIST_KEY] });
      void qc.invalidateQueries({ queryKey: [ATTENDANCE_MONTH_KEY] });
    },
  });
}

export function useDownloadMonthlyUploadTemplate() {
  return useMutation({
    mutationFn: (params: MonthlyUploadTemplateParams) =>
      downloadMonthlyUploadTemplate(params),
  });
}

export function useBulkUploadMonthAttendance() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (file: File) => bulkUploadMonthAttendance(file),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: [ATTENDANCE_LIST_KEY] });
      void qc.invalidateQueries({ queryKey: [ATTENDANCE_MONTH_KEY] });
    },
  });
}

export function useMarkMonthAttendance() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: MarkMonthAttendancePayload) =>
      markMonthAttendance(payload),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: [ATTENDANCE_LIST_KEY] });
      void qc.invalidateQueries({ queryKey: [ATTENDANCE_MONTH_KEY] });
    },
  });
}

export function useMonthReport() {
  return useMutation({
    mutationFn: (params: MonthlyReportParams) =>
      downloadMonthlyAttendanceReport(params),
  });
}

export function useCheckInOut(target: AttendanceTarget = "self") {
  const qc = useQueryClient();
  const invalidate = () => {
    void qc.invalidateQueries({ queryKey: [ATTENDANCE_LIST_KEY] });
    void qc.invalidateQueries({ queryKey: [ATTENDANCE_MONTH_KEY] });
  };

  const checkIn = useMutation({
    mutationFn: (input: {
      selfieFile: Blob;
      latitude: number;
      longitude: number;
      accuracy?: number | null;
      notes?: string;
    }) => checkInAttendance(input.selfieFile, input),
    onSuccess: invalidate,
  });

  const checkOut = useMutation({
    mutationFn: (input: {
      selfieFile: Blob;
      latitude: number;
      longitude: number;
      accuracy?: number | null;
    }) => checkOutAttendance(input.selfieFile, input),
    onSuccess: invalidate,
  });

  return { checkIn, checkOut, target };
}
