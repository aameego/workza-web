import type {
  AttendanceDayEntry,
  AttendanceMonthResponse,
} from "../../services/attendanceService";

export const WEEKDAYS = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"] as const;

export type CalendarCell =
  | { key: string; empty: true }
  | {
      key: string;
      empty?: false;
      day: number;
      status: string;
      holidayName?: string | null;
      weekOff?: boolean;
      label?: string | null;
      isToday: boolean;
      entries: AttendanceDayEntry[];
      hasSessions: boolean;
    };

export const monthLabel = (year: number, month: number): string =>
  new Date(year, month - 1, 1).toLocaleString("en-US", {
    month: "long",
    year: "numeric",
  });

export const buildCalendarCells = (
  year: number,
  month: number,
  data: AttendanceMonthResponse | null | undefined,
): CalendarCell[] => {
  const firstDay = new Date(year, month - 1, 1).getDay();
  const daysInMonth = new Date(year, month, 0).getDate();
  const today = new Date();
  const cells: CalendarCell[] = [];
  const calendar = data?.calendar || {};
  const holidays = data?.holidays || {};
  const weekOffs = data?.weekOffs || {};
  const dayRecords = data?.dayRecords || {};

  for (let i = 0; i < firstDay; i += 1) {
    cells.push({ key: `empty-${i}`, empty: true });
  }

  for (let day = 1; day <= daysInMonth; day += 1) {
    const key = String(day);
    const status = calendar[day] || calendar[key] || "neutral";
    const holiday = holidays[day] || holidays[key];
    const weekOff = !holiday && Boolean(weekOffs[day] || weekOffs[key]);
    const entries = dayRecords[day] || dayRecords[key] || [];
    const leave = entries.find((e) => e.status === "Leave");
    const wfh = entries.find((e) => e.status === "WFH");
    const primary = entries[0];

    let label: string | null = null;
    if (holiday?.name) label = holiday.name;
    else if (weekOff) label = "Week Off";
    else if (leave) label = leave.leaveLabel || leave.leaveType || "Leave";
    else if (wfh) label = "WFH";
    else if (primary?.status === "Present") label = "Present";
    else if (primary?.status === "Absent") label = "Absent";
    else if (primary?.status === "Late") label = "Late";
    else if (primary?.status === "Half Day") label = "Half Day";
    else if (typeof status === "string" && status !== "neutral" && status !== "week-off" && status !== "holiday") {
      label = status;
    }

    cells.push({
      key: `day-${day}`,
      day,
      status: String(status),
      holidayName: holiday?.name || null,
      weekOff,
      label,
      entries,
      hasSessions: entries.some(
        (e) => (e.sessions?.length || 0) > 0 || (e.sessionCount || 0) > 0,
      ),
      isToday:
        year === today.getFullYear() &&
        month === today.getMonth() + 1 &&
        day === today.getDate(),
    });
  }

  return cells;
};

export const entriesForDay = (
  data: AttendanceMonthResponse | null | undefined,
  day: number,
): AttendanceDayEntry[] => {
  const dayRecords = data?.dayRecords || {};
  return dayRecords[day] || dayRecords[String(day)] || [];
};

export const flattenDayRecords = (
  data: AttendanceMonthResponse | null | undefined,
): Array<AttendanceDayEntry & { day: number }> => {
  const dayRecords = data?.dayRecords || {};
  const rows: Array<AttendanceDayEntry & { day: number }> = [];
  Object.entries(dayRecords).forEach(([dayKey, entries]) => {
    const day = Number(dayKey);
    (entries || []).forEach((entry) => {
      rows.push({ ...entry, day });
    });
  });
  return rows.sort((a, b) => a.day - b.day);
};

export const kpiFromStats = (stats?: AttendanceMonthResponse["stats"]) => [
  { label: "Present (Days)", value: stats?.Present ?? 0 },
  { label: "Absent (Days)", value: stats?.Absent ?? 0 },
  { label: "Leave (Days)", value: stats?.Leave ?? 0 },
  { label: "Half Day (Days)", value: stats?.["Half Day"] ?? 0 },
  { label: "WFH (Days)", value: stats?.WFH ?? 0 },
  { label: "Late (Days)", value: stats?.Late ?? 0 },
];
