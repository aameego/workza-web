import { readSessionUser } from "../../layouts/sessionUser";
import AttendanceAdminPage from "./AttendanceAdminPage";
import AttendanceManagerPage from "./AttendanceManagerPage";
import AttendanceSelfPage from "./AttendanceSelfPage";
import { resolveAttendanceViewMode } from "./attendanceAccess";

export default function AttendancePage() {
  const user = readSessionUser();
  const mode = resolveAttendanceViewMode(user);

  if (mode === "admin") {
    return <AttendanceAdminPage user={user} listTarget="org" />;
  }

  if (mode === "manager") {
    return <AttendanceManagerPage user={user} />;
  }

  if (mode === "employee") {
    return <AttendanceSelfPage user={user} />;
  }

  return (
    <section className="rounded-wz-xl border border-wz-border bg-white p-wz-6">
      <h1 className="m-0 text-lg font-semibold text-wz-text-primary">
        Attendance
      </h1>
      <p className="m-0 mt-2 text-sm text-wz-text-secondary">
        You do not have access to attendance for this account. Ask an admin to
        link your employee profile or grant attendance permissions.
      </p>
    </section>
  );
}
