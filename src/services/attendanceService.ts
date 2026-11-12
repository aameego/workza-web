import { api, type ApiBlobResult } from "../lib/apiClient";

export type AttendanceMonthStats = {
  Present?: number;
  Absent?: number;
  "Half Day"?: number;
  Late?: number;
  Leave?: number;
  WFH?: number;
  "Not Marked"?: number;
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
  reason?: string;
  locationIn?: string;
  locationOut?: string;
  date?: string;
  recordId?: string;
  employeeId?: string | { _id?: string; name?: string; employeeCode?: string };
  name?: string;
  employeeCode?: string;
  employeeName?: string;
  isCheckedIn?: boolean;
};

export type AttendanceMonthResponse = {
  year: number;
  month: number;
  target?: string;
  stats?: AttendanceMonthStats;
  calendar?: Record<string, string>;
  holidays?: Record<string, { name?: string } | null>;
  weekOffs?: Record<string, { dayName?: string } | null>;
  dayRecords?: Record<string, AttendanceDayEntry[]>;
};

export type AttendanceListParams = {
  target?: "self" | "team" | "org" | string;
  filterType?: string;
  search?: string;
  startDate?: string;
  endDate?: string;
  year?: number;
  month?: number;
  page?: number;
  limit?: number;
  departmentId?: string;
  employeeStatus?: string;
};

export type AttendanceListResponse = {
  filterType?: string;
  month?: number;
  year?: number;
  target?: string;
  stats?: AttendanceMonthStats;
  rows?: AttendanceDayEntry[];
  hasTeam?: boolean;
  teamCount?: number;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
};

export type AttendanceTarget = "self" | "team" | "org";

export type GetMonthlyAttendanceOptions = {
  target?: AttendanceTarget;
  employeeId?: string;
};

/** Monthly calendar + day records. Used by employee detail and Attendance module. */
export const getMonthlyAttendance = async (
  year: number,
  month: number,
  options: GetMonthlyAttendanceOptions | string = {},
): Promise<AttendanceMonthResponse> => {
  const opts: GetMonthlyAttendanceOptions =
    typeof options === "string" ? { target: "org", employeeId: options } : options;
  return api.get<AttendanceMonthResponse>("/attendance/month", {
    params: {
      year,
      month,
      target: opts.target || (opts.employeeId ? "org" : "self"),
      ...(opts.employeeId ? { employeeId: opts.employeeId } : {}),
    },
  });
};

export const getAttendanceList = async (
  params: AttendanceListParams,
): Promise<AttendanceListResponse> => {
  return api.get<AttendanceListResponse>("/attendance/list", { params });
};

export const downloadAttendanceReport = async (
  params: AttendanceListParams,
): Promise<ApiBlobResult> => {
  return api.get<ApiBlobResult>("/attendance/download", {
    params,
    responseType: "blob",
  });
};

export const markAttendance = async (
  payload: Record<string, unknown>,
): Promise<unknown> => {
  return api.post("/attendance/mark", { json: payload });
};

export type MonthlyUploadTemplateParams = {
  month: number;
  year: number;
};

export type BulkMonthAttendanceResult = {
  message?: string;
  totalRows?: number;
  uploaded?: number;
  failed?: number;
  skipped?: number;
  errors?: Array<string | { message?: string }>;
};

export const downloadMonthlyUploadTemplate = async (
  params: MonthlyUploadTemplateParams,
): Promise<ApiBlobResult> => {
  return api.get<ApiBlobResult>("/attendance/markMonth/bulk-upload/template", {
    params: { month: params.month, year: params.year },
    responseType: "blob",
  });
};

export const bulkUploadMonthAttendance = async (
  file: File,
): Promise<BulkMonthAttendanceResult> => {
  const formData = new FormData();
  formData.append("file", file);
  return api.post<BulkMonthAttendanceResult>(
    "/attendance/markMonth/bulk-upload",
    { body: formData },
  );
};

export type DirectEditAttendancePayload = {
  employeeId: string;
  date: string;
  status: string;
  checkIn: string | null;
  checkOut: string | null;
  auditNote: string;
};

export const directEditAttendance = async (
  payload: DirectEditAttendancePayload,
): Promise<unknown> => {
  return api.post("/regularization/direct/attendance", { json: payload });
};

export type MarkMonthAttendancePayload = {
  employeeId: string;
  month: string;
  year: number;
  totalWorkingDays: number | string;
  incentiveDays?: number | string;
  notes?: string;
};

export type MarkMonthAttendanceResult = {
  message?: string;
  record?: unknown;
  dailyPresentCount?: number;
};

export const markMonthAttendance = async (
  payload: MarkMonthAttendancePayload,
): Promise<MarkMonthAttendanceResult> => {
  return api.post<MarkMonthAttendanceResult>("/attendance/markMonth", {
    json: payload,
  });
};

export type MonthlyReportParams = {
  reportMonth: string;
  reportYear: number;
};

/** Prefer correctly spelled path; backend also keeps the historical typo route. */
export const downloadMonthlyAttendanceReport = async (
  params: MonthlyReportParams,
): Promise<ApiBlobResult> => {
  return api.get<ApiBlobResult>("/attendance/download-monthly-report", {
    params: {
      reportMonth: params.reportMonth,
      reportYear: params.reportYear,
    },
    responseType: "blob",
  });
};

export const checkInAttendance = async (
  selfieFile: Blob,
  options: {
    notes?: string;
    latitude: number;
    longitude: number;
    accuracy?: number | null;
  },
): Promise<unknown> => {
  const formData = new FormData();
  formData.append("selfie", selfieFile, "selfie.jpg");
  formData.append("latitude", String(options.latitude));
  formData.append("longitude", String(options.longitude));
  if (options.notes) formData.append("notes", options.notes);
  if (options.accuracy != null && Number.isFinite(Number(options.accuracy))) {
    formData.append("accuracy", String(options.accuracy));
  }
  return api.post("/attendance/check-in", { body: formData });
};

export const checkOutAttendance = async (
  selfieFile: Blob,
  location: { latitude: number; longitude: number; accuracy?: number | null },
): Promise<unknown> => {
  const formData = new FormData();
  formData.append("selfie", selfieFile, "selfie.jpg");
  formData.append("latitude", String(location.latitude));
  formData.append("longitude", String(location.longitude));
  if (location.accuracy != null) {
    formData.append("accuracy", String(location.accuracy));
  }
  return api.post("/attendance/check-out", { body: formData });
};

export const formatWorkedHours = (minutes: number | null | undefined): string => {
  if (minutes === null || minutes === undefined) return "—";
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h}h ${String(m).padStart(2, "0")}m`;
};

export const toLocalDateString = (date = new Date()): string =>
  new Intl.DateTimeFormat("en-CA", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);

/** Convert HTML time input (HH:mm) to API 12-hour string (hh:mm AM/PM). */
export const formatTimeForApi = (time24: string): string => {
  const raw = String(time24 || "").trim();
  if (!raw) return "";
  const [hourStr, minuteStr = "00"] = raw.split(":");
  let hours = Number(hourStr);
  if (!Number.isFinite(hours)) return raw;
  const meridiem = hours >= 12 ? "PM" : "AM";
  hours = hours % 12 || 12;
  return `${String(hours).padStart(2, "0")}:${minuteStr.slice(0, 2)} ${meridiem}`;
};

export const buildTodayRowFromAttendanceResponse = (
  response: {
    sessions?: AttendanceSession[];
    checkIn?: string;
    checkOut?: string;
    hours?: string;
    status?: string;
    isCheckedIn?: boolean;
    sessionNumber?: number;
    record?: { _id?: string };
    recordId?: string | null;
  },
  user: {
    name?: string;
    employeeCode?: string;
    employeeId?: string;
  } | null,
): AttendanceDayEntry & {
  id: string;
  initials: string;
  isCheckedIn: boolean;
} => {
  const sessions = response.sessions || [];
  const openSession = sessions.find((s) => s.isOpen);
  const totalMinutes = sessions.reduce((sum, s) => sum + (s.minutes || 0), 0);
  const name = user?.name || "You";
  const initials = name
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return {
    id: user?.employeeCode || user?.employeeId || "—",
    employeeId: user?.employeeId,
    recordId: response.record?._id || response.recordId || undefined,
    name,
    initials,
    checkIn: response.checkIn || sessions[0]?.checkIn || "—",
    checkOut: response.checkOut || (openSession ? "—" : sessions.at(-1)?.checkOut || "—"),
    hours: response.hours || formatWorkedHours(totalMinutes),
    status: response.status || "Present",
    isCheckedIn: response.isCheckedIn ?? Boolean(openSession),
    sessionCount: response.sessionNumber || sessions.length,
    sessions,
  };
};

export type AttendanceRegularization = {
  _id: string;
  employeeId?: string | { _id?: string };
  status?: string;
  reason?: string;
  requested?: { date?: string; status?: string; checkIn?: string | null; checkOut?: string | null };
  previous?: { status?: string; checkIn?: string | null; checkOut?: string | null } | null;
  approverId?: { name?: string; email?: string } | null;
  decidedAt?: string | null;
  createdAt?: string;
};

/**
 * Approved attendance corrections, newest first — the source for the
 * Attendance History timeline.
 * ponytail: backend has no employee/date filter, so callers filter the latest
 * 100; add employeeId+date params to /regularization/requests if that cuts off.
 */
export const getAttendanceRegularizations = async (): Promise<AttendanceRegularization[]> => {
  const res = await api.get<{ requests?: AttendanceRegularization[] }>(
    "/regularization/requests",
    { params: { kind: "attendance", status: "Approved", limit: 100 } },
  );
  return res.requests || [];
};
