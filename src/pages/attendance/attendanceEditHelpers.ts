export const ATTENDANCE_STATUSES = [
  "Present",
  "Absent",
  "Half Day",
  "Late",
  "Leave",
  "WFH",
] as const;

export const WORKED_STATUSES = new Set(["Present", "Late", "Half Day", "WFH"]);

export const toDateInputValue = (
  value: string | Date | null | undefined,
  timeZone = "Asia/Kolkata",
): string => {
  if (!value) return "";
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  try {
    return new Intl.DateTimeFormat("en-CA", {
      timeZone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(date);
  } catch {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }
};

export const toTimeInputValue = (value: string | null | undefined): string => {
  if (!value || value === "—" || value === "-") return "";
  const raw = String(value).trim();
  if (/^\d{1,2}:\d{2}$/.test(raw)) {
    const [h, m] = raw.split(":");
    return `${String(h).padStart(2, "0")}:${m}`;
  }
  const match = raw.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?$/i);
  if (!match) return "";
  let hours = Number(match[1]);
  const minutes = match[2]!;
  const meridiem = match[3]?.toUpperCase();
  if (meridiem === "PM" && hours < 12) hours += 12;
  if (meridiem === "AM" && hours === 12) hours = 0;
  return `${String(hours).padStart(2, "0")}:${minutes}`;
};

export const employeeIdFromRow = (row: {
  employeeId?: string | { _id?: string } | null;
} | null): string => {
  if (!row) return "";
  if (typeof row.employeeId === "object" && row.employeeId?._id) {
    return String(row.employeeId._id);
  }
  if (row.employeeId) return String(row.employeeId);
  return "";
};

export const stripsTimesForStatus = (status: string): boolean =>
  status === "Absent" || status === "Leave";

export const validateDirectEditAttendance = (input: {
  employeeId: string;
  date: string;
  status: string;
  checkIn: string;
  checkOut: string;
  auditNote: string;
}): string => {
  if (!input.employeeId || !input.date) {
    return "Attendance record is missing employee or date.";
  }
  if (!input.auditNote.trim() || input.auditNote.trim().length < 3) {
    return "Please enter an audit note (at least 3 characters).";
  }
  if (WORKED_STATUSES.has(input.status)) {
    if (!input.checkIn || !input.checkOut) {
      return "Check-in and check-out times are required for this status.";
    }
    if (input.checkOut < input.checkIn) {
      return "Check-out must be on or after check-in.";
    }
  }
  return "";
};

export const isExcelAttendanceUploadFile = (file: File): boolean =>
  /\.(xlsx|xls)$/i.test(file.name);

export const MAX_ATTENDANCE_UPLOAD_BYTES = 5 * 1024 * 1024;

export const validateAttendanceUploadFile = (
  file: File | null,
): string | null => {
  if (!file) return "Please select an Excel (.xlsx or .xls) file.";
  if (!isExcelAttendanceUploadFile(file)) {
    return "Invalid file type. Please upload an .xlsx or .xls file.";
  }
  if (file.size > MAX_ATTENDANCE_UPLOAD_BYTES) {
    return "File size exceeds the 5 MB limit.";
  }
  return null;
};

export const formatBulkMonthUploadResult = (result: {
  message?: string;
  totalRows?: number;
  uploaded?: number;
  failed?: number;
  skipped?: number;
  errors?: Array<string | { message?: string }>;
}): string => {
  const lines: string[] = [];
  if (result.message) lines.push(result.message);
  const parts = [
    result.uploaded != null ? `Uploaded: ${result.uploaded}` : null,
    result.failed != null ? `Failed: ${result.failed}` : null,
    result.skipped != null ? `Skipped: ${result.skipped}` : null,
    result.totalRows != null ? `Total rows: ${result.totalRows}` : null,
  ].filter(Boolean);
  if (parts.length) lines.push(parts.join(" · "));
  const errors = (result.errors || [])
    .map((e) => (typeof e === "string" ? e : e?.message || ""))
    .filter(Boolean);
  if (errors.length) {
    lines.push(`Errors:\n${errors.slice(0, 10).join("\n")}`);
    if (errors.length > 10) {
      lines.push(`…and ${errors.length - 10} more`);
    }
  }
  return lines.join("\n") || "Upload completed.";
};
