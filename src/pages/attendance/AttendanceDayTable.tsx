import { Clock3, MapPin, Pencil } from "lucide-react";
import { Badge, Input, Select, cn } from "../../design-system";
import type { BadgeStatus } from "../../design-system";
import { FILTER_TYPE_PRESETS } from "./attendanceMonthOptions";
import {
  ATTENDANCE_STATUS_COLORS,
  EMPLOYEE_STATUS_FILTER_OPTIONS,
  type NormalizedAttendanceRow,
} from "./attendanceViewModel";

const statusToBadge = (status?: string): BadgeStatus => {
  const s = String(status || "");
  if (s === "Present") return "success";
  if (s === "Absent" || s === "Not Marked") return "error";
  if (s === "Late") return "warning";
  if (s === "Leave" || s === "Half Day" || s === "WFH") return "info";
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
  onEdit,
  onHistory,
}: AttendanceDayTableProps) {
  return (
    <section className="rounded-wz-xl border border-wz-border bg-white">
      <div className="flex flex-wrap items-start justify-between gap-wz-3 border-b border-wz-border px-wz-5 py-wz-4">
        <div>
          <h2 className="m-0 text-base font-semibold text-wz-text-primary">
            {title}
          </h2>
          {subtitle ? (
            <p className="m-0 mt-1 text-xs text-wz-text-secondary">{subtitle}</p>
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
        <div className="flex w-full max-w-3xl flex-wrap items-center justify-end gap-2">
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
          <Input
            type="search"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search by employees name or code..."
            className="w-full max-w-xs"
            aria-label="Search attendance rows"
          />
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[960px] border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-wz-border bg-wz-neutral-50 text-xs font-semibold uppercase tracking-wide text-wz-text-secondary">
              <th className="px-wz-4 py-3">Employee</th>
              <th className="px-wz-4 py-3">Leave Type</th>
              <th className="px-wz-4 py-3">Check In</th>
              <th className="px-wz-4 py-3">Check Out</th>
              <th className="px-wz-4 py-3">Hours</th>
              <th className="px-wz-4 py-3">Sessions</th>
              <th className="px-wz-4 py-3">Notes</th>
              <th className="px-wz-4 py-3">Location</th>
              <th className="px-wz-4 py-3">Status</th>
              <th className="px-wz-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td
                  colSpan={10}
                  className="px-wz-4 py-wz-8 text-center text-wz-text-secondary"
                >
                  Loading attendance…
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td
                  colSpan={10}
                  className="px-wz-4 py-wz-8 text-center text-wz-text-secondary"
                >
                  No attendance records for this selection.
                </td>
              </tr>
            ) : (
              rows.map((row) => {
                const colors =
                  ATTENDANCE_STATUS_COLORS[row.status || ""] ||
                  ATTENDANCE_STATUS_COLORS["Not Marked"];
                return (
                  <tr
                    key={row.rowKey}
                    className="border-b border-wz-border last:border-0"
                  >
                    <td className="px-wz-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <span className="inline-flex size-8 shrink-0 items-center justify-center rounded-full bg-wz-primary text-[11px] font-bold text-white">
                          {row.initials}
                        </span>
                        <div className="min-w-0">
                          <p className="m-0 truncate font-semibold text-wz-text-primary">
                            {row.name}
                          </p>
                          <p className="m-0 text-xs text-wz-text-secondary">
                            {row.employeeCode}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-wz-4 py-3 text-wz-text-secondary">
                      {row.leaveLabel || row.leaveType || "—"}
                    </td>
                    <td className="px-wz-4 py-3">{row.checkIn || "—"}</td>
                    <td className="px-wz-4 py-3">{row.checkOut || "—"}</td>
                    <td className="px-wz-4 py-3">{row.hours || "—"}</td>
                    <td className="px-wz-4 py-3">
                      {row.sessionCount ?? row.sessions?.length ?? "—"}
                    </td>
                    <td className="max-w-[140px] truncate px-wz-4 py-3 text-wz-text-secondary">
                      {row.notes || row.reason || "—"}
                    </td>
                    <td className="px-wz-4 py-3">
                      <span className="inline-flex items-center gap-1 text-wz-text-secondary">
                        <MapPin className="size-3.5" aria-hidden />
                        {row.locationIn || row.locationOut ? "Map" : "—"}
                      </span>
                    </td>
                    <td className="px-wz-4 py-3">
                      <Badge
                        status={statusToBadge(row.status)}
                        className={cn(colors?.bg, colors?.text)}
                      >
                        {row.status || "—"}
                      </Badge>
                    </td>
                    <td className="px-wz-4 py-3">
                      <div className="flex items-center gap-1">
                        {canEdit ? (
                          <button
                            type="button"
                            className="inline-flex size-8 cursor-pointer items-center justify-center rounded-wz-md border-0 bg-transparent text-wz-text-secondary hover:bg-wz-neutral-100 hover:text-wz-primary"
                            aria-label={`Edit ${row.name}`}
                            onClick={() => onEdit?.(row)}
                          >
                            <Pencil className="size-4" />
                          </button>
                        ) : null}
                        <button
                          type="button"
                          className="inline-flex size-8 cursor-pointer items-center justify-center rounded-wz-md border-0 bg-transparent text-wz-text-secondary hover:bg-wz-neutral-100 hover:text-wz-primary"
                          aria-label={`History for ${row.name}`}
                          onClick={() => onHistory?.(row)}
                        >
                          <Clock3 className="size-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
