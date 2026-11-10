import { useState } from "react";
import { cn } from "../../design-system";
import type { SessionUser } from "../../layouts/sessionUser";
import { canApplyLeave } from "./leaveAccess";
import LeaveAdminPage from "./LeaveAdminPage";
import LeaveSelfPage from "./LeaveSelfPage";

export type LeaveManagerPageProps = {
  user: SessionUser | null;
};

type ManagerTab = "my-data" | "my-team";

const tabClass = (active: boolean) =>
  cn(
    "inline-flex h-[34px] cursor-pointer items-center rounded-wz-full border px-3.5 text-sm font-semibold",
    active
      ? "border-wz-primary bg-wz-hover text-wz-primary"
      : "border-wz-border bg-white text-wz-text-secondary hover:bg-wz-neutral-50",
  );

export default function LeaveManagerPage({ user }: LeaveManagerPageProps) {
  const showSelf = canApplyLeave(user);
  const [tab, setTab] = useState<ManagerTab>(
    showSelf ? "my-data" : "my-team",
  );

  return (
    <div className="space-y-wz-5">
      <div>
        <h1 className="m-0 text-xl font-semibold text-wz-text-primary">Leave</h1>
        <p className="m-0 mt-1 text-sm text-wz-text-secondary">
          Manage your leave and review your team&apos;s requests.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {showSelf ? (
          <button
            type="button"
            className={tabClass(tab === "my-data")}
            onClick={() => setTab("my-data")}
          >
            My Data
          </button>
        ) : null}
        <button
          type="button"
          className={tabClass(tab === "my-team")}
          onClick={() => setTab("my-team")}
        >
          My Team
        </button>
      </div>

      {tab === "my-data" && showSelf ? (
        <LeaveSelfPage user={user} embedded />
      ) : (
        <LeaveAdminPage
          user={user}
          embedded
          teamScope
          title="Leave"
        />
      )}
    </div>
  );
}
