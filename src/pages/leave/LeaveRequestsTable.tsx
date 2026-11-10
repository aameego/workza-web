import { Check, Pencil, X } from "lucide-react";
import { Badge, Button, cn, Input, Select } from "../../design-system";
import type { LeaveRequest } from "../../services/leaveService";
import {
  STATUS_TABS,
  approverLabel,
  employeeFromRequest,
  formatLeaveDate,
  formatLeaveDateTime,
  formatLeaveDays,
  getLeaveTypeLabel,
  statusTabCounts,
} from "./leaveViewModel";

const statusBadge = (
  status?: string,
): "success" | "warning" | "error" | "neutral" => {
  if (status === "Approved") return "success";
  if (status === "Pending") return "warning";
  if (status === "Rejected") return "error";
  return "neutral";
};

export type LeaveRequestsTableProps = {
  title?: string;
  rows: LeaveRequest[];
  search: string;
  onSearchChange: (value: string) => void;
  requestType: string;
  onRequestTypeChange: (value: string) => void;
  status: string;
  onStatusChange: (value: string) => void;
  showEmployee?: boolean;
  canApprove?: boolean;
  canEdit?: boolean;
  canCancel?: boolean;
  onApprove?: (row: LeaveRequest) => void;
  onReject?: (row: LeaveRequest) => void;
  onCancel?: (row: LeaveRequest) => void;
  onEdit?: (row: LeaveRequest) => void;
  onCreate?: () => void;
  createLabel?: string;
  loading?: boolean;
  emptyMessage?: string;
  page?: number;
  total?: number;
  pageSize?: number;
  onPageChange?: (page: number) => void;
};

export default function LeaveRequestsTable({
  title = "Leave Requests",
  rows,
  search,
  onSearchChange,
  requestType,
  onRequestTypeChange,
  status,
  onStatusChange,
  showEmployee = true,
  canApprove,
  canEdit,
  canCancel,
  onApprove,
  onReject,
  onCancel,
  onEdit,
  onCreate,
  createLabel = "+ Create Request",
  loading,
  emptyMessage = "No leave requests found.",
  page = 1,
  total,
  pageSize = 10,
  onPageChange,
}: LeaveRequestsTableProps) {
  const counts = statusTabCounts(rows);
  const totalCount = total ?? rows.length;
  const from = totalCount === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, totalCount);
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));

  return (
    <section className="rounded-wz-xl border border-wz-border bg-white p-wz-5">
      <div className="mb-wz-4 flex flex-wrap items-center justify-between gap-3">
        <h2 className="m-0 text-base font-semibold text-wz-text-primary">
          {title}
        </h2>
        {onCreate ? (
          <Button type="button" variant="primary" size="sm" onClick={onCreate}>
            {createLabel}
          </Button>
        ) : null}
      </div>

      <div className="mb-wz-4 flex flex-wrap items-center gap-3">
        <Input
          className="min-w-[220px] flex-1"
          placeholder="Search by employees name or code..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
        />
        <Select
          className="w-[180px]"
          value={requestType}
          onChange={(e) => onRequestTypeChange(e.target.value)}
          aria-label="Request type"
        >
          <option value="">Request Type</option>
          <option value="CL">Casual Leave (CL)</option>
          <option value="SL">Sick Leave (SL)</option>
          <option value="EL">Earned Leave (EL)</option>
          <option value="CO">Comp Off (CO)</option>
          <option value="WFH">Work From Home</option>
          <option value="LOP">Loss of Pay</option>
        </Select>
      </div>

      <div className="mb-wz-4 flex flex-wrap gap-2">
        {STATUS_TABS.map((tab) => {
          const count =
            tab.value === ""
              ? counts[""]
              : tab.value === "Cancelled"
                ? (counts.Cancelled || 0) + (counts.Rejected || 0)
                : counts[tab.value] || 0;
          const active =
            status === tab.value ||
            (tab.value === "Cancelled" &&
              (status === "Cancelled" || status === "Rejected"));
          return (
            <button
              key={tab.value || "all"}
              type="button"
              className={cn(
                "inline-flex h-8 cursor-pointer items-center rounded-wz-full border px-3 text-xs font-semibold",
                active
                  ? "border-wz-primary bg-wz-hover text-wz-primary"
                  : "border-wz-border bg-white text-wz-text-secondary hover:bg-wz-neutral-50",
              )}
              onClick={() => onStatusChange(tab.value)}
            >
              {tab.label} ({count})
            </button>
          );
        })}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[960px] border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-wz-border text-xs uppercase tracking-wide text-wz-text-secondary">
              {showEmployee ? <th className="px-2 py-3 font-semibold">Employee</th> : null}
              <th className="px-2 py-3 font-semibold">Request Type</th>
              {showEmployee ? <th className="px-2 py-3 font-semibold">Contact</th> : null}
              <th className="px-2 py-3 font-semibold">Dates (Start – End)</th>
              <th className="px-2 py-3 font-semibold">Duration</th>
              <th className="px-2 py-3 font-semibold">Request Reason</th>
              <th className="px-2 py-3 font-semibold">Approved By</th>
              <th className="px-2 py-3 font-semibold">Status</th>
              <th className="px-2 py-3 font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td
                  colSpan={showEmployee ? 9 : 7}
                  className="px-2 py-8 text-center text-wz-text-secondary"
                >
                  Loading requests…
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td
                  colSpan={showEmployee ? 9 : 7}
                  className="px-2 py-8 text-center text-wz-text-secondary"
                >
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              rows.map((row) => {
                const emp = employeeFromRequest(row);
                const pending = row.status === "Pending";
                return (
                  <tr
                    key={row._id}
                    className="border-b border-wz-border align-top last:border-0"
                  >
                    {showEmployee ? (
                      <td className="px-2 py-3">
                        <div className="flex items-center gap-2">
                          <span className="inline-flex size-8 shrink-0 items-center justify-center rounded-full bg-wz-primary text-[10px] font-bold text-white">
                            {emp.initials}
                          </span>
                          <div className="min-w-0">
                            <p className="m-0 truncate font-semibold text-wz-text-primary">
                              {emp.name}
                            </p>
                            <p className="m-0 text-xs text-wz-text-secondary">
                              {emp.employeeCode}
                            </p>
                          </div>
                        </div>
                      </td>
                    ) : null}
                    <td className="px-2 py-3">
                      <p className="m-0 font-semibold text-wz-text-primary">
                        {row.isCoCredit
                          ? "CO (Credit)"
                          : String(row.leaveType || "—").toUpperCase()}
                      </p>
                      <p className="m-0 text-xs text-wz-text-secondary">
                        {getLeaveTypeLabel(row.leaveType)}
                      </p>
                    </td>
                    {showEmployee ? (
                      <td className="px-2 py-3 text-xs text-wz-text-secondary">
                        <p className="m-0 truncate">{emp.email}</p>
                        <p className="m-0">{emp.phone}</p>
                      </td>
                    ) : null}
                    <td className="px-2 py-3 whitespace-nowrap text-wz-text-primary">
                      {formatLeaveDate(row.startDate)} –{" "}
                      {formatLeaveDate(row.endDate)}
                    </td>
                    <td className="px-2 py-3 whitespace-nowrap">
                      {formatLeaveDays(row)}
                    </td>
                    <td className="max-w-[180px] px-2 py-3 text-wz-text-secondary">
                      <span className="line-clamp-2">{row.reason || "—"}</span>
                    </td>
                    <td className="px-2 py-3 text-xs">
                      <p className="m-0 font-medium text-wz-text-primary">
                        {approverLabel(row)}
                      </p>
                      {row.approvedAt || row.rejectedAt ? (
                        <p className="m-0 text-wz-text-secondary">
                          {formatLeaveDateTime(row.approvedAt || row.rejectedAt)}
                        </p>
                      ) : null}
                    </td>
                    <td className="px-2 py-3">
                      <Badge status={statusBadge(row.status)} size="sm">
                        {row.status || "—"}
                      </Badge>
                    </td>
                    <td className="px-2 py-3">
                      <div className="flex items-center gap-1">
                        {canEdit && onEdit ? (
                          <button
                            type="button"
                            className="inline-flex size-8 cursor-pointer items-center justify-center rounded-wz-md border-0 bg-transparent text-wz-text-secondary hover:bg-wz-neutral-100 hover:text-wz-primary"
                            aria-label="Edit leave request"
                            onClick={() => onEdit(row)}
                          >
                            <Pencil size={15} />
                          </button>
                        ) : null}
                        {canApprove && pending ? (
                          <>
                            <button
                              type="button"
                              className="inline-flex size-8 cursor-pointer items-center justify-center rounded-wz-md border-0 bg-transparent text-[#12b76a] hover:bg-[#ecfdf3]"
                              aria-label="Approve"
                              onClick={() => onApprove?.(row)}
                            >
                              <Check size={16} />
                            </button>
                            <button
                              type="button"
                              className="inline-flex size-8 cursor-pointer items-center justify-center rounded-wz-md border-0 bg-transparent text-[#f04438] hover:bg-[#fef3f2]"
                              aria-label="Reject"
                              onClick={() => onReject?.(row)}
                            >
                              <X size={16} />
                            </button>
                          </>
                        ) : null}
                        {canCancel && pending && onCancel ? (
                          <Button
                            type="button"
                            variant="secondary"
                            size="sm"
                            onClick={() => onCancel(row)}
                          >
                            Cancel
                          </Button>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {onPageChange && totalCount > pageSize ? (
        <div className="mt-wz-4 flex flex-wrap items-center justify-between gap-2 text-sm text-wz-text-secondary">
          <span>
            Showing {from}–{to} of {totalCount}
          </span>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              disabled={page <= 1}
              onClick={() => onPageChange(page - 1)}
            >
              Previous
            </Button>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => onPageChange(page + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      ) : null}
    </section>
  );
}
