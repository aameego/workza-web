import { useState } from "react";
import { cn } from "../../design-system";
import { useRegularizationDashboard } from "../../hooks/useRegularization";
import { readSessionUser } from "../../layouts/sessionUser";
import { canDirectEditAttendance } from "../attendance/attendanceAccess";
import { RegularizationConfig } from "./RegularizationConfig";
import { RegularizationDirectEdit } from "./RegularizationDirectEdit";
import { RegularizationRequests } from "./RegularizationRequests";
import type { RegTab } from "./regularizationViewModel";

/**
 * Figma "Workza — Regularization" (288:157989 web, 288:158827 mobile):
 * summary cards, a scrollable tab bar, then the active panel.
 */
export default function RegularizationPage() {
  const user = readSessionUser();
  const dashboard = useRegularizationDashboard();
  const counts = dashboard.data?.counts || {};
  const canApprove = Boolean(dashboard.data?.canApprove);
  const isAdminOrHr = user?.role === "Admin" || user?.role === "HR";

  // Tabs follow what the backend allows: approve needs regularization:approve,
  // direct edit needs Admin/HR or the edit permission, config is Admin/HR only.
  const tabs: { value: RegTab; label: string; count?: number }[] = [
    { value: "all", label: "All requests" },
    ...(canApprove
      ? [
          { value: "pending" as const, label: "Pending approvals", count: counts.awaitingApproval },
          { value: "approved" as const, label: "Approved this month" },
        ]
      : []),
    ...(canDirectEditAttendance(user) ? [{ value: "direct" as const, label: "Direct edit" }] : []),
    ...(isAdminOrHr ? [{ value: "config" as const, label: "Configuration" }] : []),
  ];
  const [picked, setPicked] = useState<RegTab>("all");
  const tab = tabs.some((t) => t.value === picked) ? picked : "all";

  const cards = [
    { label: "All requests", value: counts.allRequests },
    { label: "All pending", value: counts.awaitingApproval },
    { label: "Approved this month", value: counts.approvedThisMonth },
  ];

  return (
    <div className="flex flex-col gap-5 max-md:gap-4">
      {isAdminOrHr ? <p className="m-0 text-[13px] leading-[18px] font-semibold text-wz-primary">Admin workspace</p> : null}

      {/* Figma Regularization summary: 3 cards, 24px semibold value over 11px muted label; mobile 2 + 1 */}
      <div className="grid grid-cols-3 gap-3 max-md:grid-cols-2">
        {cards.map((c, i) => (
          <div
            key={c.label}
            className={cn(
              "flex flex-col gap-1 rounded-[8px] border border-[#dde3eb] bg-white p-4",
              i === 2 && "max-md:col-span-2",
            )}
          >
            <span className="text-2xl leading-9 font-semibold text-wz-heading">{dashboard.isLoading ? "—" : (c.value ?? 0)}</span>
            <span className="text-[11px] leading-[17px] text-wz-text-secondary">{c.label}</span>
          </div>
        ))}
      </div>

      {/* Figma tab bar: #ebf0f6 track, 4px inset, white active tab with primary semibold text; scrolls on mobile */}
      <div role="tablist" aria-label="Regularization sections" className="flex gap-2 overflow-x-auto rounded-[6px] bg-[#ebf0f6] p-1 [scrollbar-width:none]">
        {tabs.map((t) => {
          const active = t.value === tab;
          return (
            <button
              key={t.value}
              type="button"
              role="tab"
              aria-selected={active}
              className={cn(
                "h-9 min-w-[140px] shrink-0 cursor-pointer rounded-[4px] border-0 px-3 text-xs leading-[18px] whitespace-nowrap",
                active ? "bg-white font-semibold text-wz-primary" : "bg-transparent text-wz-text-secondary hover:text-wz-heading",
              )}
              onClick={() => setPicked(t.value)}
            >
              {t.label}
              {t.count ? <span className="ml-1.5">{t.count}</span> : null}
            </button>
          );
        })}
      </div>

      {tab === "direct" ? (
        <RegularizationDirectEdit />
      ) : tab === "config" ? (
        <RegularizationConfig />
      ) : (
        // Keyed so each tab starts with its own filters and page.
        <RegularizationRequests key={tab} tab={tab} canApprove={canApprove} />
      )}
    </div>
  );
}
