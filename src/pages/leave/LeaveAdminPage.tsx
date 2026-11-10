import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "../../design-system";
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
import LeaveRequestModal from "./LeaveRequestModal";
import LeaveRequestsTable from "./LeaveRequestsTable";
import LeaveUpcomingPanel from "./LeaveUpcomingPanel";
import {
  employeeFromRequest,
  filterRequests,
  orgLeaveMetrics,
  teamLeaveMetrics,
} from "./leaveViewModel";

export type LeaveAdminPageProps = {
  user: SessionUser | null;
  /** Hide page chrome when embedded under manager tabs. */
  embedded?: boolean;
  /** When true, treat as team scope (manager My Team). */
  teamScope?: boolean;
  title?: string;
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

export default function LeaveAdminPage({
  user,
  embedded = false,
  teamScope = false,
  title = "Leave",
}: LeaveAdminPageProps) {
  const navigate = useNavigate();
  const { vendorSlug } = useParams();
  const base = `/${vendorSlug || "app"}`;

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
    status:
      status === "Cancelled"
        ? undefined
        : status || undefined,
  });
  const balanceQuery = useLeaveBalances(
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

  const metrics = useMemo(
    () => (teamScope ? teamLeaveMetrics(summary) : orgLeaveMetrics(summary)),
    [summary, teamScope],
  );

  const upcoming = useMemo(() => {
    const items = dashboardQuery.data?.upcoming || [];
    return items.slice(0, 8);
  }, [dashboardQuery.data]);

  const serverRows = requestsQuery.data?.requests || [];
  const rows = useMemo(() => {
    let filtered = filterRequests(serverRows, {
      search: "",
      status:
        status === "Cancelled"
          ? ""
          : status,
      requestType,
    });
    if (status === "Cancelled") {
      filtered = filtered.filter(
        (r) => r.status === "Cancelled" || r.status === "Rejected",
      );
    }
    return filtered;
  }, [serverRows, status, requestType]);

  const openDecision = (
    row: LeaveRequest,
    action: "approve" | "reject",
  ) => {
    const emp = employeeFromRequest(row);
    const isApprove = action === "approve";
    setConfirm({
      open: true,
      title: `${isApprove ? "Approve" : "Reject"} Request`,
      message: isApprove
        ? `Approve ${emp.name}'s leave request?`
        : `Reject ${emp.name}'s leave request?`,
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
      setActionError(
        err instanceof ApiError ? err.message : "Action failed.",
      );
      setConfirm(closedConfirm());
    } finally {
      setConfirmLoading(false);
    }
  };

  return (
    <div className="space-y-wz-5">
      {!embedded ? (
        <div className="flex flex-wrap items-start justify-between gap-wz-3">
          <div>
            <h1 className="m-0 text-xl font-semibold text-wz-text-primary">
              {title}
            </h1>
            <p className="m-0 mt-1 text-sm text-wz-text-secondary">
              {teamScope
                ? "Review and act on your team's leave requests."
                : "Organisation leave directory — requests, balances, and upcoming leave."}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {canPolicy ? (
              <Button
                type="button"
                variant="secondary"
                onClick={() => navigate(`${base}/leave/policy`)}
              >
                View Leave Policy
              </Button>
            ) : null}
            <Button
              type="button"
              variant="primary"
              onClick={() => setCreateOpen(true)}
            >
              + Create Request
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex flex-wrap justify-end gap-2">
          {canPolicy ? (
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => navigate(`${base}/leave/policy`)}
            >
              View Leave Policy
            </Button>
          ) : null}
          <Button
            type="button"
            variant="primary"
            size="sm"
            onClick={() => setCreateOpen(true)}
          >
            + Create Request
          </Button>
        </div>
      )}

      {actionError ? (
        <p className="m-0 text-sm text-wz-error" role="alert">
          {actionError}
        </p>
      ) : null}

      <LeaveMetrics metrics={metrics} />

      <LeaveRequestsTable
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
        showEmployee
        canApprove={canApprove}
        canEdit={canEdit}
        onApprove={(row) => openDecision(row, "approve")}
        onReject={(row) => openDecision(row, "reject")}
        onEdit={(row) => setEditRow(row)}
        onCreate={() => setCreateOpen(true)}
        loading={requestsQuery.isLoading}
        page={page}
        total={requestsQuery.data?.total}
        pageSize={10}
        onPageChange={setPage}
      />

      <div
        className={
          canBalances
            ? "grid grid-cols-1 gap-wz-5 xl:grid-cols-2"
            : "grid grid-cols-1 gap-wz-5"
        }
      >
        <LeaveUpcomingPanel items={upcoming} showEmployee />
        {canBalances ? (
          <LeaveBalancePanel
            mode="manage"
            rows={balanceQuery.data?.balances || []}
            employeeId={balanceEmployeeId}
            onEmployeeChange={setBalanceEmployeeId}
            saving={updateBalances.isPending}
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
