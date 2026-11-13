import { Fragment, useState } from "react";
import { ChevronDown, Clock3, Search, SquarePen } from "lucide-react";
import LocationIcons from "./LocationIcons";
import { Badge, Pagination, Select, cn } from "../../design-system";
import { formatHistoryTime, formatHours } from "./attendanceHistory";
import type { BadgeStatus } from "../../design-system";
import { FILTER_TYPE_PRESETS } from "./attendanceMonthOptions";
import {
  EMPLOYEE_STATUS_FILTER_OPTIONS,
  type NormalizedAttendanceRow,
} from "./attendanceViewModel";

/** True when the row's day is before today (local). */
const missedCheckout = (date?: string) => {
  if (!date) return false;
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return false;
  const t = new Date();
  return d < new Date(t.getFullYear(), t.getMonth(), t.getDate());
};

const statusToBadge = (status?: string): BadgeStatus => {
  const s = String(status || "");
  if (s === "Present") return "success";
  if (s === "Absent") return "error";
  if (s === "Late") return "warning";
  if (s === "Leave") return "blue";
  if (s === "Half Day" || s === "WFH") return "info";
  return "neutral";
};

export type DepartmentOption = {
  _id: string;
  name: string;
};

export type AttendanceDayTableProps = {
  title: string;
  subtitle?: string;
  rows: NormalizedAttendanceRow[];
  loading?: boolean;
  search: string;
  onSearchChange: (value: string) => void;
  departmentId?: string;
  onDepartmentChange?: (value: string) => void;
  employeeStatus?: string;
  onEmployeeStatusChange?: (value: string) => void;
  departments?: DepartmentOption[];
  showRosterFilters?: boolean;
  filterType?: string;
  onFilterTypeChange?: (value: string) => void;
  showRangePresets?: boolean;
  canEdit?: boolean;
  /** Per-row edit lock, e.g. HR cannot edit their own record (ATT-FN-09). */
  canEditRow?: (row: NormalizedAttendanceRow) => boolean;
  /** Server pagination (ATT-UI-11). */
  page?: number;
  pages?: number;
  total?: number;
  pageSize?: number;
  onPageChange?: (page: number) => void;
  onEdit?: (row: NormalizedAttendanceRow) => void;
  onHistory?: (row: NormalizedAttendanceRow) => void;
};

export default function AttendanceDayTable({
  title,
  subtitle,
  rows,
  loading,
  search,
  onSearchChange,
  departmentId = "",
  onDepartmentChange,
  employeeStatus = "",
  onEmployeeStatusChange,
  departments = [],
  showRosterFilters = false,
  filterType = "today",
  onFilterTypeChange,
  showRangePresets = false,
  canEdit,
  canEditRow,
  page = 1,
  pages = 1,
  total,
  pageSize = 10,
  onPageChange,
  onEdit,
  onHistory,
}: AttendanceDayTableProps) {
  const [expanded, setExpanded] = useState<string | null>(null);
  const count = total ?? rows.length;
  const from = count === 0 ? 0 : (page - 1) * pageSize + 1;
  return (
    /* Figma attendance-admin table (1:17205): title + subtitle + 300px search on the
       page; table card 16 below with a 54px header and 60px rows. */
    <section className="flex flex-col gap-wz-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="m-0 text-lg leading-[23px] font-bold text-wz-heading">
            {title}
          </h2>
          {subtitle ? (
            <p className="m-0 mt-1 text-xs leading-[15px] text-wz-text-muted">{subtitle}</p>
          ) : null}
          {showRangePresets ? (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {FILTER_TYPE_PRESETS.map((preset) => (
                <button
                  key={preset.value}
                  type="button"
                  className={cn(
                    "inline-flex h-8 cursor-pointer items-center rounded-wz-full border px-3 text-xs font-semibold",
                    filterType === preset.value
                      ? "border-wz-primary bg-wz-hover text-wz-primary"
                      : "border-wz-border bg-white text-wz-text-secondary hover:bg-wz-neutral-50",
                  )}
                  onClick={() => onFilterTypeChange?.(preset.value)}
                >
                  {preset.label}
                </button>
              ))}
            </div>
          ) : null}
        </div>
        <div className="flex flex-wrap items-center justify-end gap-2">
          {showRosterFilters ? (
            <>
              <Select
                value={departmentId}
                onChange={(e) => onDepartmentChange?.(e.target.value)}
                aria-label="Filter by department"
                className="w-full max-w-[180px]"
              >
                <option value="">All departments</option>
                {departments.map((d) => (
                  <option key={d._id} value={d._id}>
                    {d.name}
                  </option>
                ))}
              </Select>
              <Select
                value={employeeStatus}
                onChange={(e) => onEmployeeStatusChange?.(e.target.value)}
                aria-label="Filter by employee status"
                className="w-full max-w-[160px]"
              >
                {EMPLOYEE_STATUS_FILTER_OPTIONS.map((opt) => (
                  <option key={opt.value || "all"} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </Select>
            </>
          ) : null}
          <label className="relative block h-10 w-[300px] max-w-full shrink-0">
            <Search
              size={16}
              className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-[#6c757d]"
              aria-hidden
            />
            <input
              type="search"
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search by employees name or code..."
              className="box-border h-10 w-full rounded-lg border border-[#dee2e6] bg-white py-0 pr-3 pl-9 text-[13px] text-[#0a1f4a] outline-none placeholder:text-[#6c757d] focus:border-[#1f5da3]"
              aria-label="Search attendance rows"
            />
          </label>
        </div>
      </div>

      <div className="overflow-hidden rounded-wz-xl border border-wz-border bg-white">
        <div className="overflow-x-auto">
        <table className="w-full min-w-[960px] border-collapse text-left text-xs leading-[normal] text-wz-heading">
          <thead>
            <tr>
              {[
                "Employee",
                "Leave Type (If any)",
                "Check In",
                "Check Out",
                "Hours",
                "Sessions",
                "Notes",
                "Location In",
                "Location Out",
                "Status",
                "Actions",
              ].map((h) => (
                <th
                  key={h}
                  className="h-[54px] max-w-[110px] border-b border-wz-border px-4 align-middle font-semibold"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td
                  colSpan={11}
                  className="px-wz-4 py-wz-8 text-center text-wz-text-muted"
                >
                  Loading attendance…
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td
                  colSpan={11}
                  className="px-wz-4 py-wz-8 text-center text-wz-text-muted"
                >
                  No attendance records for this selection.
                </td>
              </tr>
            ) : (
              rows.map((row) => {
                const sessions = row.sessions || [];
                const firstSession = sessions[0];
                const lastSession = sessions[sessions.length - 1];
                const sessionCount = row.sessionCount ?? sessions.length;
                const open = expanded === row.rowKey;
                const editable = canEdit && (canEditRow ? canEditRow(row) : true);
                return (
                  <Fragment key={row.rowKey}>
                  <tr className="border-b border-wz-border last:border-0">
                    <td className="h-[60px] px-4">
                      <p className="m-0 truncate">{row.name}</p>
                      <p className="m-0 mt-0.5 text-[10px] text-wz-text-muted">
                        {row.employeeCode}
                      </p>
                    </td>
                    <td className="px-4">{row.leaveLabel || row.leaveType || "-"}</td>
                    <td className="px-4">{formatHistoryTime(row.checkIn)}</td>
                    {/* An open session has no check-out yet (ATT-FN-06). */}
                    <td className="px-4">{row.isCheckedIn ? "-" : formatHistoryTime(row.checkOut)}</td>
                    <td className="px-4 whitespace-nowrap">{formatHours(row.hours)}</td>
                    <td className="px-4">
                      {sessions.length ? (
                        <button
                          type="button"
                          aria-expanded={open}
                          aria-label={`Session details for ${row.name}`}
                          className="inline-flex cursor-pointer items-center gap-1 border-0 bg-transparent p-0 text-xs text-wz-heading hover:text-wz-primary"
                          onClick={() => setExpanded(open ? null : row.rowKey)}
                        >
                          {sessionCount}
                          <ChevronDown size={12} className={cn("transition-transform", open && "rotate-180")} aria-hidden />
                        </button>
                      ) : (
                        sessionCount || "-"
                      )}
                    </td>
                    <td className="max-w-[140px] truncate px-4">
                      {row.notes || row.reason || "-"}
                    </td>
                    <td className="px-4">
                      <LocationIcons
                        url={firstSession?.checkInLocation?.mapsUrl}
                        selfieUrl={firstSession?.checkInSelfieUrl}
                      />
                    </td>
                    <td className="px-4">
                      <LocationIcons
                        url={lastSession?.checkOutLocation?.mapsUrl}
                        selfieUrl={lastSession?.checkOutSelfieUrl}
                      />
                    </td>
                    <td className="px-4">
                      <div className="flex flex-col items-start gap-1">
                        <Badge status={statusToBadge(row.status)}>
                          {row.status || "-"}
                        </Badge>
                        {/* A session still open after its day ended (ATT-FN-06). */}
                        {row.isCheckedIn && missedCheckout(row.date) ? (
                          <Badge status="warning">Missed check-out</Badge>
                        ) : null}
                      </div>
                    </td>
                    <td className="px-4">
                      <div className="flex items-center gap-1">
                        {editable ? (
                          <button
                            type="button"
                            className="inline-flex size-6 cursor-pointer items-center justify-center rounded-wz-md border-0 bg-transparent text-wz-heading hover:bg-wz-neutral-100"
                            aria-label={`Edit ${row.name}`}
                            onClick={() => onEdit?.(row)}
                          >
                            <SquarePen size={12} />
                          </button>
                        ) : null}
                        <button
                          type="button"
                          className="inline-flex size-6 cursor-pointer items-center justify-center rounded-wz-md border-0 bg-transparent text-wz-heading hover:bg-wz-neutral-100"
                          aria-label={`History for ${row.name}`}
                          onClick={() => onHistory?.(row)}
                        >
                          <Clock3 size={12} />
                        </button>
                      </div>
                    </td>
                  </tr>
                  {open ? (
                    /* Figma session details: First In / Last Out / Total Hours / Sessions, then each session */
                    <tr className="border-b border-wz-border bg-wz-neutral-50 last:border-0">
                      <td colSpan={11} className="px-4 py-3">
                        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                          {(
                            [
                              ["First In", formatHistoryTime(firstSession?.checkIn)],
                              ["Last Out", lastSession?.isOpen ? "-" : formatHistoryTime(lastSession?.checkOut)],
                              ["Total Hours", formatHours(row.hours)],
                              ["Sessions", String(sessionCount)],
                            ] as const
                          ).map(([label, value]) => (
                            <div key={label} className="rounded-wz-md border border-wz-border bg-white px-3 py-2">
                              <p className="m-0 text-[9px] leading-3 font-bold tracking-[0.5px] text-wz-text-muted uppercase">{label}</p>
                              <p className="m-0 mt-1 text-sm leading-[18px] font-bold text-wz-heading">{value}</p>
                            </div>
                          ))}
                        </div>
                        <ul className="m-0 mt-3 flex list-none flex-col gap-2 p-0">
                          {sessions.map((sn, i) => (
                            <li key={i} className="flex flex-wrap items-center gap-x-6 gap-y-1 rounded-wz-md border border-wz-border bg-white px-3 py-2">
                              <span className="font-semibold">Session {sn.sessionNumber || i + 1}</span>
                              <span className="inline-flex items-center gap-1.5">
                                In: {formatHistoryTime(sn.checkIn)}
                                {sn.checkInLocation?.mapsUrl || sn.checkInSelfieUrl ? (
                                  <LocationIcons url={sn.checkInLocation?.mapsUrl} selfieUrl={sn.checkInSelfieUrl} />
                                ) : null}
                              </span>
                              <span className="inline-flex items-center gap-1.5">
                                Out: {sn.isOpen ? "-" : formatHistoryTime(sn.checkOut)}
                                {!sn.isOpen && (sn.checkOutLocation?.mapsUrl || sn.checkOutSelfieUrl) ? (
                                  <LocationIcons url={sn.checkOutLocation?.mapsUrl} selfieUrl={sn.checkOutSelfieUrl} />
                                ) : null}
                              </span>
                              <span>{formatHours(sn.hours)}</span>
                              {sn.isOpen ? <Badge status="warning">Open</Badge> : null}
                            </li>
                          ))}
                        </ul>
                      </td>
                    </tr>
                  ) : null}
                  </Fragment>
                );
              })
            )}
          </tbody>
        </table>
        </div>
        {onPageChange && count > 0 ? (
          <Pagination
            page={page}
            pages={pages}
            onPageChange={onPageChange}
            summary={`Showing ${from}–${Math.min(page * pageSize, count)} of ${count} employees`}
          />
        ) : null}
      </div>
    </section>
  );
}
