import type {
  AttendanceDayEntry,
  AttendanceListParams,
  AttendanceMonthResponse,
  AttendanceMonthStats,
} from "../../services/attendanceService";
import {
  leadingOutsideCells,
  trailingOutsideCells,
  type OutsideCell,
} from "../employees/attendanceCalendar";

export const ATTENDANCE_STATUS_COLORS: Record<
  string,
  { bg: string; text: string; dot: string }
> = {
  Present: { bg: "bg-[#ecfdf3]", text: "text-[#027a48]", dot: "bg-[#12b76a]" },
  Absent: { bg: "bg-[#fef3f2]", text: "text-[#b42318]", dot: "bg-[#f04438]" },
  Late: { bg: "bg-[#fffaeb]", text: "text-[#b54708]", dot: "bg-[#f79009]" },
  "Half Day": {
    bg: "bg-[#eff8ff]",
    text: "text-[#175cd3]",
    dot: "bg-[#2e90fa]",
  },
  Leave: { bg: "bg-[#f4f3ff]", text: "text-[#5925dc]", dot: "bg-[#7a5af8]" },
  WFH: { bg: "bg-[#fef6ee]", text: "text-[#b54708]", dot: "bg-[#f79009]" },
  "Not Marked": {
    bg: "bg-wz-neutral-100",
    text: "text-wz-text-secondary",
    dot: "bg-wz-neutral-400",
  },
  Holiday: { bg: "bg-[#f4f3ff]", text: "text-[#5925dc]", dot: "bg-[#9b8afb]" },
  "Week Off": {
    bg: "bg-wz-neutral-100",
    text: "text-wz-text-secondary",
    dot: "bg-wz-neutral-400",
  },
};

export type OrgMetricHintTone =
  | "green"
  | "red"
  | "amber"
  | "blue"
  | "purple";

export type OrgMetricCard = {
  key: string;
  label: string;
  value: number;
  hint: string;
  /** Colored hint pill under the KPI value (Figma attendance-admin). */
  hintTone: OrgMetricHintTone;
  /** @deprecated left-border accent — Figma uses pill hints instead */
  accent?: string;
};

export const EMPTY_STATS: AttendanceMonthStats = {
  Present: 0,
  Absent: 0,
  "Half Day": 0,
  Late: 0,
  Leave: 0,
  WFH: 0,
  "Not Marked": 0,
};

export const orgDayMetrics = (
  stats?: AttendanceMonthStats | null,
  /** Past working day: people with no record count as absent (ATT-FN-04). */
  { notMarkedAsAbsent = false }: { notMarkedAsAbsent?: boolean } = {},
): OrgMetricCard[] => {
  const s = { ...EMPTY_STATS, ...(stats || {}) };
  if (notMarkedAsAbsent) s.Absent = (s.Absent ?? 0) + (s["Not Marked"] ?? 0);
  return [
    {
      key: "Present",
      label: "Present Employees",
      value: s.Present ?? 0,
      hint: "Employees who marked attendance",
      hintTone: "green",
    },
    {
      key: "Absent",
      label: "Absent Employees",
      value: s.Absent ?? 0,
      hint: "Employees who missed attendance",
      hintTone: "red",
    },
    {
      key: "Late",
      label: "Late Employees",
      value: s.Late ?? 0,
      hint: "Employees who arrived late",
      hintTone: "amber",
    },
    {
      key: "Half Day",
      label: "Half Day Employees",
      value: s["Half Day"] ?? 0,
      hint: "Employees who logged out early",
      hintTone: "blue",
    },
    {
      key: "Leave",
      label: "On Leave Employees",
      value: s.Leave ?? 0,
      hint: "Employees on approved leave",
      hintTone: "purple",
    },
  ];
};

export const selfMonthMetrics = (
  stats?: AttendanceMonthStats | null,
): Array<{ label: string; value: number }> => {
  const s = { ...EMPTY_STATS, ...(stats || {}) };
  return [
    { label: "Present (Days)", value: s.Present ?? 0 },
    { label: "Absent (Days)", value: s.Absent ?? 0 },
    { label: "Leave (Days)", value: s.Leave ?? 0 },
    { label: "Half Day (Days)", value: s["Half Day"] ?? 0 },
    { label: "WFH (Days)", value: s.WFH ?? 0 },
    { label: "Late (Days)", value: s.Late ?? 0 },
  ];
};

export type NormalizedAttendanceRow = AttendanceDayEntry & {
  id: string;
  employeeCode: string;
  name: string;
  initials: string;
  rowKey: string;
};

export const normalizeAttendanceRow = (
  row: AttendanceDayEntry,
): NormalizedAttendanceRow => {
  const empObj =
    row.employeeId && typeof row.employeeId === "object"
      ? row.employeeId
      : null;
  const rawId = empObj?._id || row.employeeId || row.recordId || "";
  const empCode =
    row.employeeCode ||
    empObj?.employeeCode ||
    (rawId ? String(rawId).slice(-6).toUpperCase() : "—");
  const empName = row.name || row.employeeName || empObj?.name || "Unknown";
  const initials = empName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return {
    ...row,
    id: empCode,
    employeeCode: empCode,
    name: empName,
    initials,
    rowKey: String(row.recordId || `${empCode}-${row.date || ""}-${row.status}`),
  };
};

export const presentCountForDay = (
  data: AttendanceMonthResponse | null | undefined,
  day: number,
): number => {
  const entries = data?.dayRecords?.[day] || data?.dayRecords?.[String(day)] || [];
  // Present only, so the calendar number equals the "Present Employees" card (ATT-FN-05);
  // late arrivals have their own card.
  return entries.filter((e) => e.status === "Present").length;
};

export type OrgCalendarCell =
  | OutsideCell
  | {
      key: string;
      empty?: false;
      day: number;
      status: string;
      holidayName?: string | null;
      weekOff?: boolean;
      presentCount: number;
      isToday: boolean;
      isSelected: boolean;
    };

export const buildOrgCalendarCells = (
  year: number,
  month: number,
  data: AttendanceMonthResponse | null | undefined,
  selectedDay: number | null,
): OrgCalendarCell[] => {
  const daysInMonth = new Date(year, month, 0).getDate();
  const today = new Date();
  const cells: OrgCalendarCell[] = [];
  const calendar = data?.calendar || {};
  const holidays = data?.holidays || {};
  const weekOffs = data?.weekOffs || {};

  cells.push(...leadingOutsideCells(year, month));

  for (let day = 1; day <= daysInMonth; day += 1) {
    const key = String(day);
    const holiday = holidays[day] || holidays[key];
    const weekOff = !holiday && Boolean(weekOffs[day] || weekOffs[key]);
    const status = calendar[day] || calendar[key] || "neutral";
    cells.push({
      key: `day-${day}`,
      day,
      status: String(status),
      holidayName: holiday?.name || null,
      weekOff,
      presentCount: presentCountForDay(data, day),
      isToday:
        year === today.getFullYear() &&
        month === today.getMonth() + 1 &&
        day === today.getDate(),
      isSelected: selectedDay === day,
    });
  }

  cells.push(...trailingOutsideCells(cells.length));
  return cells;
};

export const formatAttendanceDayTitle = (
  year: number,
  month: number,
  day: number | null,
): string => {
  if (day == null) return "Attendance";
  const d = new Date(year, month - 1, day);
  return `Attendance — ${d.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  })}`;
};

export const dateIsoForDay = (
  year: number,
  month: number,
  day: number,
): string =>
  `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

export const EMPLOYEE_STATUS_FILTER_OPTIONS = [
  { value: "", label: "All statuses" },
  { value: "active", label: "Active" },
  { value: "probation", label: "Probation" },
  { value: "full-time", label: "Full-time" },
  { value: "inactive", label: "Inactive" },
  { value: "exited", label: "Exited" },
] as const;

export const buildAttendanceListParams = ({
  target,
  year,
  month,
  selectedDay,
  search = "",
  page = 1,
  limit = 20,
  filterType = "today",
  departmentId = "",
  employeeStatus = "",
  startDate = "",
  endDate = "",
}: {
  target: string;
  year: number;
  month: number;
  selectedDay: number | null;
  search?: string;
  page?: number;
  limit?: number;
  filterType?: string;
  departmentId?: string;
  employeeStatus?: string;
  startDate?: string;
  endDate?: string;
}): AttendanceListParams => {
  const base: AttendanceListParams = {
    target,
    search,
    page,
    limit,
    departmentId: departmentId || undefined,
    employeeStatus: employeeStatus || undefined,
  };

  if (selectedDay != null) {
    const dayStr = dateIsoForDay(year, month, selectedDay);
    return {
      ...base,
      filterType: "custom",
      startDate: dayStr,
      endDate: dayStr,
    };
  }

  if (startDate && endDate) {
    return {
      ...base,
      filterType: "custom",
      startDate,
      endDate,
    };
  }

  return {
    ...base,
    filterType,
    year,
    month,
  };
};

export const CALENDAR_LEGEND = [
  { key: "Present", label: "Present", className: "bg-[#12b76a]" },
  { key: "Absent", label: "Absent", className: "bg-[#f04438]" },
  { key: "Late", label: "Late", className: "bg-[#f79009]" },
  { key: "Half Day", label: "Half Day", className: "bg-[#2e90fa]" },
  { key: "WFH", label: "WFH", className: "bg-[#dc6803]" },
  { key: "Leave", label: "Leave", className: "bg-[#7a5af8]" },
  { key: "Holiday", label: "Holiday", className: "bg-[#9b8afb]" },
  { key: "Week Off", label: "Week Off", className: "bg-wz-neutral-400" },
] as const;

export const filterRowsBySearch = (
  rows: NormalizedAttendanceRow[],
  search: string,
): NormalizedAttendanceRow[] => {
  const q = search.trim().toLowerCase();
  if (!q) return rows;
  return rows.filter(
    (r) =>
      r.name.toLowerCase().includes(q) ||
      r.employeeCode.toLowerCase().includes(q),
  );
};
