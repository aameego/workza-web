import type { AttendanceRegularization } from "../../services/attendanceService";

export type HistoryEvent = {
  key: string;
  title: string;
  kind: "change" | "marked";
  previous?: string;
  updated?: string;
  checkIn?: string;
  checkOut?: string;
  by?: string;
  at?: string;
  reason?: string;
};

/** "09:30" / ISO date → "09:30 AM"; empty → "-". */
export const formatHistoryTime = (value?: string | null): string => {
  if (!value || /^[-—]$/.test(value.trim())) return "-";
  const ampm = /^(\d{1,2}):(\d{2})\s*([AP]M)$/i.exec(value.trim());
  if (ampm) return `${ampm[1]!.padStart(2, "0")}:${ampm[2]} ${ampm[3]!.toUpperCase()}`;
  const hm = /^(\d{1,2}):(\d{2})/.exec(value);
  let h: number;
  let m: number;
  if (hm && !value.includes("T")) {
    h = Number(hm[1]);
    m = Number(hm[2]);
  } else {
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return value;
    h = d.getHours();
    m = d.getMinutes();
  }
  const suffix = h >= 12 ? "PM" : "AM";
  return `${String(h % 12 || 12).padStart(2, "0")}:${String(m).padStart(2, "0")} ${suffix}`;
};

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** Date → "28 Sep 2026" (Figma; en-GB would print "Sept"). */
export const formatDayLabel = (d: Date): string =>
  Number.isNaN(d.getTime())
    ? "-"
    : `${String(d.getDate()).padStart(2, "0")} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;

export const formatHistoryStamp = (value?: string | null): string => {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return `${formatDayLabel(d)}, ${formatHistoryTime(d.toISOString())}`;
};

/** Local calendar day: stored dates are local midnight in UTC (IST → 18:30Z the day before). */
const localDay = (v?: string) => {
  if (!v) return "";
  if (!v.includes("T")) return v.slice(0, 10);
  const d = new Date(v);
  return Number.isNaN(d.getTime())
    ? ""
    : `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};
const sameDay = (a?: string, b?: string) => Boolean(a && b) && localDay(a) === localDay(b);

const idOf = (e: AttendanceRegularization["employeeId"]) =>
  typeof e === "object" ? e?._id : e;

/**
 * Newest-first timeline for one employee-day: one event per approved
 * correction (status change wins, then check-out, then check-in), ending with
 * the original "Attendance Marked!" from the oldest snapshot (or the row).
 */
export const buildHistoryEvents = (
  requests: AttendanceRegularization[],
  employeeId: string,
  date: string,
  current: { checkIn?: string | null; checkOut?: string | null; name?: string },
): HistoryEvent[] => {
  const mine = requests
    .filter((r) => idOf(r.employeeId) === employeeId && sameDay(r.requested?.date, date))
    .sort((a, b) => String(b.decidedAt || b.createdAt).localeCompare(String(a.decidedAt || a.createdAt)));

  const events: HistoryEvent[] = mine.map((r) => {
    const prev = r.previous || {};
    const next = r.requested || {};
    const base = {
      key: r._id,
      kind: "change" as const,
      by: r.approverId?.name || "-",
      at: formatHistoryStamp(r.decidedAt || r.createdAt),
      reason: r.reason,
    };
    if (next.status && next.status !== prev.status) {
      return { ...base, title: "Attendance Updated!", previous: prev.status || "-", updated: next.status };
    }
    if (formatHistoryTime(next.checkOut) !== formatHistoryTime(prev.checkOut)) {
      return {
        ...base,
        title: "Check-out time updated!",
        previous: formatHistoryTime(prev.checkOut),
        updated: formatHistoryTime(next.checkOut),
      };
    }
    return {
      ...base,
      title: "Check-in time updated!",
      previous: formatHistoryTime(prev.checkIn),
      updated: formatHistoryTime(next.checkIn),
    };
  });

  const original = mine.length ? mine[mine.length - 1]!.previous : current;
  if (formatHistoryTime(original?.checkIn) !== "-") {
    events.push({
      key: "marked",
      kind: "marked",
      title: "Attendance Marked!",
      checkIn: formatHistoryTime(original?.checkIn),
      checkOut: formatHistoryTime(original?.checkOut),
      by: current.name,
    });
  }
  return events;
};

/** Figma hours format "09 hr 53 m" from the API's "9h 53m" (or decimal hours); "-" when empty. */
export const formatHours = (value?: string | number | null): string => {
  if (value == null || value === "" || value === "-" || value === "—") return "-";
  const pad = (n: number) => String(n).padStart(2, "0");
  if (typeof value === "number") {
    const mins = Math.round(value * 60);
    return `${pad(Math.floor(mins / 60))} hr ${pad(mins % 60)} m`;
  }
  const m = /(\d+)\s*h\D*(\d+)?/i.exec(value);
  if (!m) return value;
  return `${pad(Number(m[1]))} hr ${pad(Number(m[2] || 0))} m`;
};
