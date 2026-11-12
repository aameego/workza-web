import type {
  LeaveBalanceEmployee,
  LeaveBalanceRow,
  LeaveRequest,
  LeaveSummary,
} from "../../services/leaveService";

export const LEAVE_TYPE_LABELS: Record<string, string> = {
  CL: "Casual Leave (CL)",
  SL: "Sick Leave (SL)",
  EL: "Earned Leave (EL)",
  CO: "Compensatory Off (CO)",
  WFH: "Work From Home (WFH)",
  LOP: "Loss of Pay (LOP)",
  LWP: "Leave Without Pay (LWP)",
};

export const LEAVE_TYPE_OPTIONS = [
  { value: "CL", label: "Casual Leave (CL)" },
  { value: "SL", label: "Sick Leave (SL)" },
  { value: "EL", label: "Earned Leave (EL)" },
  { value: "CO", label: "Compensatory Off (CO)" },
  { value: "WFH", label: "Work From Home (WFH)" },
  { value: "LOP", label: "Loss of Pay (LOP)" },
] as const;

export const STATUS_TABS = [
  { value: "", label: "All Requests" },
  { value: "Pending", label: "Pending" },
  { value: "Approved", label: "Approved" },
  { value: "Cancelled", label: "Cancelled" },
] as const;

export type LeaveMetricCard = {
  key: string;
  label: string;
  value: number | string;
  hint?: string;
  /** Colored hint pill under the KPI value (Figma). */
  hintTone?: "blue" | "green" | "amber" | "red";
  /** @deprecated left-border accent — Figma uses pill hints instead */
  accent?: string;
};

export const getLeaveTypeLabel = (type?: string): string =>
  LEAVE_TYPE_LABELS[String(type || "").toUpperCase()] || type || "Leave";

export const formatLeaveDate = (value?: string | null): string => {
  if (!value) return "-";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "-";
  try {
    return d.toLocaleDateString("en-IN", {
      timeZone: "Asia/Kolkata",
      day: "2-digit",
      month: "2-digit",
      year: "2-digit",
    });
  } catch {
    return d.toLocaleDateString();
  }
};

export const formatLeaveDateTime = (value?: string | null): string => {
  if (!value) return "-";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "-";
  try {
    return d.toLocaleString("en-IN", {
      timeZone: "Asia/Kolkata",
      day: "2-digit",
      month: "2-digit",
      year: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  } catch {
    return d.toLocaleString();
  }
};

export const formatLeaveDays = (item: {
  days?: number;
  dayPart?: string;
}): string => {
  const days = item.days ?? "-";
  if (item.dayPart === "first-half") return `${days}d · First Half`;
  if (item.dayPart === "second-half") return `${days}d · Second Half`;
  return `${days}d`;
};

export const employeeFromRequest = (
  row: LeaveRequest,
): {
  id: string;
  name: string;
  employeeCode: string;
  email: string;
  phone: string;
  initials: string;
  designation: string;
} => {
  const emp =
    row.employeeId && typeof row.employeeId === "object"
      ? row.employeeId
      : null;
  const name = emp?.name || "Employee";
  const initials = name
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  return {
    id: emp?._id || (typeof row.employeeId === "string" ? row.employeeId : ""),
    name,
    employeeCode: emp?.employeeCode || "-",
    email: emp?.email || "-",
    phone: emp?.phone || "-",
    initials,
    designation: emp?.designation || "",
  };
};

export const approverLabel = (row: LeaveRequest): string => {
  if (row.approverId && typeof row.approverId === "object" && row.approverId.name) {
    return row.approverId.name;
  }
  const by =
    row.approvedBy && typeof row.approvedBy === "object"
      ? row.approvedBy.name
      : null;
  if (by) return by;
  if (row.status === "Rejected" && row.rejectedBy) {
    return typeof row.rejectedBy === "object"
      ? row.rejectedBy.name || "-"
      : "-";
  }
  return "-";
};

const byEmployeesHint = (count?: number | null): string | undefined => {
  if (count == null || count <= 0) return undefined;
  return `By ${count} employee${count === 1 ? "" : "s"}`;
};

export const orgLeaveMetrics = (summary?: LeaveSummary | null): LeaveMetricCard[] => {
  const s = summary || {};
  const pending = s.pendingRequests ?? s.pendingApprovals ?? 0;
  const rejected = s.requestCounts?.rejected ?? s.rejectedRequests ?? 0;
  return [
    {
      key: "wfh",
      label: "Work From Home Taken",
      value: s.wfhDaysThisMonth ?? 0,
      // ponytail: team/org size, not people who took it (no per-person count from /leave/dashboard).
      hint: s.wfhDaysThisMonth ? byEmployeesHint(s.employeeCount) : undefined,
      hintTone: "blue",
    },
    {
      key: "leave",
      label: "Leaves Taken",
      value: s.leaveDaysThisMonth ?? 0,
      hint: s.leaveDaysThisMonth ? byEmployeesHint(s.employeeCount) : undefined,
      hintTone: "green",
    },
    {
      key: "pending",
      label: "Pending Requests",
      value: pending,
      hint: byEmployeesHint(pending),
      hintTone: "amber",
    },
    {
      key: "rejected",
      label: "Rejected Requests",
      value: rejected,
      hint: rejected > 0 ? `For ${rejected} employee${rejected === 1 ? "" : "s"}` : undefined,
      hintTone: "red",
    },
  ];
};

export const selfLeaveMetrics = (
  summary?: LeaveSummary | null,
): LeaveMetricCard[] => {
  const s = summary || {};
  return [
    {
      key: "wfh",
      label: "Work From Home Taken",
      value: s.wfhDaysThisMonth ?? 0,
    },
    {
      key: "leave",
      label: "Leaves Taken",
      value: s.leaveDaysThisMonth ?? 0,
    },
    {
      key: "submitted",
      label: "Submitted Requests",
      value: s.pendingRequests ?? s.submittedRequests ?? 0,
    },
    {
      key: "rejected",
      label: "Rejected Requests",
      value: s.requestCounts?.rejected ?? s.rejectedRequests ?? 0,
    },
  ];
};

export const teamLeaveMetrics = (
  summary?: LeaveSummary | null,
): LeaveMetricCard[] => {
  const s = summary || {};
  const counts = s.requestCounts;
  if (counts) {
    return [
      {
        key: "wfh",
        label: "Work From Home Taken",
        value: s.wfhDaysThisMonth ?? 0,
        // ponytail: hint is team size (no per-person count from /leave/dashboard); hidden when nothing was taken.
        hint: s.wfhDaysThisMonth ? byEmployeesHint(s.employeeCount) : undefined,
        hintTone: "blue",
      },
      {
        key: "leave",
        label: "Leaves Taken",
        value: s.leaveDaysThisMonth ?? 0,
        hint: s.leaveDaysThisMonth ? byEmployeesHint(s.employeeCount) : undefined,
        hintTone: "green",
      },
      {
        key: "pending",
        label: "Pending Requests",
        value: counts.pending ?? 0,
        hint: byEmployeesHint(counts.pending),
        hintTone: "amber",
      },
      {
        key: "rejected",
        label: "Rejected Requests",
        value: counts.rejected ?? 0,
        hint:
          (counts.rejected ?? 0) > 0
            ? `For ${counts.rejected} employee${counts.rejected === 1 ? "" : "s"}`
            : undefined,
        hintTone: "red",
      },
    ];
  }
  return orgLeaveMetrics(summary);
};

export const normalizeBalanceRows = (
  data: LeaveBalanceRow[] | LeaveBalanceEmployee[] | undefined,
): LeaveBalanceRow[] => {
  if (!Array.isArray(data) || data.length === 0) return [];
  const first = data[0];
  if (first && "type" in first) return data as LeaveBalanceRow[];
  return [];
};

export const balanceEmployeesFromDashboard = (
  data: LeaveBalanceRow[] | LeaveBalanceEmployee[] | undefined,
): LeaveBalanceEmployee[] => {
  if (!Array.isArray(data) || data.length === 0) return [];
  const first = data[0];
  if (first && "balances" in first) return data as LeaveBalanceEmployee[];
  return [];
};

export const filterRequests = (
  rows: LeaveRequest[],
  {
    search = "",
    status = "",
    requestType = "",
  }: { search?: string; status?: string; requestType?: string },
): LeaveRequest[] => {
  const q = search.trim().toLowerCase();
  return rows.filter((row) => {
    if (status && row.status !== status) return false;
    if (requestType === "WFH" && row.leaveType !== "WFH" && row.requestType !== "WFH") {
      return false;
    }
    if (
      requestType &&
      requestType !== "WFH" &&
      String(row.leaveType || "").toUpperCase() !== requestType.toUpperCase()
    ) {
      return false;
    }
    if (!q) return true;
    const emp = employeeFromRequest(row);
    return (
      emp.name.toLowerCase().includes(q) ||
      emp.employeeCode.toLowerCase().includes(q) ||
      String(row.reason || "")
        .toLowerCase()
        .includes(q)
    );
  });
};

export const statusTabCounts = (
  rows: LeaveRequest[],
): Record<string, number> => {
  const counts: Record<string, number> = {
    "": rows.length,
    Pending: 0,
    Approved: 0,
    Cancelled: 0,
    Rejected: 0,
  };
  rows.forEach((r) => {
    const s = String(r.status || "");
    if (s in counts) counts[s] = (counts[s] || 0) + 1;
  });
  // Figma Cancelled tab often groups cancelled; keep rejected separate in counts.
  return counts;
};

export const toDateInputValue = (
  value?: string | Date | null,
  timeZone = "Asia/Kolkata",
): string => {
  if (!value) return "";
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  try {
    return new Intl.DateTimeFormat("en-CA", {
      timeZone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(date);
  } catch {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }
};

export const validateLeaveRequestForm = (input: {
  leaveType: string;
  startDate: string;
  endDate: string;
  dayPart: string;
  reason: string;
  employeeId?: string;
  requireEmployee?: boolean;
}): string => {
  if (input.requireEmployee && !input.employeeId) {
    return "Please select an employee.";
  }
  if (!input.leaveType) return "Please select a leave type.";
  if (!input.startDate || !input.endDate) {
    return "Start and end dates are required.";
  }
  if (input.endDate < input.startDate) {
    return "End date must be on or after start date.";
  }
  if (
    (input.dayPart === "first-half" || input.dayPart === "second-half") &&
    input.startDate !== input.endDate
  ) {
    return "Half-day leave is allowed only for a single day.";
  }
  if (!input.reason.trim() || input.reason.trim().length < 3) {
    return "Please enter a reason (at least 3 characters).";
  }
  return "";
};
