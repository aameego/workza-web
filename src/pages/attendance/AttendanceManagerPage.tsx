import { useState } from "react";
import { TabSwitcher } from "../../design-system";
import type { SessionUser } from "../../layouts/sessionUser";
import AttendanceAdminPage from "./AttendanceAdminPage";
import AttendanceSelfPage from "./AttendanceSelfPage";
import { canSelfCheckIn, canViewOrgAttendance } from "./attendanceAccess";

export type AttendanceManagerPageProps = {
  user: SessionUser | null;
};

type ManagerTab = "my-data" | "my-team" | "organisation";

/** Figma attendance-manager-self / -team: My Data | My Team (+ Organisation with view-org) left of the month picker. */
export default function AttendanceManagerPage({ user }: AttendanceManagerPageProps) {
  const showSelf = canSelfCheckIn(user);
  const showOrg = canViewOrgAttendance(user);
  const [tab, setTab] = useState<ManagerTab>(showSelf ? "my-data" : "my-team");
  const tabs = (
    <TabSwitcher
      aria-label="Attendance view"
      value={tab}
      onChange={setTab}
      items={[
        ...(showSelf ? [{ value: "my-data" as const, label: "My Data" }] : []),
        { value: "my-team" as const, label: "My Team" },
        ...(showOrg ? [{ value: "organisation" as const, label: "Organisation" }] : []),
      ]}
    />
  );

  if (tab === "organisation" && showOrg) {
    return <AttendanceAdminPage key="org" user={user} listTarget="org" leading={tabs} />;
  }
  return tab === "my-data" && showSelf ? (
    <AttendanceSelfPage user={user} leading={tabs} />
  ) : (
    <AttendanceAdminPage key="team" user={user} listTarget="team" calendarSubtitle="(My Team)" leading={tabs} />
  );
}
