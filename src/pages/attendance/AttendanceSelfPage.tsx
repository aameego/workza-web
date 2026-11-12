import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useSearchParams } from "react-router-dom";
import { useAttendanceList } from "../../hooks/useAttendance";
import type { SessionUser } from "../../layouts/sessionUser";
import EmployeeAttendancePanel from "../employees/EmployeeAttendancePanel";
import AttendanceCheckInModal from "./AttendanceCheckInModal";
import AttendanceTodayCard from "./AttendanceTodayCard";
import { canSelfCheckIn } from "./attendanceAccess";
import { buildAttendanceListParams, normalizeAttendanceRow } from "./attendanceViewModel";

export type AttendanceSelfPageProps = {
  user: SessionUser | null;
  /** Manager tabs, shown left of the month picker. */
  leading?: ReactNode;
};

/** Figma attendance-employee (1:17610): month picker, six KPIs, today's check in/out, calendar, my attendance table. */
export default function AttendanceSelfPage({ user, leading }: AttendanceSelfPageProps) {
  const [today] = useState(() => new Date());
  const [checkMode, setCheckMode] = useState<"checkin" | "checkout" | null>(null);
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

  const todayParams = useMemo(
    () =>
      buildAttendanceListParams({
        target: "self",
        year: today.getFullYear(),
        month: today.getMonth() + 1,
        selectedDay: today.getDate(),
        page: 1,
        limit: 5,
      }),
    [today],
  );
  const todayQuery = useAttendanceList(todayParams, allowCheck);
  const todayRow = useMemo(() => {
    const raw = todayQuery.data?.rows?.[0];
    return raw ? normalizeAttendanceRow(raw) : null;
  }, [todayQuery.data?.rows]);

  return (
    <>
      <EmployeeAttendancePanel
        leading={leading}
        afterKpis={
          allowCheck ? (
            <AttendanceTodayCard
              today={today}
              row={todayRow}
              loading={todayQuery.isLoading}
              onCheck={setCheckMode}
            />
          ) : null
        }
      />
      <AttendanceCheckInModal
        open={checkMode != null}
        mode={checkMode || "checkin"}
        onClose={() => setCheckMode(null)}
      />
    </>
  );
}
