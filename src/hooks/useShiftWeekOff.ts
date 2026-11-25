import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createShift,
  createWeekOff,
  deleteShift,
  deleteWeekOff,
  getShiftSettings,
  getWeekOffs,
  updateShift,
  updateWeekOff,
  type ShiftPayload,
  type WeekOffPayload,
} from "../services/shiftService";

/**
 * Settings → Shifts & Week Off keys.
 * Deliberately distinct from `SHIFTS_KEY` ("department-shifts") in useDepartments,
 * which serves the department-assignment dropdown.
 */
export const SHIFT_SETTINGS_KEY = "shift-settings";
export const WEEK_OFFS_KEY = "week-offs";

export function useShiftSettings(vendorId?: string | null, enabled = true) {
  return useQuery({
    queryKey: [SHIFT_SETTINGS_KEY, vendorId || ""],
    queryFn: () => getShiftSettings(vendorId || ""),
    enabled: Boolean(vendorId) && enabled,
  });
}

export function useCreateShift() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: ShiftPayload) => createShift(payload),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: [SHIFT_SETTINGS_KEY] });
    },
  });
}

export function useUpdateShift() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ shiftId, data }: { shiftId: string; data: ShiftPayload }) =>
      updateShift(shiftId, data),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: [SHIFT_SETTINGS_KEY] });
    },
  });
}

export function useDeleteShift() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (shiftId: string) => deleteShift(shiftId),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: [SHIFT_SETTINGS_KEY] });
    },
  });
}

export function useWeekOffs(vendorId?: string | null, enabled = true) {
  return useQuery({
    queryKey: [WEEK_OFFS_KEY, vendorId || ""],
    queryFn: () => getWeekOffs(vendorId || ""),
    enabled: Boolean(vendorId) && enabled,
  });
}

export function useCreateWeekOff() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: WeekOffPayload) => createWeekOff(payload),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: [WEEK_OFFS_KEY] });
    },
  });
}

export function useUpdateWeekOff() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      weekOffId,
      data,
    }: {
      weekOffId: string;
      data: WeekOffPayload;
    }) => updateWeekOff(weekOffId, data),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: [WEEK_OFFS_KEY] });
    },
  });
}

export function useDeleteWeekOff() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (weekOffId: string) => deleteWeekOff(weekOffId),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: [WEEK_OFFS_KEY] });
    },
  });
}
