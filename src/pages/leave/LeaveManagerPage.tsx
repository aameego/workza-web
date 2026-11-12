import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { TabSwitcher } from "../../design-system";
import type { SessionUser } from "../../layouts/sessionUser";
import { canApplyLeave } from "./leaveAccess";
import LeaveAdminPage from "./LeaveAdminPage";
import LeavePageHeader from "./LeavePageHeader";
import LeaveSelfPage from "./LeaveSelfPage";

export type LeaveManagerPageProps = {
  user: SessionUser | null;
};

type ManagerTab = "my-data" | "my-team";

const now = new Date();

export default function LeaveManagerPage({ user }: LeaveManagerPageProps) {
  const navigate = useNavigate();
  const { vendorSlug } = useParams();
  const base = `/${vendorSlug || "app"}`;
  const showSelf = canApplyLeave(user);
  const [tab, setTab] = useState<ManagerTab>(
    showSelf ? "my-data" : "my-team",
  );
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);

  const shiftMonth = (delta: number) => {
    const d = new Date(year, month - 1 + delta, 1);
    setYear(d.getFullYear());
    setMonth(d.getMonth() + 1);
  };

  return (
    <div className="space-y-4">
      <LeavePageHeader
        year={year}
        month={month}
        onShiftMonth={shiftMonth}
        showPolicy
        onViewPolicy={() => navigate(`${base}/leave/policy`)}
        leading={
          <TabSwitcher
            aria-label="Leave view"
            value={tab}
            onChange={setTab}
            items={[
              ...(showSelf ? [{ value: "my-data" as const, label: "My Data" }] : []),
              { value: "my-team" as const, label: "My Team" },
            ]}
          />
        }
      />

      {tab === "my-data" && showSelf ? (
        <LeaveSelfPage user={user} embedded hideHeader />
      ) : (
        <LeaveAdminPage
          user={user}
          embedded
          teamScope
          hideHeader
        />
      )}
    </div>
  );
}
