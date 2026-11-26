import type {
  RegularizationConfig,
  RegularizationRequest,
  RegularizationValues,
} from "../../services/regularizationService";
import { getLeaveTypeLabel } from "../leave/leaveViewModel";

export type RegTab = "all" | "pending" | "approved" | "direct" | "config";

/** "08 Sep 2026" in org time (Figma table date style). */
export const formatRegDate = (value?: string | null): string => {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-GB", {
    timeZone: "Asia/Kolkata",
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

/** Backend stores "HH:mm" or an ISO timestamp; both become "HH:mm". */
export const formatRegTime = (value?: string | null): string => {
  if (!value) return "—";
  if (/^\d{1,2}:\d{2}$/.test(value)) return value.padStart(5, "0");
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleTimeString("en-GB", {
    timeZone: "Asia/Kolkata",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
};

const minutesOf = (hhmm: string): number | null => {
  const m = /^(\d{2}):(\d{2})$/.exec(hhmm);
  return m ? Number(m[1]) * 60 + Number(m[2]) : null;
};

/** "Total 6h 00m", or "" when either time is missing or out of order. */
export const totalWorked = (checkIn?: string | null, checkOut?: string | null): string => {
  const a = minutesOf(formatRegTime(checkIn));
  const b = minutesOf(formatRegTime(checkOut));
  if (a === null || b === null || b < a) return "";
  const mins = b - a;
  return `Total ${Math.floor(mins / 60)}h ${String(mins % 60).padStart(2, "0")}m`;
};

export const regEmployee = (row: RegularizationRequest): { name: string; code: string } => {
  const emp = row.employeeId && typeof row.employeeId === "object" ? row.employeeId : null;
  return { name: emp?.name || "Employee", code: emp?.employeeCode || "" };
};

export const regEmployeeLabel = (row: RegularizationRequest): string => {
  const { name, code } = regEmployee(row);
  return code ? `${name} · ${code}` : name;
};

export const regKindLabel = (row: RegularizationRequest): string =>
  row.kind === "leave" ? "Leave" : "Attendance";

/** The day the correction is about. */
export const regDate = (row: RegularizationRequest): string =>
  formatRegDate(row.kind === "leave" ? row.requested?.startDate : row.requested?.date);

const attendanceText = (v: RegularizationValues | null | undefined): string[] => {
  if (!v) return ["No record · — / —"];
  const status = v.status || "No record";
  if (!v.checkIn && !v.checkOut) return [status];
  const total = totalWorked(v.checkIn, v.checkOut);
  return [`${status} · ${formatRegTime(v.checkIn)} / ${formatRegTime(v.checkOut)}`, ...(total ? [total] : [])];
};

/** Lines for the "Recorded" column: what the record said before the request. */
export const recordedLines = (row: RegularizationRequest): string[] => {
  if (row.kind === "attendance") return attendanceText(row.previous);
  return row.previous?.leaveType ? [getLeaveTypeLabel(row.previous.leaveType)] : ["No record"];
};

/** Lines for the "Requested correction" column. */
export const requestedLines = (row: RegularizationRequest): string[] => {
  if (row.kind === "attendance") return attendanceText(row.requested);
  const v = row.requested;
  if (v?.leaveType === "Present") return attendanceText({ ...v, status: "Present" });
  return v?.leaveType ? [`${getLeaveTypeLabel(v.leaveType)} correction`] : ["Leave correction"];
};

export const reviewerText = (row: RegularizationRequest): string => {
  if (row.status === "Pending") return "Awaiting review";
  const name = row.approverId?.name || "—";
  return row.decidedAt ? `${name} · ${formatRegDate(row.decidedAt)}` : name;
};

export const isApprovedThisMonth = (row: RegularizationRequest, now = new Date()): boolean => {
  if (row.status !== "Approved" || !row.decidedAt) return false;
  const d = new Date(row.decidedAt);
  return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
};

export const filterRegRequests = (
  rows: RegularizationRequest[],
  { kind, search }: { kind: string; search: string },
): RegularizationRequest[] => {
  const q = search.trim().toLowerCase();
  return rows.filter((row) => {
    if (kind && row.kind !== kind) return false;
    if (!q) return true;
    const { name, code } = regEmployee(row);
    return name.toLowerCase().includes(q) || code.toLowerCase().includes(q);
  });
};

export const daysInMonth = (now = new Date()): number =>
  new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();

export type ConfigDraft = {
  monthlyLimit: string;
  monthlyLeaveLimit: string;
  attendanceWindowDays: string;
  leaveWindowDays: string;
};

export const draftFromConfig = (c?: RegularizationConfig | null): ConfigDraft => ({
  monthlyLimit: c?.monthlyLimit == null ? "" : String(c.monthlyLimit),
  monthlyLeaveLimit: c?.monthlyLeaveLimit == null ? "" : String(c.monthlyLeaveLimit),
  attendanceWindowDays: c?.attendanceWindowDays == null ? "" : String(c.attendanceWindowDays),
  leaveWindowDays: c?.leaveWindowDays == null ? "" : String(c.leaveWindowDays),
});

const isIntIn = (raw: string, min: number, max: number) => {
  const n = Number(raw);
  return /^\d+$/.test(raw.trim()) && n >= min && n <= max;
};

/** Same rules as the backend: limit blank or 1..days-in-month, window required 1..365. */
export const validateConfigDraft = (draft: ConfigDraft, now = new Date()): Partial<ConfigDraft> => {
  const maxLimit = daysInMonth(now);
  const errors: Partial<ConfigDraft> = {};
  for (const key of ["monthlyLimit", "monthlyLeaveLimit"] as const) {
    if (draft[key].trim() && !isIntIn(draft[key], 1, maxLimit)) {
      errors[key] = `Enter a whole number from 1 to ${maxLimit}, or leave blank.`;
    }
  }
  for (const key of ["attendanceWindowDays", "leaveWindowDays"] as const) {
    if (!isIntIn(draft[key], 1, 365)) errors[key] = "Enter a whole number of days from 1 to 365.";
  }
  return errors;
};

export const configFromDraft = (draft: ConfigDraft): RegularizationConfig => {
  const num = (raw: string) => (raw.trim() ? Number(raw) : null);
  return {
    monthlyLimit: num(draft.monthlyLimit),
    monthlyLeaveLimit: num(draft.monthlyLeaveLimit),
    attendanceWindowDays: num(draft.attendanceWindowDays),
    leaveWindowDays: num(draft.leaveWindowDays),
  };
};

/** "2 / mo · 30d window" chip on each config card. */
export const limitSummary = (limit: string, windowDays: string): string =>
  `${limit.trim() ? `${limit} / mo` : "Unlimited"} · ${windowDays.trim() ? `${windowDays}d window` : "No window"}`;
