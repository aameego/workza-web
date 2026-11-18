import type { ReactNode } from "react";
import { Modal } from "../../design-system";
import type { LeaveRequest } from "../../services/leaveService";
import {
  approverLabel,
  employeeFromRequest,
  formatLeaveDate,
  formatLeaveDateTime,
  getLeaveTypeLabel,
} from "./leaveViewModel";

const STATUS_TEXT: Record<string, string> = {
  Approved: "bg-[#ecfdf3] text-[#12b76a]",
  Pending: "bg-[#fffaeb] text-[#f79009]",
  Rejected: "bg-[#fef3f2] text-[#d92d20]",
  Cancelled: "bg-wz-neutral-100 text-wz-text-muted",
};

/**
 * Figma "View Details" (173:50699): the mobile leave table keeps five columns,
 * the eye icon opens this sheet with the rest — contact, duration, reason,
 * approver — plus the row actions.
 */
export default function LeaveDetailsSheet({
  request,
  showEmployee,
  actions,
  onClose,
}: {
  request: LeaveRequest | null;
  showEmployee: boolean;
  actions?: ReactNode;
  onClose: () => void;
}) {
  if (!request) return null;
  const emp = employeeFromRequest(request);
  const typeCode = request.isCoCredit ? "CO" : String(request.leaveType || "-").toUpperCase();
  const typeName = getLeaveTypeLabel(request.leaveType).replace(/\s*\([^)]*\)\s*$/, "").trim();
  const decidedAt = request.decidedAt || request.approvedAt || request.rejectedAt;
  const rows: [string, ReactNode][] = [
    ["Request Type", `${typeCode}${typeName ? ` (${typeName})` : ""}`],
    ...(showEmployee
      ? ([
          [
            "Contact",
            <>
              <span className="block">{emp.email && emp.email !== "-" ? emp.email : "-"}</span>
              <span className="mt-1 block text-wz-text-muted">{emp.phone && emp.phone !== "-" ? emp.phone : "-"}</span>
            </>,
          ],
        ] as [string, ReactNode][])
      : []),
    ["Dates  (Start - End)", `${formatLeaveDate(request.startDate)} - ${formatLeaveDate(request.endDate)}`],
    ["Duration  (in Days)", String(request.days ?? "-")],
    ["Request Reason", request.reason || "-"],
    [
      "Approved By (RM/HR/Admin)",
      <>
        <span className="block">{approverLabel(request)}</span>
        <span className="mt-1 block text-wz-text-muted">{decidedAt ? formatLeaveDateTime(decidedAt) : "-"}</span>
      </>,
    ],
    [
      "Status",
      <span className={`inline-flex rounded-[6px] px-2 py-1 text-[8px] leading-[10px] ${STATUS_TEXT[request.status || ""] || "bg-wz-neutral-100 text-wz-heading"}`}>
        {request.status || "-"}
      </span>,
    ],
  ];
  return (
    <Modal open title="View Details" onClose={onClose}>
      <div className="flex flex-col gap-3 pt-0.5">
        {showEmployee ? (
          <div className="flex flex-col gap-1.5">
            <p className="m-0 text-sm leading-[18px] text-wz-heading">{emp.name}</p>
            <p className="m-0 text-[11px] leading-[14px] text-wz-text-muted">{emp.employeeCode}</p>
            {emp.designation ? <p className="m-0 text-[11px] leading-[14px] text-wz-text-muted">{emp.designation}</p> : null}
          </div>
        ) : null}
        {rows.map(([label, value]) => (
          <div key={label} className="flex items-start gap-3">
            <span className="w-[92px] shrink-0 text-[10px] leading-[13px] font-semibold whitespace-pre-wrap text-[#495057]">
              {label}
            </span>
            <span className="min-w-0 flex-1 text-xs leading-[15px] break-words text-wz-heading">{value}</span>
          </div>
        ))}
        {actions ? (
          <div className="flex items-center gap-3">
            <span className="w-[92px] shrink-0 text-[10px] leading-[13px] font-semibold text-[#495057]">Actions</span>
            <div className="flex flex-1 items-center gap-2">{actions}</div>
          </div>
        ) : null}
      </div>
    </Modal>
  );
}
