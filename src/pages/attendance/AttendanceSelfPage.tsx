import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { LogIn, LogOut } from "lucide-react";
import { Badge, Button, cn } from "../../design-system";
import { useAttendanceList, useAttendanceMonth } from "../../hooks/useAttendance";
import { ApiError } from "../../lib/apiClient";
import type { SessionUser } from "../../layouts/sessionUser";
import { monthLabel } from "../employees/attendanceCalendar";
import AttendanceCheckInModal from "./AttendanceCheckInModal";
import AttendanceOrgCalendar from "./AttendanceOrgCalendar";
import {
  ATTENDANCE_STATUS_COLORS,
  buildAttendanceListParams,
  buildOrgCalendarCells,
  dateIsoForDay,
  normalizeAttendanceRow,
  selfMonthMetrics,
} from "./attendanceViewModel";
import { canSelfCheckIn } from "./attendanceAccess";

export type AttendanceSelfPageProps = {
  user: SessionUser | null;
  /** Hide page title when embedded under manager tabs. */
  embedded?: boolean;
};

export default function AttendanceSelfPage({
  user,
  embedded = false,
}: AttendanceSelfPageProps) {
  const [today] = useState(() => new Date());
  const [year, setYear] = useState(() => today.getFullYear());
  const [month, setMonth] = useState(() => today.getMonth() + 1);
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [checkMode, setCheckMode] = useState<"checkin" | "checkout" | null>(
    null,
  );
  const [searchParams, setSearchParams] = useSearchParams();

  const allowCheck = canSelfCheckIn(user);

  useEffect(() => {
    if (!allowCheck) return;
    const action = searchParams.get("action");
    if (action === "checkin" || action === "checkout") {
      setCheckMode(action);
      const next = new URLSearchParams(searchParams);
      next.delete("action");
      setSearchParams(next, { replace: true });
    }
  }, [allowCheck, searchParams, setSearchParams]);
  const todayYear = today.getFullYear();
  const todayMonth = today.getMonth() + 1;
  const todayDay = today.getDate();

  const monthQuery = useAttendanceMonth(year, month, { target: "self" }, true);
  const todayParams = useMemo(
    () =>
      buildAttendanceListParams({
        target: "self",
        year: todayYear,
        month: todayMonth,
        selectedDay: todayDay,
        page: 1,
        limit: 5,
      }),
    [todayYear, todayMonth, todayDay],
  );
  const todayQuery = useAttendanceList(todayParams, allowCheck);

  const metrics = useMemo(
    () => selfMonthMetrics(monthQuery.data?.stats),
    [monthQuery.data?.stats],
  );

  const cells = useMemo(
    () => buildOrgCalendarCells(year, month, monthQuery.data, selectedDay),
    [year, month, monthQuery.data, selectedDay],
  );

  const todayRow = useMemo(() => {
    const raw = todayQuery.data?.rows?.[0];
    return raw ? normalizeAttendanceRow(raw) : null;
  }, [todayQuery.data?.rows]);

  const selectedEntries = useMemo(() => {
    if (selectedDay == null) return [];
    const key = String(selectedDay);
    const entries =
      monthQuery.data?.dayRecords?.[selectedDay] ||
      monthQuery.data?.dayRecords?.[key] ||
      [];
    return entries.map(normalizeAttendanceRow);
  }, [monthQuery.data?.dayRecords, selectedDay]);

  const shiftMonth = (delta: number) => {
    const d = new Date(year, month - 1 + delta, 1);
    setYear(d.getFullYear());
    setMonth(d.getMonth() + 1);
    setSelectedDay(null);
  };

  const isCheckedIn = Boolean(todayRow?.isCheckedIn);
  const statusColors =
    ATTENDANCE_STATUS_COLORS[todayRow?.status || ""] ||
    ATTENDANCE_STATUS_COLORS["Not Marked"];

  return (
    <div className="space-y-wz-5">
      {!embedded ? (
        <div>
          <h1 className="m-0 text-xl font-semibold text-wz-text-primary">
            Attendance
          </h1>
          <p className="m-0 mt-1 text-sm text-wz-text-secondary">
            Your attendance for {monthLabel(year, month)}.
          </p>
        </div>
      ) : null}

      {monthQuery.isError ? (
        <p className="m-0 text-sm text-wz-error" role="alert">
          {monthQuery.error instanceof ApiError
            ? monthQuery.error.message
            : "Could not load attendance."}
        </p>
      ) : null}

      <div className="grid grid-cols-2 gap-wz-3 sm:grid-cols-3 xl:grid-cols-6">
        {metrics.map((m) => (
          <div
            key={m.label}
            className="rounded-wz-xl border border-wz-border bg-white px-wz-4 py-wz-3"
          >
            <p className="m-0 text-xs font-semibold text-wz-text-secondary">
              {m.label}
            </p>
            <p className="m-0 mt-1 text-xl font-bold text-wz-text-primary">
              {m.value}
            </p>
          </div>
        ))}
      </div>

      {allowCheck ? (
        <section className="rounded-wz-xl border border-wz-border bg-white p-wz-5">
          <div className="flex flex-wrap items-start justify-between gap-wz-3">
            <div>
              <h2 className="m-0 text-base font-semibold text-wz-text-primary">
                Today&apos;s Attendance
              </h2>
              <p className="m-0 mt-1 text-xs text-wz-text-secondary">
                {dateIsoForDay(todayYear, todayMonth, todayDay)}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="primary"
                disabled={isCheckedIn || todayQuery.isLoading}
                onClick={() => setCheckMode("checkin")}
              >
                <LogIn className="size-4" aria-hidden />
                Check In
              </Button>
              <Button
                type="button"
                variant="secondary"
                disabled={!isCheckedIn || todayQuery.isLoading}
                onClick={() => setCheckMode("checkout")}
              >
                <LogOut className="size-4" aria-hidden />
                Check Out
              </Button>
            </div>
          </div>

          <div className="mt-wz-4 grid grid-cols-2 gap-wz-3 sm:grid-cols-4">
            <div>
              <p className="m-0 text-xs text-wz-text-secondary">Status</p>
              <Badge className={cn("mt-1", statusColors?.bg, statusColors?.text)}>
                {todayRow?.status || "Not Marked"}
              </Badge>
            </div>
            <div>
              <p className="m-0 text-xs text-wz-text-secondary">Check In</p>
              <p className="m-0 mt-1 font-semibold text-wz-text-primary">
                {todayRow?.checkIn || "—"}
              </p>
            </div>
            <div>
              <p className="m-0 text-xs text-wz-text-secondary">Check Out</p>
              <p className="m-0 mt-1 font-semibold text-wz-text-primary">
                {todayRow?.checkOut || "—"}
              </p>
            </div>
            <div>
              <p className="m-0 text-xs text-wz-text-secondary">Hours</p>
              <p className="m-0 mt-1 font-semibold text-wz-text-primary">
                {todayRow?.hours || "—"}
              </p>
            </div>
          </div>
        </section>
      ) : null}

      <AttendanceOrgCalendar
        monthLabel={monthLabel(year, month)}
        subtitle="(My calendar)"
        cells={cells}
        onPrev={() => shiftMonth(-1)}
        onNext={() => shiftMonth(1)}
        onSelectDay={(day) =>
          setSelectedDay((prev) => (prev === day ? null : day))
        }
      />

      {selectedDay != null ? (
        <section className="rounded-wz-xl border border-wz-border bg-white p-wz-5">
          <h2 className="m-0 text-base font-semibold text-wz-text-primary">
            {dateIsoForDay(year, month, selectedDay)}
          </h2>
          {selectedEntries.length === 0 ? (
            <p className="m-0 mt-2 text-sm text-wz-text-secondary">
              No attendance recorded for this day.
            </p>
          ) : (
            <ul className="m-0 mt-3 list-none space-y-2 p-0">
              {selectedEntries.map((row) => (
                <li
                  key={row.rowKey}
                  className="rounded-wz-md border border-wz-border px-wz-3 py-wz-2 text-sm"
                >
                  <span className="font-semibold text-wz-text-primary">
                    {row.status || "—"}
                  </span>
                  <span className="text-wz-text-secondary">
                    {" "}
                    · In {row.checkIn || "—"} · Out {row.checkOut || "—"}
                    {row.hours ? ` · ${row.hours}` : ""}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      ) : null}

      <AttendanceCheckInModal
        open={checkMode != null}
        mode={checkMode || "checkin"}
        onClose={() => setCheckMode(null)}
      />
    </div>
  );
}
