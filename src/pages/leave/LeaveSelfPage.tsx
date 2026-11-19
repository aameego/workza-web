import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { SuccessToast } from "../../design-system";
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
  withWfhRow,
} from "./leaveViewModel";

export type LeaveSelfPageProps = {
  user: SessionUser | null;
  embedded?: boolean;
  /** Hide policy+month when parent already renders LeavePageHeader. */
  hideHeader?: boolean;
  /** Month picked in the parent's header (manager tabs). */
  year?: number;
  month?: number;
};

const now = new Date();

export default function LeaveSelfPage({
  user,
  hideHeader = false,
  year: parentYear,
  month: parentMonth,
}: LeaveSelfPageProps) {
  // Requests and upcoming leaves come back scoped to the caller's whole team for managers; pin them to self.
  const selfId = user?.employeeId || undefined;
  const navigate = useNavigate();
  const { vendorSlug } = useParams();
  const base = `/${vendorSlug || "app"}`;

  const [ownYear, setYear] = useState(now.getFullYear());
  const [ownMonth, setMonth] = useState(now.getMonth() + 1);
  const year = parentYear ?? ownYear;
  const month = parentMonth ?? ownMonth;
  const [notice, setNotice] = useState<string | null>(null);
  const [requestType, setRequestType] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const [createOpen, setCreateOpen] = useState(false);
  const [cancelRow, setCancelRow] = useState<LeaveRequest | null>(null);
  const [cancelLoading, setCancelLoading] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const dashboardQuery = useLeaveDashboard({ year, month });
  const requestsQuery = useLeaveRequests({
    year,
    month,
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
  const countBase = { year, month, page: 1, limit: 1, employeeId: selfId };
  const rejectedTotal = useLeaveRequests({ ...countBase, status: "Rejected" }).data?.total;
  const pendingTotal = useLeaveRequests({ ...countBase, status: "Pending" }).data?.total;
  const metrics = useMemo(
    () =>
      selfLeaveMetrics({
        ...summary,
        rejectedRequests: rejectedTotal ?? summary?.rejectedRequests,
        pendingRequests: pendingTotal ?? summary?.pendingRequests,
      }),
    [summary, rejectedTotal, pendingTotal],
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
    const rows = balancesQuery.data?.balances?.length
      ? balancesQuery.data.balances
      : normalizeBalanceRows(dashboardQuery.data?.balances);
    return withWfhRow(rows, balancesQuery.data?.wfhQuota ?? summary?.wfhQuota);
  }, [balancesQuery.data, dashboardQuery.data, summary]);

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
      setNotice("Request cancelled successfully.");
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
    <div className="space-y-4 max-md:space-y-5">
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
        onSaved={setNotice}
        forSelf
        title="Submit Request"
      />
      <SuccessToast message={notice} onClear={setNotice} />
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
