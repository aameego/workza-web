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
  { value: "LWP", label: "Leave Without Pay (LWP)" },
] as const;

/** Policy types to select options, always with the full name ("Casual Leave (CL)"). */
export const leaveTypeOptionsFrom = (
  types?: Array<{ code: string; label?: string }> | null,
): Array<{ value: string; label: string }> =>
  Array.isArray(types) && types.length
    ? types.map((t) => ({
        value: t.code,
        label: LEAVE_TYPE_LABELS[String(t.code).toUpperCase()] || t.label || t.code,
      }))
    : LEAVE_TYPE_OPTIONS.map((o) => ({ value: o.value, label: o.label }));

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

/** Org and My Team cards. Hints count unique employees (dashboard `employeeCounts`), never requests or headcount. */
export const orgLeaveMetrics = (summary?: LeaveSummary | null): LeaveMetricCard[] => {
  const s = summary || {};
  const people = s.employeeCounts || {};
  const pending = s.requestCounts?.pending ?? s.pendingRequests ?? s.pendingApprovals ?? 0;
  const rejected = s.requestCounts?.rejected ?? s.rejectedRequests ?? 0;
  return [
    {
      key: "wfh",
      label: "Work From Home Availed",
      value: s.wfhDaysThisMonth ?? 0,
      hint: s.wfhDaysThisMonth ? byEmployeesHint(people.wfh) : undefined,
      hintTone: "blue",
    },
    {
      key: "leave",
      label: "Leave Availed",
      value: s.leaveDaysThisMonth ?? 0,
      hint: s.leaveDaysThisMonth ? byEmployeesHint(people.leave) : undefined,
      hintTone: "green",
    },
    {
      key: "pending",
      label: "Pending Requests",
      value: pending,
      hint: pending ? byEmployeesHint(people.pending) : undefined,
      hintTone: "amber",
    },
    {
      key: "rejected",
      label: "Rejected Requests",
      value: rejected,
      hint:
        rejected && people.rejected
          ? `For ${people.rejected} employee${people.rejected === 1 ? "" : "s"}`
          : undefined,
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
      label: "Work From Home Availed",
      value: s.wfhDaysThisMonth ?? 0,
    },
    {
      key: "leave",
      label: "Leave Availed",
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

export const teamLeaveMetrics = orgLeaveMetrics;

/** Balances API leaves WFH out of `balances`; its quota comes separately. */
export const withWfhRow = (
  rows: LeaveBalanceRow[],
  wfhQuota?: LeaveSummary["wfhQuota"] | null,
): LeaveBalanceRow[] => {
  if (!wfhQuota || wfhQuota.total == null) return rows;
  if (rows.some((r) => String(r.type).toUpperCase() === "WFH")) return rows;
  return [
    ...rows,
    {
      type: "WFH",
      total: wfhQuota.total,
      used: wfhQuota.used ?? 0,
      remaining: wfhQuota.remaining ?? Math.max(0, wfhQuota.total - (wfhQuota.used ?? 0)),
    },
  ];
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

export type LeaveFormErrors = Partial<
  Record<"employeeId" | "leaveType" | "dayPart" | "startDate" | "endDate" | "reason", string>
>;

/** Every field error at once, so the form can show them inline together. */
export const validateLeaveRequestFields = (input: {
  leaveType: string;
  startDate: string;
  endDate: string;
  dayPart: string;
  reason: string;
  employeeId?: string;
  requireEmployee?: boolean;
  requireDayPart?: boolean;
}): LeaveFormErrors => {
  const errors: LeaveFormErrors = {};
  if (input.requireEmployee && !input.employeeId) errors.employeeId = "Please select an employee.";
  if (!input.leaveType) errors.leaveType = "Please select a leave type.";
  if (input.requireDayPart && !input.dayPart) errors.dayPart = "Please select a day type.";
  if (!input.startDate) errors.startDate = "Start date is required.";
  if (!input.endDate) errors.endDate = "End date is required.";
  else if (input.startDate && input.endDate < input.startDate) {
    errors.endDate = "End date must be on or after start date.";
  }
  if (
    !errors.endDate &&
    input.startDate &&
    (input.dayPart === "first-half" || input.dayPart === "second-half") &&
    input.startDate !== input.endDate
  ) {
    errors.dayPart = "Half-day leave is allowed only for a single day.";
  }
  if (!input.reason.trim() || input.reason.trim().length < 3) {
    errors.reason = "Please enter a reason (at least 3 characters).";
  }
  return errors;
};

export const validateLeaveRequestForm = (
  input: Parameters<typeof validateLeaveRequestFields>[0],
): string => {
  const errors = validateLeaveRequestFields(input);
  return (
    errors.employeeId ||
    errors.leaveType ||
    (errors.startDate || errors.endDate
      ? !input.startDate || !input.endDate
        ? "Start and end dates are required."
        : errors.endDate
      : "") ||
    errors.dayPart ||
    errors.reason ||
    ""
  );
};

/** First problem in the edited balances, or "" when they can be saved. */
export const balanceDraftError = (
  draft: Array<{ type: string; total: string; used: string }>,
): string => {
  for (const d of draft) {
    const total = Number(d.total);
    const used = Number(d.used);
    if (d.total.trim() === "" || !Number.isFinite(total)) return `${d.type} Total must be a number.`;
    if (total < 0) return `${d.type} Total cannot be negative.`;
    // WFH Used is counted from requests, not entered.
    if (d.type === "WFH") continue;
    if (d.used.trim() === "" || !Number.isFinite(used)) return `${d.type} Used must be a number.`;
    if (used < 0) return `${d.type} Used cannot be negative.`;
    if (used > total) return `${d.type} Used cannot exceed Total.`;
  }
  return "";
};
