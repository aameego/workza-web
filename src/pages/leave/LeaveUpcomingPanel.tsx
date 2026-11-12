import { CalendarDays } from "lucide-react";
import { Avatar, Badge, FilterSelect, cn } from "../../design-system";
import type { LeaveRequest } from "../../services/leaveService";
import {
  approverLabel,
  employeeFromRequest,
  formatLeaveDate,
  formatLeaveDateTime,
  formatLeaveDays,
  getLeaveTypeLabel,
} from "./leaveViewModel";
import { avatarTone } from "../../lib/avatarTone";

const leaveTypeBadge = (
  type?: string,
): "info" | "success" | "warning" | "neutral" => {
  const code = String(type || "").toUpperCase();
  if (code === "SL") return "warning";
  if (code === "CL") return "info";
  if (code === "EL") return "success";
  return "neutral";
};

export type LeaveUpcomingPanelProps = {
  items: LeaveRequest[];
  title?: string;
  /** Org/team list shows employee avatar + meta; self shows type-first rows. */
  variant?: "org" | "self";
  /** When true, show Select Month control (admin/team Figma). */
  showMonthFilter?: boolean;
  monthValue?: string;
  onMonthChange?: (value: string) => void;
  monthOptions?: Array<{ value: string; label: string }>;
};

export default function LeaveUpcomingPanel({
  items,
  title = "Upcoming Leaves (Next 7 Days)",
  variant = "org",
  showMonthFilter = false,
  monthValue = "",
  onMonthChange,
  monthOptions = [],
}: LeaveUpcomingPanelProps) {
  const isSelf = variant === "self";

  return (
    <section className="rounded-xl border border-[#dee2e6] bg-white p-4 shadow-[0px_2px_8px_0px_rgba(0,0,0,0.03)]">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <h2 className="m-0 text-[15px] font-semibold text-[#0a1f4a]">
          {title}
        </h2>
        {showMonthFilter ? (
          <FilterSelect
            size="sm"
            className="min-w-[108px]"
            icon={<CalendarDays size={12} aria-hidden className="shrink-0" />}
            value={monthValue}
            onChange={(e) => onMonthChange?.(e.target.value)}
            aria-label="Select month"
          >
            <option value="">Select Month</option>
            {monthOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </FilterSelect>
        ) : null}
      </div>

      {items.length === 0 ? (
        <p className="m-0 text-sm text-wz-text-secondary">
          No upcoming leaves in the next 7 days.
        </p>
      ) : (
        <ul className="m-0 list-none space-y-3 p-0">
          {items.map((item) => {
            const emp = employeeFromRequest(item);
            const typeLabel = getLeaveTypeLabel(item.leaveType).replace(
              /\s*\([^)]*\)\s*$/,
              "",
            );
            const dateRange = `${formatLeaveDate(item.startDate)} – ${formatLeaveDate(item.endDate)}`;
            const daysLabel = formatLeaveDays(item).replace(" · ", " ");
            const approver = approverLabel(item);
            const decided = item.decidedAt || item.approvedAt;
            const at = decided ? formatLeaveDateTime(decided) : "";

            if (isSelf) {
              return (
                <li
                  key={item._id}
                  className="flex flex-wrap items-center gap-3 border-b border-[#f1f3f5] pb-3 last:border-0 last:pb-0"
                >
                  <div className="min-w-0 flex-1">
                    <p className="m-0 text-sm font-semibold text-[#0a1f4a]">
                      {typeLabel}
                    </p>
                    <p className="m-0 text-xs text-wz-text-secondary">
                      {dateRange}
                    </p>
                  </div>
                  <span className="inline-flex rounded-md bg-[#eef4ff] px-2 py-0.5 text-xs font-semibold text-[#1f5da3]">
                    {String(item.days ?? "-")}d
                  </span>
                  <div className="min-w-[90px] text-right text-[11px] leading-tight text-wz-text-secondary">
                    <p className="m-0">By: {approver}</p>
                    {at ? <p className="m-0">At: {at}</p> : null}
                  </div>
                </li>
              );
            }

            return (
              <li
                key={item._id}
                className="flex flex-wrap items-center gap-2 border-b border-[#f1f3f5] pb-3 last:border-0 last:pb-0 sm:flex-nowrap"
              >
                <Avatar
                  initials={emp.initials}
                  size="sm"
                  className={cn("size-[26px] text-[10px]", avatarTone(emp.id || emp.name))}
                />
                <div className="min-w-0 w-[140px] shrink-0">
                  <p className="m-0 truncate text-sm font-semibold text-[#0a1f4a]">
                    {emp.name}
                  </p>
                  <p className="m-0 truncate text-[11px] text-wz-text-secondary">
                    {emp.employeeCode}
                    {emp.designation ? ` · ${emp.designation}` : ""}
                  </p>
                </div>
                <Badge status={leaveTypeBadge(item.leaveType)} size="sm">
                  {typeLabel}
                </Badge>
                <p className="m-0 min-w-[125px] flex-1 text-xs whitespace-nowrap text-[#0a1f4a]">
                  {dateRange} ({daysLabel.replace(/d$/, "d")})
                </p>
                <div className="ml-auto min-w-[90px] text-right text-[11px] leading-tight text-wz-text-secondary">
                  <p className="m-0">By: {approver}</p>
                  {at ? <p className="m-0">At: {at}</p> : null}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
