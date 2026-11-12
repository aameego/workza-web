import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
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
import LeavePageHeader from "./LeavePageHeader";
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
  /** Hide policy+month when parent already renders LeavePageHeader. */
  hideHeader?: boolean;
};

const now = new Date();

export default function LeaveSelfPage({
  user,
  hideHeader = false,
}: LeaveSelfPageProps) {
  // Requests and upcoming leaves come back scoped to the caller's whole team for managers; pin them to self.
  const selfId = user?.employeeId || undefined;
  const navigate = useNavigate();
  const { vendorSlug } = useParams();
  const base = `/${vendorSlug || "app"}`;

  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [requestType, setRequestType] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const [createOpen, setCreateOpen] = useState(false);
  const [cancelRow, setCancelRow] = useState<LeaveRequest | null>(null);
  const [cancelLoading, setCancelLoading] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const dashboardQuery = useLeaveDashboard();
  const requestsQuery = useLeaveRequests({
    page,
    limit: 10,
    status: status || undefined,
    leaveType: requestType || undefined,
    employeeId: selfId,
  });
  const balancesQuery = useLeaveBalances();
  const cancelMutation = useCancelLeaveRequest();

  const summary = useMemo(() => {
    const data = dashboardQuery.data;
    return data?.selfSummary || data?.summary;
  }, [dashboardQuery.data]);

  // /leave/dashboard's self summary has no rejected count; use the list API's total.
  const rejectedQuery = useLeaveRequests({ page: 1, limit: 1, status: "Rejected", employeeId: selfId });
  const rejectedTotal = rejectedQuery.data?.total;
  const metrics = useMemo(
    () => selfLeaveMetrics(rejectedTotal == null ? summary : { ...summary, rejectedRequests: rejectedTotal }),
    [summary, rejectedTotal],
  );

  const upcoming = useMemo(
    () =>
      (dashboardQuery.data?.upcoming || [])
        .filter((item) => {
          const id = typeof item.employeeId === "object" ? item.employeeId?._id : item.employeeId;
          return !selfId || !id || String(id) === selfId;
        })
        .slice(0, 6),
    [dashboardQuery.data, selfId],
  );

  const balanceRows = useMemo(() => {
    if (balancesQuery.data?.balances?.length) {
      return balancesQuery.data.balances;
    }
    return normalizeBalanceRows(dashboardQuery.data?.balances);
  }, [balancesQuery.data, dashboardQuery.data]);

  const rows = useMemo(() => {
    const all =
      requestsQuery.data?.requests || dashboardQuery.data?.recent || [];
    return filterRequests(all, { search: "", status, requestType });
  }, [requestsQuery.data, dashboardQuery.data, status, requestType]);

  const shiftMonth = (delta: number) => {
    const d = new Date(year, month - 1 + delta, 1);
    setYear(d.getFullYear());
    setMonth(d.getMonth() + 1);
  };

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
    <div className="space-y-4">
      {!hideHeader ? (
        <LeavePageHeader
          year={year}
          month={month}
          onShiftMonth={shiftMonth}
          showPolicy
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
        variant="self"
        rows={rows}
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
        canCancel
        onCancel={setCancelRow}
        onCreate={() => setCreateOpen(true)}
        createLabel="Submit Request"
        loading={requestsQuery.isLoading}
        emptyMessage="You have no leave requests yet."
        page={page}
        total={requestsQuery.data?.total ?? rows.length}
        pageSize={10}
        onPageChange={setPage}
      />

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <LeaveUpcomingPanel
          items={upcoming}
          title="Upcoming Leaves (Next 7 days)"
          variant="self"
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
        title="Cancel Request?"
        message="Are you sure you want to cancel this request? This action cannot be undone."
        confirmLabel="Cancel"
        cancelLabel="Go Back"
        variant="destructive"
        loading={cancelLoading}
        onClose={() => setCancelRow(null)}
        onConfirm={() => void handleCancel()}
      />
    </div>
  );
}
