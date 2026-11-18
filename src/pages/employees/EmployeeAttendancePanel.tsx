import { useMemo, useState, type ReactNode } from "react";
import AttendanceCalendar from "../attendance/AttendanceCalendar";
import {
  dayCellClass,
  dayLook,
  dayNumberClass,
  mobileDayLabelClass,
} from "../attendance/attendanceCalendarStyle";
import LocationIcons from "../attendance/LocationIcons";
import { formatHistoryTime, formatHours } from "../attendance/attendanceHistory";
import { Eye } from "lucide-react";
import { Badge, Button, cn, Modal, MonthSelect, Pagination } from "../../design-system";
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

/** Figma mobile table pages (173:51938); the desktop table lists the whole month. */
const MOBILE_PAGE = 10;

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
  const [details, setDetails] = useState<(typeof rows)[number] | null>(null);
  const [mobilePage, setMobilePage] = useState(1);
  const dayDate = (day: number) => new Date(year, month - 1, day);
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
    setMobilePage(1);
  };

  const onDaySelect = (day: number) => {
    setMobilePage(1);
    setSelectedDay((prev) => (prev === day ? null : day));
  };

  const header = isSelf ? (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="flex flex-wrap items-center gap-2">{leading}</div>
      <MonthSelect year={year} month={month} onShift={shiftMonth} className="max-md:h-9" />
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
    <div className="flex w-full flex-col gap-wz-6 max-md:gap-5">
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
                    mobileDayLabelClass,
                  )}
                  title={cell.label}
                >
                  {cell.label}
                </span>
              ) : null}
              {cell.hasSessions ? (
                <span className="absolute top-[9px] right-[11px] text-[9px] font-medium text-wz-primary max-md:hidden">
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
      <div className="flex flex-col gap-wz-4 max-md:gap-5">
        <h2 className="m-0 text-lg leading-[23px] font-bold text-wz-heading">
          {isSelf ? "My Attendance" : "Attendance"} —{" "}
          {selectedDay != null ? `${selectedDay} ${label}` : label}
        </h2>
        {/* Figma mobile (173:51938): six compact columns, the eye opens View Details (173:50749) */}
        <div className="overflow-hidden rounded-wz-xl border border-[#dee2e6] bg-white md:hidden max-md:border-0 max-md:outline max-md:outline-1 max-md:-outline-offset-1 max-md:outline-[#dee2e6]">
          <div className="flex items-center gap-1 border-b border-[#e9ecef] bg-[#f8f9fa] px-4 py-3 text-[10px] leading-[normal] font-semibold text-wz-heading">
            {["Dates & Days", "Check In", "Check Out", "Hours", "Status"].map((h) => (
              <p key={h} className="m-0 min-w-0 flex-1">
                {h}
              </p>
            ))}
            <p className="m-0 min-w-0 flex-1 text-center">Actions</p>
          </div>
          {filteredRows.length === 0 ? (
            <p className="m-0 px-4 py-3.5 text-center text-[10px] text-wz-text-muted">
              {selectedDay != null ? "No attendance records for this day." : "No attendance records for this month."}
            </p>
          ) : (
            filteredRows.slice((mobilePage - 1) * MOBILE_PAGE, mobilePage * MOBILE_PAGE).map((row, idx) => {
              const d = dayDate(row.day);
              const open = row.sessions?.[row.sessions.length - 1]?.isOpen;
              return (
                <div
                  key={`${row.day}-${row.status}-${idx}`}
                  className="flex items-center gap-1 border-b border-[#e9ecef] px-4 py-[13.5px] text-[10px] leading-[normal] text-wz-heading"
                >
                  <div className="flex min-w-0 flex-1 flex-col gap-0.5 whitespace-nowrap">
                    <span>{d.toLocaleDateString("en-GB")}</span>
                    <span className="text-[9px] text-wz-text-muted">
                      {d.toLocaleDateString("en-GB", { weekday: "long" })}
                    </span>
                  </div>
                  <p className="m-0 min-w-0 flex-1">{formatHistoryTime(row.checkIn)}</p>
                  <p className="m-0 min-w-0 flex-1">{open ? "-" : formatHistoryTime(row.checkOut)}</p>
                  <p className="m-0 min-w-0 flex-1">{formatHours(row.hours)}</p>
                  <div className="flex min-w-0 flex-1">
                    <Badge status={statusBadge(row.status)} size="sm">
                      {row.status || "-"}
                    </Badge>
                  </div>
                  <div className="flex h-8 min-w-0 flex-1 items-center justify-center">
                    <button
                      type="button"
                      aria-label={`View ${d.toLocaleDateString("en-GB")} details`}
                      className="inline-flex cursor-pointer items-center justify-center rounded-wz-md border-0 bg-transparent px-1 py-1.5 text-wz-heading"
                      onClick={() => setDetails(row)}
                    >
                      <Eye size={12} aria-hidden />
                    </button>
                  </div>
                </div>
              );
            })
          )}
          {filteredRows.length > MOBILE_PAGE ? (
            <Pagination
              variant="compact"
              page={mobilePage}
              pages={Math.ceil(filteredRows.length / MOBILE_PAGE)}
              onPageChange={setMobilePage}
              summary={`Showing ${(mobilePage - 1) * MOBILE_PAGE + 1}–${Math.min(mobilePage * MOBILE_PAGE, filteredRows.length)} of ${filteredRows.length} days`}
            />
          ) : null}
        </div>

        <div className="overflow-x-auto rounded-wz-xl border border-wz-border bg-white max-md:hidden">
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

      {details ? (
        <Modal open title="View Details" onClose={() => setDetails(null)}>
          <div className="flex flex-col gap-3 pt-0.5">
            {(
              [
                ["Attendance Date", dayDate(details.day).toLocaleDateString("en-GB", { day: "2-digit", month: "2-digit", year: "2-digit" })],
                ["Leave Type (If any)", details.leaveLabel || details.leaveType || "-"],
                ["Check In", formatHistoryTime(details.checkIn)],
                ["Check Out", details.sessions?.[details.sessions.length - 1]?.isOpen ? "-" : formatHistoryTime(details.checkOut)],
                ["Hours", formatHours(details.hours)],
                ["Sessions", String(details.sessionCount ?? details.sessions?.length ?? "-")],
                ["Notes", details.notes || "-"],
                [
                  "Location In",
                  <LocationIcons
                    url={details.sessions?.[0]?.checkInLocation?.mapsUrl}
                    selfieUrl={details.sessions?.[0]?.checkInSelfieUrl}
                  />,
                ],
                [
                  "Location Out",
                  <LocationIcons
                    url={details.sessions?.[details.sessions.length - 1]?.checkOutLocation?.mapsUrl}
                    selfieUrl={details.sessions?.[details.sessions.length - 1]?.checkOutSelfieUrl}
                  />,
                ],
                [
                  "Status",
                  <Badge status={statusBadge(details.status)} size="sm">
                    {details.status || "-"}
                  </Badge>,
                ],
              ] as [string, ReactNode][]
            ).map(([k, v]) => (
              <div key={k} className="flex items-start gap-3">
                <span className="w-[92px] shrink-0 text-[10px] leading-[13px] font-semibold text-[#495057]">{k}</span>
                <span
                  className={cn(
                    "min-w-0 flex-1 text-xs break-words text-wz-heading",
                    k.startsWith("Location") ? "leading-[13px]" : "leading-[15px]",
                  )}
                >
                  {v}
                </span>
              </div>
            ))}
          </div>
        </Modal>
      ) : null}
    </div>
  );
}
