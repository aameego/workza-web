import { useState } from "react";
import { Check, Copy, Eye, Plus, Search, SquarePen, X } from "lucide-react";
import {
  Badge,
  Button,
  cn,
  FilterSelect,
  Pagination,
  TabSwitcher,
} from "../../design-system";
import { useLeaveTypeOptions } from "../../hooks/useLeave";
import type { LeaveRequest } from "../../services/leaveService";
import {
  STATUS_TABS,
  approverLabel,
  employeeFromRequest,
  formatLeaveDate,
  formatLeaveDateTime,
  getLeaveTypeLabel,
} from "./leaveViewModel";
import LeaveDetailsSheet from "./LeaveDetailsSheet";

const statusBadge = (
  status?: string,
): "success" | "warning" | "error" | "neutral" => {
  if (status === "Approved") return "success";
  if (status === "Pending") return "warning";
  if (status === "Rejected") return "error";
  return "neutral";
};

export type LeaveRequestsTableProps = {
  variant?: "org" | "self";
  rows: LeaveRequest[];
  search?: string;
  onSearchChange?: (value: string) => void;
  requestType: string;
  onRequestTypeChange: (value: string) => void;
  status: string;
  onStatusChange: (value: string) => void;
  /** Prefer dashboard/org totals for Figma tab badges. */
  statusCounts?: Record<string, number>;
  /** The viewer's own requests get no edit / approve / reject (another approver decides them). */
  selfEmployeeId?: string;
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
  variant = "org",
  rows,
  search = "",
  onSearchChange,
  requestType,
  onRequestTypeChange,
  status,
  onStatusChange,
  statusCounts,
  selfEmployeeId,
  canApprove,
  canEdit,
  canCancel,
  onApprove,
  onReject,
  onCancel,
  onEdit,
  onCreate,
  createLabel = "Create Request",
  loading,
  emptyMessage = "No leave requests found.",
  page = 1,
  total,
  pageSize = 10,
  onPageChange,
}: LeaveRequestsTableProps) {
  const isSelf = variant === "self";
  const [details, setDetails] = useState<LeaveRequest | null>(null);
  const typeOptions = useLeaveTypeOptions();
  const isOwn = (row: LeaveRequest) =>
    Boolean(selfEmployeeId) && employeeFromRequest(row).id === selfEmployeeId;
  /** Only pending requests from someone else can be edited or decided. */
  const decidable = (row: LeaveRequest) => row.status === "Pending" && !isOwn(row);
  /** Figma's self table has no Actions column; keep it only while a request can still be cancelled. */
  const showActions =
    !isSelf ||
    Boolean(canCancel && onCancel && rows.some((r) => r.status === "Pending"));
  const colCount = (isSelf ? 6 : 8) + (showActions ? 1 : 0);
  const counts = statusCounts || {
    "": rows.length,
    Pending: 0,
    Approved: 0,
    Cancelled: 0,
    Rejected: 0,
  };
  const totalCount = total ?? rows.length;
  const from = totalCount === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, totalCount);
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));

  /** Edit / approve / reject / cancel for a row — shared by the mobile table and the details sheet. */
  const rowActions = (row: LeaveRequest) => {
    const pending = row.status === "Pending";
    const canDecide = decidable(row);
    const iconBtn =
      "inline-flex cursor-pointer items-center justify-center rounded-wz-md border-0 bg-transparent px-1 py-1.5";
    return (
      <>
        {canEdit && onEdit && canDecide ? (
          <button type="button" className={cn(iconBtn, "text-wz-heading")} aria-label="Edit leave request" onClick={() => onEdit(row)}>
            <SquarePen size={12} />
          </button>
        ) : null}
        {canApprove && canDecide ? (
          <>
            <button type="button" className={cn(iconBtn, "text-[#12b76a]")} aria-label="Approve" onClick={() => onApprove?.(row)}>
              <Check size={12} />
            </button>
            <button type="button" className={cn(iconBtn, "text-[#d92d20]")} aria-label="Reject" onClick={() => onReject?.(row)}>
              <X size={12} />
            </button>
          </>
        ) : null}
        {canCancel && pending && onCancel ? (
          <Button type="button" variant="secondary" size="sm" onClick={() => onCancel(row)}>
            Cancel
          </Button>
        ) : null}
      </>
    );
  };

  const copyText = async (value: string) => {
    try {
      await navigator.clipboard.writeText(value);
    } catch {
      /* ignore */
    }
  };

  return (
    /* Figma leave-directory-admin: toolbar, tabs, table 24 apart */
    <div className="flex flex-col gap-wz-6 max-md:gap-5">
      {/* Figma Data/Filter Toolbar — one row: filters left, action right.
          Mobile (173:50832): search + type on one row, the action button below. */}
      <div className="flex items-center justify-between gap-4 max-md:flex-col max-md:items-start max-md:gap-2.5">
        <div className="flex min-w-0 flex-wrap items-center gap-4 max-md:w-full max-md:flex-nowrap">
          {!isSelf && onSearchChange ? (
            <label className="relative block h-10 w-[300px] max-w-full shrink-0 max-md:w-auto max-md:min-w-0 max-md:flex-1 max-md:shrink">
              <Search
                size={16}
                className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-[#6c757d]"
                aria-hidden
              />
              <input
                type="search"
                className="box-border h-10 w-full rounded-lg border border-[#dee2e6] bg-white py-0 pr-3 pl-9 text-[13px] text-[#0a1f4a] outline-none placeholder:text-[#6c757d] focus:border-[#1f5da3]"
                placeholder="Search by employees name or code..."
                value={search}
                onChange={(e) => onSearchChange(e.target.value)}
                aria-label="Search leave requests"
              />
            </label>
          ) : null}
          <FilterSelect
            value={requestType}
            onChange={(e) => onRequestTypeChange(e.target.value)}
            aria-label="Request type"
          >
            <option value="">Request Type</option>
            {typeOptions.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </FilterSelect>
          {isSelf ? (
            <FilterSelect
              value={status}
              onChange={(e) => onStatusChange(e.target.value)}
              aria-label="Request status"
            >
              <option value="">Request Status</option>
              <option value="Pending">Pending</option>
              <option value="Approved">Approved</option>
              <option value="Rejected">Rejected</option>
              <option value="Cancelled">Cancelled</option>
            </FilterSelect>
          ) : null}
        </div>
        {onCreate ? (
          <Button
            type="button"
            variant="primary"
            size="toolbar"
            className="shrink-0"
            onClick={onCreate}
          >
            <Plus size={16} aria-hidden />
            {createLabel.replace(/^\+\s*/, "")}
          </Button>
        ) : null}
      </div>

      {!isSelf ? (
        <TabSwitcher
          aria-label="Request status"
          value={status}
          onChange={onStatusChange}
          // Mobile: one scrolling row of tabs (Figma 173:50875).
          className="self-start max-md:max-w-full max-md:flex-nowrap max-md:self-stretch max-md:overflow-x-auto max-md:[&>*]:shrink-0 max-md:[&>*]:whitespace-nowrap"
          items={STATUS_TABS.map((tab) => ({
            value: tab.value,
            label: tab.label,
            count:
              tab.value === "" ? (counts[""] ?? 0) : counts[tab.value] || 0,
          }))}
        />
      ) : null}

      {/* Mobile table (Figma 173:50877 admin / 173:51639 self): five columns, eye opens View Details */}
      <div className="overflow-hidden rounded-wz-xl border border-wz-border bg-white xl:hidden max-md:border-0 max-md:outline max-md:outline-1 max-md:-outline-offset-1 max-md:outline-[#dee2e6]">
        <div className={cn("flex items-center border-b border-[#e9ecef] bg-wz-neutral-50 px-4 py-3 text-[10px] leading-[normal] font-semibold text-wz-heading", isSelf ? "justify-between gap-2" : "gap-1")}>
          {(isSelf
            ? ["Request Type", "Dates\n(Start - End)", "Approved By\n(RM/HR/Admin)", "Request\nStatus", "Actions"]
            : ["Employee", "Request\nType", "Dates\n(Start-End)", "Request\nStatus", "Actions"]
          ).map((h, i) => (
            <span
              key={h}
              className={cn(
                "whitespace-pre-line",
                // Figma self table: status and actions hug their content, the rest share the width.
                isSelf && i >= 3 ? "flex-none" : "min-w-0 flex-1",
                (isSelf ? i === 4 : i >= 3) && "text-center",
              )}
            >
              {h}
            </span>
          ))}
        </div>
        {loading ? (
          <p className="m-0 px-4 py-8 text-center text-xs text-wz-text-muted">Loading requests…</p>
        ) : rows.length === 0 ? (
          <p className="m-0 px-4 py-8 text-center text-xs text-wz-text-muted">{emptyMessage}</p>
        ) : (
          rows.map((row) => {
            const emp = employeeFromRequest(row);
            const typeCode = row.isCoCredit ? "CO" : String(row.leaveType || "-").toUpperCase();
            const typeName = getLeaveTypeLabel(row.leaveType).replace(/\s*\([^)]*\)\s*$/, "").trim();
            const decidedAt = row.decidedAt || row.approvedAt || row.rejectedAt;
            const tone = statusBadge(row.status);
            return (
              <div key={row._id} className={cn("flex items-center border-b border-[#e9ecef] px-4 py-3.5 text-[10px] leading-[normal] text-wz-heading last:border-b-0", isSelf ? "justify-between gap-2" : "gap-1")}>
                {isSelf ? null : (
                  <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                    <span className="truncate">{emp.name}</span>
                    <span className="truncate text-[9px] text-wz-text-muted">{emp.employeeCode}</span>
                  </div>
                )}
                <span className="min-w-0 flex-1">
                  {typeCode}
                  {typeName ? ` (${typeName})` : ""}
                </span>
                <span className="min-w-0 flex-1">
                  {formatLeaveDate(row.startDate)} - {formatLeaveDate(row.endDate)}
                </span>
                {isSelf ? (
                  <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                    <span className="truncate">{approverLabel(row)}</span>
                    <span className="truncate text-[9px] text-wz-text-muted">
                      {decidedAt ? formatLeaveDateTime(decidedAt) : "-"}
                    </span>
                  </div>
                ) : null}
                <div className={cn("flex justify-center", isSelf ? "flex-none" : "min-w-0 flex-1")}>
                  <span
                    className={cn(
                      "rounded-[6px] px-2 py-1 text-[8px] leading-[10px] whitespace-nowrap",
                      tone === "success" && "bg-[#ecfdf3] text-[#12b76a]",
                      tone === "warning" && "bg-[#fffaeb] text-[#f79009]",
                      tone === "error" && "bg-[#fef3f2] text-[#d92d20]",
                      tone === "neutral" && "bg-wz-neutral-100 text-wz-text-muted",
                    )}
                  >
                    {row.status || "-"}
                  </span>
                </div>
                <div className={cn("flex h-8 items-center justify-center", isSelf ? "flex-none" : "min-w-0 flex-1")}>
                  <button
                    type="button"
                    className="inline-flex cursor-pointer items-center justify-center rounded-wz-md border-0 bg-transparent px-1 py-1.5 text-wz-heading"
                    aria-label="View details"
                    onClick={() => setDetails(row)}
                  >
                    <Eye size={12} />
                  </button>
                </div>
              </div>
            );
          })
        )}
        {onPageChange && rows.length > 0 ? (
          <Pagination
            variant="compact"
            page={page}
            pages={totalPages}
            onPageChange={onPageChange}
            summary={`Showing ${from}–${to} of ${totalCount} requests`}
          />
        ) : null}
      </div>
      <LeaveDetailsSheet
        request={details}
        showEmployee={!isSelf}
        actions={details && (isSelf ? canCancel && details.status === "Pending" : true) ? rowActions(details) : null}
        onClose={() => setDetails(null)}
      />

      {/* Figma leave table: 54px header, 60px rows, 12px navy; pagination inside the card */}
      <div className="overflow-hidden rounded-wz-xl border border-wz-border bg-white max-xl:hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] border-collapse text-left text-xs leading-[normal] text-wz-heading">
            <thead>
              <tr>
                {(isSelf
                  ? [
                      "Request Type",
                      "Dates\n(Start - End)",
                      "Duration\n(in Days)",
                      "Request Reason",
                      "Approved By\n(RM/HR/Admin)",
                      "Request Status",
                      ...(showActions ? ["Actions"] : []),
                    ]
                  : [
                      "Employee",
                      "Request Type",
                      "Contact",
                      "Dates\n(Start - End)",
                      "Duration\n(in Days)",
                      "Request Reason",
                      "Approved By\n(RM/HR/Admin)",
                      "Request Status",
                      "Actions",
                    ]
                ).map((h) => (
                  <th
                    key={h}
                    className="h-[54px] border-b border-[#e9ecef] bg-[#f8f9fa] px-4 py-3 align-middle font-semibold whitespace-pre-line"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td
                    colSpan={colCount}
                    className="px-4 py-10 text-center text-wz-text-muted"
                  >
                    Loading requests…
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td
                    colSpan={colCount}
                    className="px-4 py-10 text-center text-wz-text-muted"
                  >
                    {emptyMessage}
                  </td>
                </tr>
              ) : (
                rows.map((row) => {
                  const emp = employeeFromRequest(row);
                  const canDecide = decidable(row);
                  const pending = row.status === "Pending";
                  const typeCode = row.isCoCredit
                    ? "CO"
                    : String(row.leaveType || "-").toUpperCase();
                  const typeName = getLeaveTypeLabel(row.leaveType)
                    .replace(/\s*\([^)]*\)\s*$/, "")
                    .trim();
                  const decidedAt = row.decidedAt || row.approvedAt || row.rejectedAt;
                  return (
                    <tr
                      key={row._id}
                      className="border-b border-wz-border last:border-0"
                    >
                      {!isSelf ? (
                        <td className="h-[60px] px-4">
                          <p className="m-0">{emp.name}</p>
                          <p className="m-0 mt-0.5 text-[10px] text-wz-text-muted">
                            {emp.employeeCode}
                          </p>
                        </td>
                      ) : null}
                      <td className="h-[60px] max-w-[120px] px-4">
                        {typeCode}
                        {typeName ? ` (${typeName})` : ""}
                        {row.isCoCredit ? " (Credit)" : ""}
                      </td>
                      {!isSelf ? (
                        <td className="px-4">
                          {(
                            [
                              [
                                "email",
                                emp.email,
                                "text-xs text-wz-heading",
                                12,
                              ],
                              [
                                "phone",
                                emp.phone,
                                "text-[10px] text-wz-text-muted",
                                10,
                              ],
                            ] as const
                          ).map(([kind, value, textClass, iconSize]) => (
                            <p
                              key={kind}
                              className={cn(
                                "m-0 flex max-w-[200px] items-center gap-1.5",
                                kind === "phone" && "mt-0.5",
                              )}
                            >
                              <span className={cn("truncate", textClass)}>
                                {value && value !== "-" ? value : "-"}
                              </span>
                              {value && value !== "-" ? (
                                <button
                                  type="button"
                                  className="inline-flex shrink-0 cursor-pointer border-0 bg-transparent p-0 leading-none text-wz-text-muted hover:text-wz-primary"
                                  aria-label={`Copy ${kind}`}
                                  onClick={() => void copyText(value)}
                                >
                                  <Copy size={iconSize} />
                                </button>
                              ) : null}
                            </p>
                          ))}
                        </td>
                      ) : null}
                      <td className="px-4">
                        {formatLeaveDate(row.startDate)} -
                        <br />
                        {formatLeaveDate(row.endDate)}
                      </td>
                      <td className="px-4">{row.days ?? "-"}</td>
                      <td className="max-w-[140px] px-4">
                        <span className="line-clamp-2">
                          {row.reason || "-"}
                        </span>
                      </td>
                      <td className="px-4">
                        <p className="m-0">{approverLabel(row)}</p>
                        <p className="m-0 mt-0.5 text-[10px] text-wz-text-muted">
                          {decidedAt ? formatLeaveDateTime(decidedAt) : "-"}
                        </p>
                      </td>
                      <td className="px-4">
                        <Badge status={statusBadge(row.status)}>
                          {row.status || "-"}
                        </Badge>
                        {row.status === "Rejected" && row.approverComment ? (
                          <p className="m-0 mt-0.5 max-w-[180px] truncate text-[10px] text-wz-text-muted" title={row.approverComment}>
                            {row.approverComment}
                          </p>
                        ) : null}
                      </td>
                      {showActions ? (
                        <td className="px-4">
                          <div className="flex items-center gap-2">
                            {canEdit && onEdit && canDecide ? (
                              <button
                                type="button"
                                className="inline-flex size-6 cursor-pointer items-center justify-center rounded-wz-md border-0 bg-transparent text-wz-heading hover:bg-wz-neutral-100"
                                aria-label="Edit leave request"
                                onClick={() => onEdit(row)}
                              >
                                <SquarePen size={12} />
                              </button>
                            ) : null}
                            {canApprove && canDecide ? (
                              <>
                                <button
                                  type="button"
                                  className="inline-flex size-6 cursor-pointer items-center justify-center rounded-wz-md border-0 bg-transparent text-[#12b76a] hover:bg-[#ecfdf3]"
                                  aria-label="Approve"
                                  onClick={() => onApprove?.(row)}
                                >
                                  <Check size={12} />
                                </button>
                                <button
                                  type="button"
                                  className="inline-flex size-6 cursor-pointer items-center justify-center rounded-wz-md border-0 bg-transparent text-[#d92d20] hover:bg-[#fef3f2]"
                                  aria-label="Reject"
                                  onClick={() => onReject?.(row)}
                                >
                                  <X size={12} />
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
                      ) : null}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        {onPageChange && rows.length > 0 ? (
          <Pagination
            page={page}
            pages={totalPages}
            onPageChange={onPageChange}
            summary={`Showing ${from}–${to} of ${totalCount} requests`}
          />
        ) : null}
      </div>
    </div>
  );
}
