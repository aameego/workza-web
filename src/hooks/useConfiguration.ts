import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getAiSettings,
  getAttendanceSettings,
  updateAiSettings,
  updateAttendanceSettings,
  type AiSettings,
  type AttendanceSettings,
} from "../services/configurationService";
import { showSuccessToast } from "../design-system";

export const ATTENDANCE_SETTINGS_KEY = "attendance-settings" as const;
export const AI_SETTINGS_KEY = "ai-settings" as const;

export function useAttendanceSettings() {
  return useQuery({
    queryKey: [ATTENDANCE_SETTINGS_KEY],
    queryFn: getAttendanceSettings,
  });
}

export function useUpdateAttendanceSettings() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: Partial<AttendanceSettings>) =>
      updateAttendanceSettings(payload),
    onSuccess: (data, variables) => {
      qc.setQueryData<AttendanceSettings>([ATTENDANCE_SETTINGS_KEY], data);
      if ("autoMarkAttendance" in variables) {
        showSuccessToast(
          variables.autoMarkAttendance
            ? "Automatic attendance is on."
            : "Automatic attendance is off.",
        );
      } else {
        showSuccessToast(
          variables.allowMultiDeviceLogin
            ? "Users can stay logged in on multiple devices."
            : "Users are limited to one device.",
        );
      }
    },
  });
}

export function useAiSettings() {
  return useQuery({
    queryKey: [AI_SETTINGS_KEY],
    queryFn: getAiSettings,
  });
}

export function useUpdateAiSettings() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (personalData: boolean) => updateAiSettings(personalData),
    onSuccess: (data) => {
      qc.setQueryData<AiSettings>([AI_SETTINGS_KEY], data);
      showSuccessToast(
        data.personalData
          ? "AI features that use personal details are on"
          : "AI features that use personal details are off",
      );
    },
  });
}

export type { AiSettings, AttendanceSettings };
