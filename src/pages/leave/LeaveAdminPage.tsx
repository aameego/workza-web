import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ApiError } from "../../lib/apiClient";
import type { SessionUser } from "../../layouts/sessionUser";
import {
  useApproveLeaveRequest,
  useLeaveBalances,
  useLeaveDashboard,
  useLeaveRequests,
  useRejectLeaveRequest,
  useUpdateLeaveBalances,
} from "../../hooks/useLeave";
import type { LeaveRequest } from "../../services/leaveService";
import { monthLabel } from "../employees/attendanceCalendar";
import {
  canApproveLeave,
  canDirectEditLeave,
  canEditLeaveBalances,
  canManageLeavePolicy,
} from "./leaveAccess";
import LeaveBalancePanel from "./LeaveBalancePanel";
import LeaveConfirmDialog from "./LeaveConfirmDialog";
import LeaveEditModal from "./LeaveEditModal";
import LeaveMetrics from "./LeaveMetrics";
import LeavePageHeader from "./LeavePageHeader";
import LeaveRequestModal from "./LeaveRequestModal";
import LeaveRequestsTable from "./LeaveRequestsTable";
import LeaveUpcomingPanel from "./LeaveUpcomingPanel";
import {
  employeeFromRequest,
  filterRequests,
  orgLeaveMetrics,
  teamLeaveMetrics,
} from "./leaveViewModel";
import { useEmployee } from "../../hooks/useEmployees";
import { employmentActiveLabel, employmentTypeLabel } from "../employees/employeeListHelpers";

export type LeaveAdminPageProps = {
  user: SessionUser | null;
  /** Hide page chrome when embedded under manager tabs. */
  embedded?: boolean;
  /** When true, treat as team scope (manager My Team). */
  teamScope?: boolean;
  /** Hide policy+month when parent already renders LeavePageHeader. */
  hideHeader?: boolean;
};

type ConfirmState = {
  open: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  variant: "primary" | "destructive" | "success";
  action: (() => Promise<void>) | null;
};

const closedConfirm = (): ConfirmState => ({
  open: false,
  title: "",
  message: "",
  confirmLabel: "Confirm",
  variant: "primary",
  action: null,
});

const now = new Date();

export default function LeaveAdminPage({
  user,
  embedded = false,
  teamScope = false,
  hideHeader = false,
}: LeaveAdminPageProps) {
  const navigate = useNavigate();
  const { vendorSlug } = useParams();
  const base = `/${vendorSlug || "app"}`;

  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [upcomingMonth, setUpcomingMonth] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [requestType, setRequestType] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const [createOpen, setCreateOpen] = useState(false);
  const [editRow, setEditRow] = useState<LeaveRequest | null>(null);
  const [confirm, setConfirm] = useState<ConfirmState>(closedConfirm);
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [balanceEmployeeId, setBalanceEmployeeId] = useState("");
  const [balanceError, setBalanceError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const canApprove = canApproveLeave(user);
  const canEdit = canDirectEditLeave(user);
  const canBalances = canEditLeaveBalances(user) && !teamScope;
  const canPolicy = canManageLeavePolicy(user);
  const canCreate = !teamScope;

  useEffect(() => {
    const t = window.setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(1);
    }, 300);
    return () => window.clearTimeout(t);
  }, [searchInput]);

  const dashboardQuery = useLeaveDashboard();
  const requestsQuery = useLeaveRequests({
    page,
    limit: 10,
    search: search || undefined,
    status: status || undefined,
    leaveType: requestType || undefined,
  });
  const balanceQuery = useLeaveBalances(
    balanceEmployeeId || undefined,
    Boolean(balanceEmployeeId) && canBalances,
  );
  const { data: balanceEmployee } = useEmployee(
    balanceEmployeeId || undefined,
    Boolean(balanceEmployeeId) && canBalances,
  );
  const approveMutation = useApproveLeaveRequest();
  const rejectMutation = useRejectLeaveRequest();
  const updateBalances = useUpdateLeaveBalances();

  const summary = useMemo(() => {
    const data = dashboardQuery.data;
    if (teamScope) return data?.teamSummary || data?.summary;
    return data?.orgSummary || data?.summary;
  }, [dashboardQuery.data, teamScope]);

  const rejectedCount = useLeaveRequests({ page: 1, limit: 1, status: "Rejected" });
  const rejectedTotal = rejectedCount.data?.total;
  const metrics = useMemo(() => {
    const cards = teamScope ? teamLeaveMetrics(summary) : orgLeaveMetrics(summary);
    if (teamScope || rejectedTotal == null) return cards;
    // Org summary has no rejected count; use the list API's total.
    return orgLeaveMetrics({ ...summary, rejectedRequests: rejectedTotal, requestCounts: undefined });
  }, [summary, teamScope, rejectedTotal]);

  // Tab counts come from the list API's own totals (same search/type filters), so they always agree
  // with the table; /leave/dashboard has no org-wide per-status counts.
  const countBase = { page: 1, limit: 1, search: search || undefined, leaveType: requestType || undefined };
  const allCount = useLeaveRequests(countBase);
  const pendingCount = useLeaveRequests({ ...countBase, status: "Pending" });
  const approvedCount = useLeaveRequests({ ...countBase, status: "Approved" });
  const cancelledCount = useLeaveRequests({ ...countBase, status: "Cancelled" });
  const statusCounts = {
    "": allCount.data?.total ?? 0,
    Pending: pendingCount.data?.total ?? 0,
    Approved: approvedCount.data?.total ?? 0,
    Cancelled: cancelledCount.data?.total ?? 0,
  };

  const upcomingMonthOptions = useMemo(() => {
    const options: Array<{ value: string; label: string }> = [];
    for (let i = 0; i < 6; i += 1) {
      const d = new Date(year, month - 1 + i, 1);
      const y = d.getFullYear();
      const m = d.getMonth() + 1;
      options.push({
        value: `${y}-${String(m).padStart(2, "0")}`,
        label: monthLabel(y, m),
      });
    }
    return options;
  }, [year, month]);

  const upcoming = useMemo(() => {
    const items = dashboardQuery.data?.upcoming || [];
    const filtered = upcomingMonth
      ? items.filter((row) => {
          const start = row.startDate ? new Date(row.startDate) : null;
          if (!start || Number.isNaN(start.getTime())) return false;
          const key = `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, "0")}`;
          return key === upcomingMonth;
        })
      : items;
    return filtered.slice(0, 8);
  }, [dashboardQuery.data, upcomingMonth]);

  const serverRows = requestsQuery.data?.requests || [];
  const rows = useMemo(
    () =>
      filterRequests(serverRows, {
        search: "",
        status,
        requestType,
      }),
    [serverRows, status, requestType],
  );

  const shiftMonth = (delta: number) => {
    const d = new Date(year, month - 1 + delta, 1);
    setYear(d.getFullYear());
    setMonth(d.getMonth() + 1);
  };

  const openDecision = (row: LeaveRequest, action: "approve" | "reject") => {
    const emp = employeeFromRequest(row);
    const isApprove = action === "approve";
    setConfirm({
      open: true,
      title: `${isApprove ? "Approve" : "Reject"} Request?`,
      message: `Are you sure you want to ${isApprove ? "approve" : "reject"} request for ${emp.name || "this employee"}? This action cannot be undone.`,
      confirmLabel: isApprove ? "Approve" : "Reject",
      variant: isApprove ? "success" : "destructive",
      action: async () => {
        if (isApprove) {
          await approveMutation.mutateAsync({ id: row._id });
        } else {
          await rejectMutation.mutateAsync({ id: row._id });
        }
      },
    });
  };

  const runConfirm = async () => {
    if (!confirm.action) return;
    setConfirmLoading(true);
    setActionError(null);
    try {
      await confirm.action();
      setConfirm(closedConfirm());
    } catch (err) {
      setActionError(err instanceof ApiError ? err.message : "Action failed.");
      setConfirm(closedConfirm());
    } finally {
      setConfirmLoading(false);
    }
  };

  const showHeader = !hideHeader;

  return (
    /* Figma leave-directory-admin: every section 24 apart */
    <div className="space-y-6">
      {showHeader ? (
        <LeavePageHeader
          year={year}
          month={month}
          onShiftMonth={shiftMonth}
          showPolicy={canPolicy || embedded}
          onViewPolicy={() => navigate(`${base}/leave/policy`)}
        />
      ) : null}

      {actionError ? (
        <p className="m-0 text-sm text-wz-error" role="alert">
          {actionError}
        </p>
      ) : null}

      <LeaveMetrics metrics={metrics} />

      <LeaveRequestsTable
        variant="org"
        rows={rows}
        search={searchInput}
        onSearchChange={setSearchInput}
        requestType={requestType}
        onRequestTypeChange={(v) => {
          setRequestType(v);
          setPage(1);
        }}
        status={status}
        onStatusChange={(v) => {
          setStatus(v);
          setPage(1);
        }}
        statusCounts={statusCounts}
        canApprove={canApprove}
        canEdit={canEdit}
        onApprove={(row) => openDecision(row, "approve")}
        onReject={(row) => openDecision(row, "reject")}
        onEdit={(row) => setEditRow(row)}
        onCreate={canCreate ? () => setCreateOpen(true) : undefined}
        loading={requestsQuery.isLoading}
        page={page}
        total={requestsQuery.data?.total}
        pageSize={10}
        onPageChange={setPage}
      />

      <div
        className={
          canBalances
            ? "grid grid-cols-1 gap-6 xl:grid-cols-2"
            : "grid grid-cols-1 gap-6"
        }
      >
        <LeaveUpcomingPanel
          items={upcoming}
          variant="org"
          showMonthFilter
          monthValue={upcomingMonth}
          onMonthChange={setUpcomingMonth}
          monthOptions={upcomingMonthOptions}
        />
        {canBalances ? (
          <LeaveBalancePanel
            mode="manage"
            rows={balanceQuery.data?.balances || []}
            employeeId={balanceEmployeeId}
            employeeMeta={
              balanceQuery.data
                ? {
                    name: balanceQuery.data.name,
                    employeeCode: balanceQuery.data.employeeCode,
                    designation: balanceEmployee?.designation,
                    status: balanceEmployee ? employmentActiveLabel(balanceEmployee) : undefined,
                    employmentType: balanceEmployee
                      ? employmentTypeLabel(balanceEmployee) || undefined
                      : undefined,
                  }
                : null
            }
            onEmployeeChange={(id) => {
              setBalanceEmployeeId(id);
              updateBalances.reset();
            }}
            saving={updateBalances.isPending}
            saved={updateBalances.isSuccess}
            error={balanceError}
            onSave={async (payload) => {
              if (!balanceEmployeeId) return;
              setBalanceError(null);
              try {
                await updateBalances.mutateAsync({
                  employeeId: balanceEmployeeId,
                  payload,
                });
              } catch (err) {
                setBalanceError(
                  err instanceof ApiError
                    ? err.message
                    : "Unable to save balances.",
                );
              }
            }}
          />
        ) : null}
      </div>

      <LeaveRequestModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        forSelf={false}
      />
      <LeaveEditModal
        open={Boolean(editRow)}
        record={editRow}
        onClose={() => setEditRow(null)}
      />
      <LeaveConfirmDialog
        open={confirm.open}
        title={confirm.title}
        message={confirm.message}
        confirmLabel={confirm.confirmLabel}
        variant={confirm.variant}
        loading={confirmLoading}
        onClose={() => setConfirm(closedConfirm())}
        onConfirm={() => void runConfirm()}
      />
    </div>
  );
}
