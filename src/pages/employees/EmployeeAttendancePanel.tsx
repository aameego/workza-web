import { useMemo, useState, type ReactNode } from "react";
import AttendanceCalendar from "../attendance/AttendanceCalendar";
import {
  dayCellClass,
  dayLook,
  dayNumberClass,
} from "../attendance/attendanceCalendarStyle";
import LocationIcons from "../attendance/LocationIcons";
import { formatHistoryTime, formatHours } from "../attendance/attendanceHistory";
import { Badge, Button, cn, MonthSelect } from "../../design-system";
import { useAttendanceMonth } from "../../hooks/useAttendance";
import { ApiError } from "../../lib/apiClient";
import { useEmployeeAttendanceMonth } from "../../hooks/useEmployeeDetailTabs";
import AttendanceDayDetail from "./AttendanceDayDetail";
import {
  buildCalendarCells,
  flattenDayRecords,
  kpiFromStats,
  monthLabel,
  unmarkedPastWorkingDays,
} from "./attendanceCalendar";
import { useEmployee } from "../../hooks/useEmployees";
import { readSessionUser } from "../../layouts/sessionUser";

export type EmployeeAttendancePanelProps = {
  /** Omit for the signed-in user's own attendance (target "self"). */
  employeeId?: string;
  /** Self view only: shown left of the month picker (manager tabs). */
  leading?: ReactNode;
  /** Self view only: content between the KPIs and the calendar (check-in card). */
  afterKpis?: ReactNode;
};

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

export default function EmployeeAttendancePanel({
  employeeId,
  leading,
  afterKpis,
}: EmployeeAttendancePanelProps) {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [selectedDay, setSelectedDay] = useState<number | null>(null);

  const isSelf = !employeeId;
  const employeeQuery = useEmployeeAttendanceMonth(
    employeeId,
    year,
    month,
    !isSelf,
  );
  const selfQuery = useAttendanceMonth(year, month, { target: "self" }, isSelf);
  const { data, isLoading, isError, error, refetch, isFetching } = isSelf
    ? selfQuery
    : employeeQuery;

  const cells = useMemo(
    () => buildCalendarCells(year, month, data),
    [year, month, data],
  );
  const sessionUser = readSessionUser();
  const { data: profile } = useEmployee(employeeId || sessionUser?.employeeId || undefined);
  const kpis = useMemo(
    () =>
      kpiFromStats(
        data?.stats,
        unmarkedPastWorkingDays(year, month, data, { joinedOn: profile?.dateOfJoining }),
      ),
    [data, year, month, profile?.dateOfJoining],
  );
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

  const header = isSelf ? (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="flex flex-wrap items-center gap-2">{leading}</div>
      <MonthSelect year={year} month={month} onShift={shiftMonth} />
    </div>
  ) : null;

  if (isLoading) {
    return (
      <div className="flex w-full flex-col gap-wz-6">
        {header}
        <section className="rounded-wz-xl border border-wz-border bg-white p-wz-6 text-sm text-wz-text-secondary">
          Loading attendance…
        </section>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex w-full flex-col gap-wz-6">
        {header}
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
      </div>
    );
  }

  return (
    <div className="flex w-full flex-col gap-wz-6">
      {header}
      {/* Figma metrics: six 180x86 cards, 16 apart */}
      <div className="grid grid-cols-2 gap-wz-4 sm:grid-cols-3 lg:grid-cols-6">
        {kpis.map((kpi) => (
          <div
            key={kpi.label}
            className="flex h-[86px] flex-col gap-1 rounded-wz-xl border border-wz-border bg-white p-wz-4"
          >
            <p className="m-0 text-[11px] leading-[14px] font-semibold tracking-[0.5px] text-wz-text-muted uppercase">
              {kpi.label}
            </p>
            <p className="m-0 text-[28px] leading-[34px] font-bold text-wz-heading">
              {kpi.value}
            </p>
          </div>
        ))}
      </div>

      {afterKpis}

      <AttendanceCalendar
        title={
          <>
            {label}
            {isFetching ? (
              <span className="ml-2 text-xs font-normal text-wz-text-secondary">
                Updating…
              </span>
            ) : null}
          </>
        }
        onPrev={() => shiftMonth(-1)}
        onNext={() => shiftMonth(1)}
        cells={cells}
        renderDay={(cell) => {
          const look = dayLook(
            cell.status,
            cell.label,
            cell.weekOff,
            Boolean(cell.holidayName),
          );
          const selected = selectedDay === cell.day;
          return (
            <button
              key={cell.key}
              type="button"
              className={cn(
                dayCellClass,
                look.bg,
                selected && "ring-1 ring-wz-primary ring-inset",
              )}
              aria-pressed={selected}
              aria-label={`Day ${cell.day}${cell.label ? `, ${cell.label}` : ""}`}
              onClick={() => onDaySelect(cell.day)}
            >
              <span className={dayNumberClass(cell.isToday)}>{cell.day}</span>
              {cell.label ? (
                <span
                  className={cn(
                    "mt-[6px] truncate pr-[11px] text-center leading-6 font-semibold",
                    look.large ? "text-sm" : "text-[10px]",
                    look.text,
                  )}
                  title={cell.label}
                >
                  {cell.label}
                </span>
              ) : null}
              {cell.hasSessions ? (
                <span className="absolute top-[9px] right-[11px] text-[9px] font-medium text-wz-primary">
                  Sessions
                </span>
              ) : null}
            </button>
          );
        }}
      />

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

      {/* Figma: title on the page, table card 16 below; header 54, rows 53, 12px navy */}
      <div className="flex flex-col gap-wz-4">
        <h2 className="m-0 text-lg leading-[23px] font-bold text-wz-heading">
          {isSelf ? "My Attendance" : "Attendance"} —{" "}
          {selectedDay != null ? `${selectedDay} ${label}` : label}
        </h2>
        <div className="overflow-x-auto rounded-wz-xl border border-wz-border bg-white">
          <table className="w-full min-w-[900px] border-collapse text-left text-xs leading-[normal] text-wz-heading">
            <thead>
              <tr>
                {[
                  "Day",
                  "Leave Type (If any)",
                  "Check In",
                  "Check Out",
                  "Hours",
                  "Sessions",
                  "Notes",
                  "Location In",
                  "Location Out",
                  "Status",
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
              {filteredRows.length === 0 ? (
                <tr>
                  <td
                    colSpan={10}
                    className="h-[53px] px-4 text-center text-wz-text-muted"
                  >
                    {selectedDay != null
                      ? "No attendance records for this day."
                      : "No attendance records for this month."}
                  </td>
                </tr>
              ) : (
                filteredRows.map((row, idx) => {
                  const firstSession = row.sessions?.[0];
                  const lastSession = row.sessions?.[row.sessions.length - 1];
                  return (
                    <tr
                      key={`${row.day}-${row.status}-${idx}`}
                      className={cn(
                        "border-b border-wz-border last:border-b-0",
                        selectedDay === row.day && "bg-wz-hover/40",
                      )}
                    >
                      <td className="h-[53px] px-4">
                        <button
                          type="button"
                          className="cursor-pointer border-0 bg-transparent p-0 font-semibold text-wz-primary underline-offset-2 hover:underline"
                          onClick={() => onDaySelect(row.day)}
                        >
                          {row.day}
                        </button>
                      </td>
                      <td className="px-4">
                        {row.leaveLabel || row.leaveType || "-"}
                      </td>
                      <td className="px-4">{formatHistoryTime(row.checkIn)}</td>
                      <td className="px-4">
                        {lastSession?.isOpen ? "-" : formatHistoryTime(row.checkOut)}
                      </td>
                      <td className="px-4 whitespace-nowrap">{formatHours(row.hours)}</td>
                      <td className="px-4">
                        {row.sessionCount ?? row.sessions?.length ?? "-"}
                      </td>
                      <td className="px-4">{row.notes || "-"}</td>
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
                        <Badge status={statusBadge(row.status)}>
                          {row.status || "-"}
                        </Badge>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
