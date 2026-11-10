import { readSessionUser } from "../../layouts/sessionUser";
import LeaveAdminPage from "./LeaveAdminPage";
import LeaveManagerPage from "./LeaveManagerPage";
import LeaveSelfPage from "./LeaveSelfPage";
import { resolveLeaveViewMode } from "./leaveAccess";

export default function LeavePage() {
  const user = readSessionUser();
  const mode = resolveLeaveViewMode(user);

  if (mode === "admin") {
    return <LeaveAdminPage user={user} />;
  }

  if (mode === "manager") {
    return <LeaveManagerPage user={user} />;
  }

  if (mode === "employee") {
    return <LeaveSelfPage user={user} />;
  }

  return (
    <section className="rounded-wz-xl border border-wz-border bg-white p-wz-6">
      <h1 className="m-0 text-lg font-semibold text-wz-text-primary">Leave</h1>
      <p className="m-0 mt-2 text-sm text-wz-text-secondary">
        You do not have access to leave for this account. Ask an admin to link
        your employee profile or grant leave permissions.
      </p>
    </section>
  );
}
