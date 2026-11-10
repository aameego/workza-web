import type { LeaveRequest } from "../../services/leaveService";
import {
  employeeFromRequest,
  formatLeaveDate,
  formatLeaveDateTime,
  formatLeaveDays,
  getLeaveTypeLabel,
} from "./leaveViewModel";

export type LeaveUpcomingPanelProps = {
  items: LeaveRequest[];
  title?: string;
  showEmployee?: boolean;
};

export default function LeaveUpcomingPanel({
  items,
  title = "Upcoming Leaves (Next 7 Days)",
  showEmployee = true,
}: LeaveUpcomingPanelProps) {
  return (
    <section className="rounded-wz-xl border border-wz-border bg-white p-wz-5">
      <h2 className="m-0 text-base font-semibold text-wz-text-primary">{title}</h2>
      {items.length === 0 ? (
        <p className="m-0 mt-wz-3 text-sm text-wz-text-secondary">
          No upcoming leaves in the next 7 days.
        </p>
      ) : (
        <ul className="m-0 mt-wz-3 list-none space-y-3 p-0">
          {items.map((item) => {
            const emp = employeeFromRequest(item);
            return (
              <li
                key={item._id}
                className="rounded-wz-md border border-wz-border px-wz-3 py-wz-3"
              >
                <div className="flex items-start gap-3">
                  {showEmployee ? (
                    <span className="inline-flex size-9 shrink-0 items-center justify-center rounded-full bg-wz-primary text-[11px] font-bold text-white">
                      {emp.initials}
                    </span>
                  ) : null}
                  <div className="min-w-0 flex-1">
                    {showEmployee ? (
                      <p className="m-0 truncate text-sm font-semibold text-wz-text-primary">
                        {emp.name}{" "}
                        <span className="font-normal text-wz-text-secondary">
                          · {emp.employeeCode}
                        </span>
                      </p>
                    ) : null}
                    <div className="mt-1 flex flex-wrap items-center gap-2 text-xs">
                      <span className="rounded-wz-full bg-[#eff8ff] px-2 py-0.5 font-semibold text-[#175cd3]">
                        {getLeaveTypeLabel(item.leaveType)}
                      </span>
                      <span className="text-wz-text-secondary">
                        {formatLeaveDate(item.startDate)} –{" "}
                        {formatLeaveDate(item.endDate)}
                      </span>
                      <span className="rounded-wz-md bg-wz-hover px-1.5 py-0.5 font-semibold text-wz-primary">
                        {formatLeaveDays(item)}
                      </span>
                    </div>
                    <p className="m-0 mt-1 text-[11px] text-wz-text-secondary">
                      By:{" "}
                      {typeof item.approvedBy === "object"
                        ? item.approvedBy?.name || "—"
                        : "—"}
                      {item.approvedAt
                        ? ` · ${formatLeaveDateTime(item.approvedAt)}`
                        : ""}
                    </p>
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
