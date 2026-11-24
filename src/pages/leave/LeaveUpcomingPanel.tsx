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
    <section className="rounded-xl border border-[#dee2e6] bg-white p-4 shadow-[0px_2px_8px_0px_rgba(0,0,0,0.03)] max-md:rounded-lg max-md:shadow-none">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <h2 className="m-0 text-sm leading-5 font-bold text-[#0a1f4a]">
          {title}
        </h2>
        {showMonthFilter ? (
          <FilterSelect
            size="sm"
            className="min-w-[108px] max-md:hidden [&>span]:text-[10px] [&>span]:leading-none"
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
        <ul className="m-0 list-none space-y-3 p-0 max-md:space-y-4">
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
                  className="flex flex-wrap items-center gap-3 border-b border-[#f1f3f5] pb-3 last:border-0 last:pb-0 max-md:block max-md:border-0 max-md:pb-0"
                >
                  {/* Figma mobile (173:51640): type + (days) and dates, then By / At */}
                  <div className="flex flex-col gap-1 md:hidden">
                    <div className="flex items-center gap-1">
                      <div className="flex min-w-0 flex-1 items-center gap-2.5 whitespace-nowrap">
                        <span className="text-xs leading-[14px] font-semibold text-[#0a1f4a]">
                          {typeLabel}
                        </span>
                        <span className="text-[11px] leading-3 font-bold text-[#1f5da3]">
                          ({String(item.days ?? "-")}d)
                        </span>
                      </div>
                      <span className="min-w-0 flex-1 text-right text-[11px] leading-3 text-wz-text-muted">
                        {dateRange}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 text-[11px] leading-[normal]">
                      <p className="m-0 min-w-0 flex-1 text-[#0a1f4a]">
                        <span className="font-semibold">By: </span>
                        {approver}
                      </p>
                      <p className="m-0 min-w-0 flex-1 text-right text-wz-text-muted">
                        <span className="font-semibold">At:</span> {at || "-"}
                      </p>
                    </div>
                  </div>
                  <div className="contents max-md:hidden">
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
                  </div>
                </li>
              );
            }

            return (
              <li
                key={item._id}
                className="border-b border-[#f1f3f5] pb-3 last:border-0 last:pb-0 max-md:border-0 max-md:pb-0"
              >
                {/* Mobile (Figma 173:50878): name + type / dates, then By · At */}
                <div className="flex flex-col gap-1 text-[11px] md:hidden">
                  <div className="flex items-center gap-1">
                    <div className="flex min-w-0 flex-1 flex-col gap-1">
                      <p className="m-0 leading-[14px] font-semibold text-wz-heading">
                        {emp.name}
                        {emp.employeeCode ? ` (${emp.employeeCode})` : ""}
                      </p>
                      {emp.designation ? (
                        <p className="m-0 leading-3 text-wz-text-muted">
                          {emp.designation}
                        </p>
                      ) : null}
                    </div>
                    <div className="flex min-w-0 flex-1 flex-col items-end gap-1 text-right">
                      <p className="m-0 leading-[14px] text-[#0ea5e9]">
                        {typeLabel}
                      </p>
                      <p className="m-0 leading-[14px] text-wz-text-muted">
                        {dateRange} ({daysLabel})
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-1 leading-[normal]">
                    <p className="m-0 min-w-0 flex-1 text-wz-heading">
                      <span className="font-semibold">By: </span>
                      {approver}
                    </p>
                    {at ? (
                      <p className="m-0 min-w-0 flex-1 text-right text-wz-text-muted">
                        <span className="font-semibold">At: </span>
                        {at}
                      </p>
                    ) : null}
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2 sm:flex-nowrap max-md:hidden">
                  <Avatar
                    initials={emp.initials}
                    size="sm"
                    className={cn(
                      "size-[26px] text-[10px]",
                      avatarTone(emp.id || emp.name),
                    )}
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
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
