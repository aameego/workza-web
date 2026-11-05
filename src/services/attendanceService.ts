import { api } from "../lib/apiClient";

export type AttendanceMonthStats = {
  Present?: number;
  Absent?: number;
  "Half Day"?: number;
  Late?: number;
  Leave?: number;
  WFH?: number;
  totalPaidDays?: number;
  [key: string]: number | undefined;
};

export type AttendanceGeoLocation = {
  latitude?: number;
  longitude?: number;
  accuracy?: number | null;
  mapsUrl?: string;
  checkInStatus?: string;
  checkOutStatus?: string;
};

export type AttendanceSession = {
  sessionNumber?: number;
  checkIn?: string;
  checkOut?: string;
  minutes?: number;
  hours?: string;
  isOpen?: boolean;
  hasCheckInSelfie?: boolean;
  hasCheckOutSelfie?: boolean;
  checkInSelfieUrl?: string | null;
  checkOutSelfieUrl?: string | null;
  checkInLocation?: AttendanceGeoLocation | null;
  checkOutLocation?: AttendanceGeoLocation | null;
};

export type AttendanceDayEntry = {
  status?: string;
  checkIn?: string;
  checkOut?: string;
  hours?: string | number;
  workedMinutes?: number;
  sessionCount?: number;
  sessions?: AttendanceSession[];
  leaveType?: string;
  leaveLabel?: string;
  notes?: string;
  locationIn?: string;
  locationOut?: string;
  date?: string;
  recordId?: string;
};

export type AttendanceMonthResponse = {
  year: number;
  month: number;
  stats?: AttendanceMonthStats;
  calendar?: Record<string, string>;
  holidays?: Record<string, { name?: string } | null>;
  weekOffs?: Record<string, { dayName?: string } | null>;
  dayRecords?: Record<string, AttendanceDayEntry[]>;
};

export const getMonthlyAttendance = async (
  year: number,
  month: number,
  employeeId: string,
): Promise<AttendanceMonthResponse> => {
  return api.get<AttendanceMonthResponse>("/attendance/month", {
    params: { year, month, target: "org", employeeId },
  });
};
