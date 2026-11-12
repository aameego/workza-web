import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Eye } from "lucide-react";
import { Badge, cn, type BadgeStatus } from "../../design-system";
import { useAttendanceList } from "../../hooks/useAttendance";
import { avatarTone } from "../../lib/avatarTone";
import {
  buildAttendanceListParams,
  normalizeAttendanceRow,
  type NormalizedAttendanceRow,
} from "./attendanceViewModel";

export type AttendanceReporteesPanelProps = {
  onView: (row: NormalizedAttendanceRow) => void;
  onViewAll: () => void;
};

const PAGE = 10;

const STATUS: Record<string, [BadgeStatus, string]> = {
  Present: ["success", "Present"],
  Absent: ["error", "Absent"],
  Leave: ["info", "Leave"],
  Late: ["warning", "Late"],
  "Half Day": ["blue", "Half Day"],
  WFH: ["blue", "WFH"],
  "Not Marked": ["extra", "Yet to Check In"],
};

/** Figma "My Reportees Attendance" (1:18381): today's status for direct reports, two columns of five. */
export default function AttendanceReporteesPanel({ onView, onViewAll }: AttendanceReporteesPanelProps) {
  const [today] = useState(() => new Date());
  const [page, setPage] = useState(1);
  const params = useMemo(
    () =>
      buildAttendanceListParams({
        target: "team",
        year: today.getFullYear(),
        month: today.getMonth() + 1,
        selectedDay: today.getDate(),
        page,
        limit: PAGE,
      }),
    [today, page],
  );
  const query = useAttendanceList(params, true);
  const rows = useMemo(() => (query.data?.rows || []).map(normalizeAttendanceRow), [query.data?.rows]);
  const total = query.data?.pagination?.total ?? rows.length;
  const pages = Math.max(1, query.data?.pagination?.pages ?? Math.ceil(total / PAGE));
  const from = total ? (page - 1) * PAGE + 1 : 0;
  const cols = [rows.slice(0, 5), rows.slice(5, 10)];

  const arrow =
    "inline-flex size-6 cursor-pointer items-center justify-center rounded-wz-sm border border-wz-border bg-white p-0 text-wz-heading disabled:cursor-not-allowed disabled:opacity-40";

  return (
    <section className="rounded-wz-xl border border-wz-border bg-white px-4 pt-4 pb-4">
      <div className="flex min-h-[41px] items-start justify-between gap-4 border-b border-wz-border pb-3">
        <h2 className="m-0 text-[15px] leading-5 font-bold text-wz-heading">My Reportees Attendance</h2>
        <button
          type="button"
          className="cursor-pointer border-0 bg-transparent p-0 text-xs leading-4 font-semibold text-wz-primary"
          onClick={onViewAll}
        >
          View All Attendance →
        </button>
      </div>

      {query.isLoading ? (
        <p className="m-0 py-6 text-center text-sm text-wz-text-muted">Loading…</p>
      ) : rows.length === 0 ? (
        <p className="m-0 py-6 text-center text-sm text-wz-text-muted">No reportees found.</p>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2">
          {cols.map((col, ci) =>
            col.length ? (
              <ul
                key={ci}
                className={cn(
                  "m-0 flex list-none flex-col p-0",
                  ci === 1 && "lg:border-l lg:border-wz-border lg:pl-6",
                  ci === 0 && "lg:pr-6",
                )}
              >
                {col.map((row) => {
                  const [tone, label] = STATUS[row.status || "Not Marked"] || ["neutral", row.status || "-"];
                  return (
                    <li key={row.rowKey} className="flex items-center gap-4 border-b border-[#f1f3f5] py-[9px] last:border-b-0">
                      <span
                        className={cn(
                          "inline-flex size-[26px] shrink-0 items-center justify-center rounded-wz-md text-[10px] font-bold text-white",
                          avatarTone(row.id || row.name),
                        )}
                      >
                        {row.initials}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="m-0 truncate text-[11px] leading-[14px] font-bold text-wz-heading">{row.name || "-"}</p>
                        <p className="m-0 truncate text-[9px] leading-3 text-wz-text-muted">{row.employeeCode || "-"}</p>
                      </div>
                      <Badge status={tone} size="sm">
                        {label}
                      </Badge>
                      <button
                        type="button"
                        aria-label={`View ${row.name} attendance history`}
                        className="inline-flex size-5 cursor-pointer items-center justify-center border-0 bg-transparent p-0 text-wz-heading"
                        onClick={() => onView(row)}
                      >
                        <Eye size={13} aria-hidden />
                      </button>
                    </li>
                  );
                })}
              </ul>
            ) : null,
          )}
        </div>
      )}

      <div className="flex items-center justify-between gap-4 border-t border-wz-border pt-3">
        <span className="text-[11px] leading-[14px] font-semibold text-wz-heading">
          Showing {from}–{Math.min(page * PAGE, total)} of {total} employees
        </span>
        <div className="flex gap-2">
          <button type="button" aria-label="Previous page" className={arrow} disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
            <ChevronLeft size={12} />
          </button>
          <button type="button" aria-label="Next page" className={arrow} disabled={page >= pages} onClick={() => setPage((p) => p + 1)}>
            <ChevronRight size={12} />
          </button>
        </div>
      </div>
    </section>
  );
}
