import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "../../design-system";
import { ApiError } from "../../lib/apiClient";
import type { SessionUser } from "../../layouts/sessionUser";
import {
  useCancelLeaveRequest,
  useLeaveBalances,
  useLeaveDashboard,
  useLeaveRequests,
} from "../../hooks/useLeave";
import type { LeaveRequest } from "../../services/leaveService";
import LeaveBalancePanel from "./LeaveBalancePanel";
import LeaveConfirmDialog from "./LeaveConfirmDialog";
import LeaveMetrics from "./LeaveMetrics";
import LeaveRequestModal from "./LeaveRequestModal";
import LeaveRequestsTable from "./LeaveRequestsTable";
import LeaveUpcomingPanel from "./LeaveUpcomingPanel";
import {
  filterRequests,
  normalizeBalanceRows,
  selfLeaveMetrics,
} from "./leaveViewModel";

export type LeaveSelfPageProps = {
  user: SessionUser | null;
  embedded?: boolean;
};

export default function LeaveSelfPage({
  embedded = false,
}: LeaveSelfPageProps) {
  const navigate = useNavigate();
  const { vendorSlug } = useParams();
  const base = `/${vendorSlug || "app"}`;

  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [requestType, setRequestType] = useState("");
  const [status, setStatus] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [cancelRow, setCancelRow] = useState<LeaveRequest | null>(null);
  const [cancelLoading, setCancelLoading] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  useEffect(() => {
    const t = window.setTimeout(() => setSearch(searchInput.trim()), 250);
    return () => window.clearTimeout(t);
  }, [searchInput]);

  const dashboardQuery = useLeaveDashboard();
  const requestsQuery = useLeaveRequests({});
  const balancesQuery = useLeaveBalances();
  const cancelMutation = useCancelLeaveRequest();

  const summary = useMemo(() => {
    const data = dashboardQuery.data;
    return data?.selfSummary || data?.summary;
  }, [dashboardQuery.data]);

  const metrics = useMemo(() => selfLeaveMetrics(summary), [summary]);

  const upcoming = useMemo(
    () => (dashboardQuery.data?.upcoming || []).slice(0, 6),
    [dashboardQuery.data],
  );

  const balanceRows = useMemo(() => {
    if (balancesQuery.data?.balances?.length) {
      return balancesQuery.data.balances;
    }
    return normalizeBalanceRows(dashboardQuery.data?.balances);
  }, [balancesQuery.data, dashboardQuery.data]);

  const rows = useMemo(() => {
    const all = requestsQuery.data?.requests || dashboardQuery.data?.recent || [];
    return filterRequests(all, { search, status, requestType });
  }, [
    requestsQuery.data,
    dashboardQuery.data,
    search,
    status,
    requestType,
  ]);

  const handleCancel = async () => {
    if (!cancelRow) return;
    setCancelLoading(true);
    setActionError(null);
    try {
      await cancelMutation.mutateAsync({ id: cancelRow._id });
      setCancelRow(null);
    } catch (err) {
      setActionError(
        err instanceof ApiError ? err.message : "Unable to cancel request.",
      );
      setCancelRow(null);
    } finally {
      setCancelLoading(false);
    }
  };

  return (
    <div className="space-y-wz-5">
      {!embedded ? (
        <div className="flex flex-wrap items-start justify-between gap-wz-3">
          <div>
            <h1 className="m-0 text-xl font-semibold text-wz-text-primary">
              Leave
            </h1>
            <p className="m-0 mt-1 text-sm text-wz-text-secondary">
              Apply for leave, track requests, and view your balances.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="secondary"
              onClick={() => navigate(`${base}/leave/policy`)}
            >
              View Leave Policy
            </Button>
            <Button
              type="button"
              variant="primary"
              onClick={() => setCreateOpen(true)}
            >
              + Submit Request
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex flex-wrap justify-end gap-2">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => navigate(`${base}/leave/policy`)}
          >
            View Leave Policy
          </Button>
          <Button
            type="button"
            variant="primary"
            size="sm"
            onClick={() => setCreateOpen(true)}
          >
            + Submit Request
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
        title="My Recent Requests"
        rows={rows}
        search={searchInput}
        onSearchChange={setSearchInput}
        requestType={requestType}
        onRequestTypeChange={setRequestType}
        status={status}
        onStatusChange={setStatus}
        showEmployee={false}
        canCancel
        onCancel={setCancelRow}
        onCreate={() => setCreateOpen(true)}
        createLabel="+ Submit Request"
        loading={requestsQuery.isLoading}
        emptyMessage="You have no leave requests yet."
      />

      <div className="grid grid-cols-1 gap-wz-5 xl:grid-cols-2">
        <LeaveUpcomingPanel
          items={upcoming}
          title="Upcoming Leaves"
          showEmployee={false}
        />
        <LeaveBalancePanel mode="self" rows={balanceRows} />
      </div>

      <LeaveRequestModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        forSelf
        title="Submit Request"
      />
      <LeaveConfirmDialog
        open={Boolean(cancelRow)}
        title="Cancel Request"
        message="Are you sure you want to cancel this leave request? This cannot be undone."
        confirmLabel="Cancel Request"
        variant="destructive"
        loading={cancelLoading}
        onClose={() => setCancelRow(null)}
        onConfirm={() => void handleCancel()}
      />
    </div>
  );
}
