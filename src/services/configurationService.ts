import { api } from "../lib/apiClient";

export type AttendanceSettings = {
  autoMarkAttendance: boolean;
  allowMultiDeviceLogin: boolean;
};

export type AiSettings = {
  enabled: boolean;
  personalData: boolean;
  monthlyBudgetUsd: number;
  usedThisMonthUsd: number;
};

/** GET /api/vendor/attendance-settings */
export const getAttendanceSettings = async (): Promise<AttendanceSettings> => {
  const data = await api.get<{ success: boolean; data: AttendanceSettings }>(
    "/vendor/attendance-settings",
  );
  return data.data;
};

/** PUT /api/vendor/attendance-settings */
export const updateAttendanceSettings = async (
  payload: Partial<AttendanceSettings>,
): Promise<AttendanceSettings> => {
  const data = await api.put<{
    success: boolean;
    message: string;
    data: AttendanceSettings;
  }>("/vendor/attendance-settings", { json: payload });
  return data.data;
};

/** GET /api/ai/settings */
export const getAiSettings = async (): Promise<AiSettings> => {
  const data = await api.get<{ success: boolean; data: AiSettings }>(
    "/ai/settings",
  );
  return data.data;
};

/** PUT /api/ai/settings */
export const updateAiSettings = async (
  personalData: boolean,
): Promise<AiSettings> => {
  const data = await api.put<{
    success: boolean;
    message: string;
    data: AiSettings;
  }>("/ai/settings", { json: { personalData } });
  return data.data;
};
