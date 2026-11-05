import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Badge, Button, cn } from "../../design-system";
import { ApiError } from "../../lib/apiClient";
import { useEmployeeAttendanceMonth } from "../../hooks/useEmployeeDetailTabs";
import AttendanceDayDetail from "./AttendanceDayDetail";
import {
  WEEKDAYS,
  buildCalendarCells,
  flattenDayRecords,
  kpiFromStats,
  monthLabel,
} from "./attendanceCalendar";

export type EmployeeAttendancePanelProps = {
  employeeId: string;
};

const legend = [
  { label: "Present", color: "bg-[#12b76a]" },
  { label: "Absent", color: "bg-[#f04438]" },
  { label: "Late", color: "bg-[#f79009]" },
  { label: "Half Day", color: "bg-[#1f5da3]" },
  { label: "WFH", color: "bg-[#c4a484]" },
  { label: "Leave", color: "bg-[#36bffa]" },
  { label: "Holiday", color: "bg-[#7a5af8]" },
  { label: "Week Off", color: "bg-[#495057]" },
  { label: "Compensatory Off", color: "bg-[#001529]" },
];

const statusBadge = (
  status?: string,
): "success" | "error" | "warning" | "blue" | "info" | "neutral" => {
  const s = String(status || "");
  if (s === "Present") return "success";
  if (s === "Absent") return "error";
  if (s === "Late") return "warning";
  if (s === "Half Day") return "blue";
  if (s === "Leave" || s === "WFH") return "info";
  return "neutral";
};

const cellLabelClass = (status: string, weekOff?: boolean, holiday?: boolean) => {
  if (holiday) return "text-[#7a5af8]";
  if (weekOff || status === "week-off") return "text-[#6c757d]";
  if (status === "Present" || status === "present") return "text-[#12b76a]";
  if (status === "Absent" || status === "absent") return "text-[#f04438]";
  if (status === "Late" || status === "late") return "text-[#f79009]";
  if (status === "WFH" || status === "wfh") return "text-[#c4a484]";
  if (status === "Leave" || status === "leave") return "text-[#36bffa]";
  if (status === "Half Day" || status === "half-day") return "text-[#1f5da3]";
  return "text-wz-text-secondary";
};

export default function EmployeeAttendancePanel({
  employeeId,
}: EmployeeAttendancePanelProps) {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [selectedDay, setSelectedDay] = useState<number | null>(null);

  const { data, isLoading, isError, error, refetch, isFetching } =
    useEmployeeAttendanceMonth(employeeId, year, month, true);

  const cells = useMemo(
    () => buildCalendarCells(year, month, data),
    [year, month, data],
  );
  const kpis = useMemo(() => kpiFromStats(data?.stats), [data]);
  const rows = useMemo(() => flattenDayRecords(data), [data]);
  const label = monthLabel(year, month);

  const selectedCell = useMemo(
    () =>
      selectedDay == null
        ? null
        : cells.find((c) => !c.empty && c.day === selectedDay) || null,
    [cells, selectedDay],
  );

  const filteredRows = useMemo(() => {
    if (selectedDay == null) return rows;
    return rows.filter((r) => r.day === selectedDay);
  }, [rows, selectedDay]);

  const shiftMonth = (delta: number) => {
    const d = new Date(year, month - 1 + delta, 1);
    setYear(d.getFullYear());
    setMonth(d.getMonth() + 1);
    setSelectedDay(null);
  };

  const onDaySelect = (day: number) => {
    setSelectedDay((prev) => (prev === day ? null : day));
  };

  if (isLoading) {
    return (
      <section className="rounded-wz-xl border border-wz-border bg-white p-wz-6 text-sm text-wz-text-secondary">
        Loading attendance…
      </section>
    );
  }

  if (isError) {
    return (
      <section className="rounded-wz-xl border border-wz-border bg-white p-wz-6">
        <p className="m-0 text-sm text-wz-error" role="alert">
          {error instanceof ApiError
            ? error.message
            : "Could not load attendance."}
        </p>
        <Button
          type="button"
          variant="secondary"
          className="mt-wz-3"
          onClick={() => void refetch()}
        >
          Retry
        </Button>
      </section>
    );
  }

  return (
    <div className="flex w-full flex-col gap-wz-6">
      <div className="grid grid-cols-2 gap-wz-3 sm:grid-cols-3 lg:grid-cols-6">
        {kpis.map((kpi) => (
          <div
            key={kpi.label}
            className="rounded-wz-xl border border-wz-border bg-white px-wz-4 py-wz-4"
          >
            <p className="m-0 text-xs font-semibold text-[#6c757d]">
              {kpi.label}
            </p>
            <p className="m-0 mt-2 text-2xl font-bold text-[#0a1f4a]">
              {kpi.value}
            </p>
          </div>
        ))}
      </div>

      <section className="rounded-wz-xl border border-wz-border bg-white p-wz-6">
        <div className="mb-wz-4 flex flex-wrap items-start justify-between gap-wz-3">
          <div>
            <h2 className="m-0 text-base font-semibold text-[#0a1f4a]">
              {label}
              {isFetching ? (
                <span className="ml-2 text-xs font-normal text-wz-text-secondary">
                  Updating…
                </span>
              ) : null}
            </h2>
            <p className="m-0 mt-1 text-xs text-wz-text-secondary">
              Click any day to view its attendance details below.
            </p>
            <div className="mt-2 flex flex-wrap gap-3">
              {legend.map((item) => (
                <span
                  key={item.label}
                  className="inline-flex items-center gap-1.5 text-[11px] text-wz-text-secondary"
                >
                  <span
                    className={cn("size-2 rounded-wz-full", item.color)}
                  />
                  {item.label}
                </span>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button
              type="button"
              className="inline-flex size-8 cursor-pointer items-center justify-center rounded-wz-md border border-wz-border bg-white text-wz-text-secondary hover:bg-wz-neutral-50"
              aria-label="Previous month"
              onClick={() => shiftMonth(-1)}
            >
              <ChevronLeft size={16} />
            </button>
            <button
              type="button"
              className="inline-flex size-8 cursor-pointer items-center justify-center rounded-wz-md border border-wz-border bg-white text-wz-text-secondary hover:bg-wz-neutral-50"
              aria-label="Next month"
              onClick={() => shiftMonth(1)}
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-7 border border-wz-border">
          {WEEKDAYS.map((day) => (
            <div
              key={day}
              className="border-b border-wz-border bg-wz-neutral-50 px-2 py-3 text-center text-[11px] font-semibold tracking-wide text-wz-text-secondary"
            >
              {day}
            </div>
          ))}
          {cells.map((cell) =>
            cell.empty ? (
              <div
                key={cell.key}
                className="min-h-[72px] border-b border-r border-wz-border bg-wz-neutral-50/40"
              />
            ) : (
              <button
                key={cell.key}
                type="button"
                className={cn(
                  "min-h-[72px] cursor-pointer border-b border-r border-wz-border p-2 text-left transition-colors hover:bg-wz-neutral-50",
                  cell.isToday && "bg-wz-hover",
                  selectedDay === cell.day &&
                    "bg-wz-selected ring-1 ring-inset ring-wz-primary",
                )}
                aria-pressed={selectedDay === cell.day}
                aria-label={`Day ${cell.day}${cell.label ? `, ${cell.label}` : ""}`}
                onClick={() => onDaySelect(cell.day)}
              >
                <p className="m-0 text-xs font-semibold text-[#0a1f4a]">
                  {cell.day}
                </p>
                {cell.label ? (
                  <p
                    className={cn(
                      "m-0 mt-1 text-[10px] font-semibold leading-tight",
                      cellLabelClass(
                        cell.status,
                        cell.weekOff,
                        Boolean(cell.holidayName),
                      ),
                    )}
                    title={cell.label}
                  >
                    {cell.label}
                  </p>
                ) : null}
                {cell.hasSessions ? (
                  <span className="mt-1 block text-[9px] font-medium text-wz-primary">
                    Sessions
                  </span>
                ) : null}
              </button>
            ),
          )}
        </div>
      </section>

      {selectedDay != null && selectedCell && !selectedCell.empty ? (
        <AttendanceDayDetail
          day={selectedDay}
          monthLabel={label}
          holidayName={selectedCell.holidayName}
          weekOff={selectedCell.weekOff}
          entries={selectedCell.entries}
          onClose={() => setSelectedDay(null)}
        />
      ) : null}

      <section className="overflow-hidden rounded-wz-xl border border-wz-border bg-white">
        <div className="border-b border-wz-border px-wz-5 py-wz-4">
          <h2 className="m-0 text-base font-semibold text-[#0a1f4a]">
            Attendance —{" "}
            {selectedDay != null
              ? `${selectedDay} ${label}`
              : label}
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] border-collapse text-left text-sm">
            <thead>
              <tr className="bg-wz-neutral-50 text-xs text-wz-text-secondary">
                <th className="px-4 py-3 font-semibold">Day</th>
                <th className="px-4 py-3 font-semibold">Leave Type</th>
                <th className="px-4 py-3 font-semibold">Check In</th>
                <th className="px-4 py-3 font-semibold">Check Out</th>
                <th className="px-4 py-3 font-semibold">Hours</th>
                <th className="px-4 py-3 font-semibold">Sessions</th>
                <th className="px-4 py-3 font-semibold">Notes</th>
                <th className="px-4 py-3 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredRows.length === 0 ? (
                <tr>
                  <td
                    colSpan={8}
                    className="px-4 py-6 text-center text-wz-text-secondary"
                  >
                    {selectedDay != null
                      ? "No attendance records for this day."
                      : "No attendance records for this month."}
                  </td>
                </tr>
              ) : (
                filteredRows.map((row, idx) => (
                  <tr
                    key={`${row.day}-${row.status}-${idx}`}
                    className={cn(
                      "border-t border-wz-border",
                      selectedDay === row.day && "bg-wz-hover/40",
                    )}
                  >
                    <td className="px-4 py-3 text-[#0a1f4a]">
                      <button
                        type="button"
                        className="cursor-pointer border-0 bg-transparent p-0 font-semibold text-wz-primary underline-offset-2 hover:underline"
                        onClick={() => onDaySelect(row.day)}
                      >
                        {row.day}
                      </button>
                    </td>
                    <td className="px-4 py-3 text-wz-text-secondary">
                      {row.leaveLabel || row.leaveType || "—"}
                    </td>
                    <td className="px-4 py-3">{row.checkIn || "—"}</td>
                    <td className="px-4 py-3">{row.checkOut || "—"}</td>
                    <td className="px-4 py-3">{row.hours ?? "—"}</td>
                    <td className="px-4 py-3">
                      {row.sessionCount ?? row.sessions?.length ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-wz-text-secondary">
                      {row.notes || "—"}
                    </td>
                    <td className="px-4 py-3">
                      <Badge status={statusBadge(row.status)} size="sm">
                        {row.status || "—"}
                      </Badge>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
