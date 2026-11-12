import { Clock3, Search, SquarePen } from "lucide-react";
import LocationIcons from "./LocationIcons";
import { Badge, Select, cn } from "../../design-system";
import type { BadgeStatus } from "../../design-system";
import { FILTER_TYPE_PRESETS } from "./attendanceMonthOptions";
import {
  EMPLOYEE_STATUS_FILTER_OPTIONS,
  type NormalizedAttendanceRow,
} from "./attendanceViewModel";

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

      <div className="overflow-x-auto rounded-wz-xl border border-wz-border bg-white">
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
                const firstSession = row.sessions?.[0];
                const lastSession = row.sessions?.[row.sessions.length - 1];
                return (
                  <tr
                    key={row.rowKey}
                    className="border-b border-wz-border last:border-0"
                  >
                    <td className="h-[60px] px-4">
                      <p className="m-0 truncate">{row.name}</p>
                      <p className="m-0 mt-0.5 text-[10px] text-wz-text-muted">
                        {row.employeeCode}
                      </p>
                    </td>
                    <td className="px-4">{row.leaveLabel || row.leaveType || "-"}</td>
                    <td className="px-4">{row.checkIn || "-"}</td>
                    <td className="px-4">{row.checkOut || "-"}</td>
                    <td className="px-4">{row.hours || "-"}</td>
                    <td className="px-4">
                      {row.sessionCount ?? row.sessions?.length ?? "-"}
                    </td>
                    <td className="max-w-[140px] truncate px-4">
                      {row.notes || row.reason || "-"}
                    </td>
                    <td className="px-4">
                      <LocationIcons url={firstSession?.checkInLocation?.mapsUrl} />
                    </td>
                    <td className="px-4">
                      <LocationIcons url={lastSession?.checkOutLocation?.mapsUrl} />
                    </td>
                    <td className="px-4">
                      <Badge status={statusToBadge(row.status)}>
                        {row.status || "-"}
                      </Badge>
                    </td>
                    <td className="px-4">
                      <div className="flex items-center gap-1">
                        {canEdit ? (
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
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
