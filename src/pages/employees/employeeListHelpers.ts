import type { BadgeStatus } from "../../design-system";
import type { EmployeeListItem } from "../../services/employeeTypes";

export type DirectoryTab = "employee" | "consultancy";

export const STATUS_FILTER_OPTIONS = [
  { value: "", label: "Employee Status" },
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
  { value: "exited", label: "Exited" },
  { value: "probation", label: "Probation" },
  { value: "full-time", label: "Full-Time" },
  { value: "expiring-soon", label: "Probation expiring" },
  { value: "deleted", label: "Deleted" },
] as const;

/** Figma "App Login" filter — maps to backend `appLogin` query */
export const APP_LOGIN_FILTER_OPTIONS = [
  { value: "", label: "App Login" },
  { value: "enabled", label: "Enabled" },
  { value: "disabled", label: "Disabled" },
  { value: "none", label: "No Login" },
] as const;

export const DEFAULT_ACCESS_ROLE_OPTIONS = [
  "Employee",
  "Intern",
  "Manager",
  "HR",
] as const;

export const employmentActiveLabel = (emp: EmployeeListItem): string => {
  if (emp.isDeleted) return "Deleted";
  if (emp.isExited) return "Exited";
  return emp.isActive ? "Active" : "Inactive";
};

export const employmentActiveBadge = (emp: EmployeeListItem): BadgeStatus => {
  if (emp.isDeleted || emp.isExited || !emp.isActive) return "error";
  return "success";
};

export const employmentTypeLabel = (emp: EmployeeListItem): string | null => {
  if (emp.isConsultancy) return "Consultant";
  const status = String(emp.employmentStatus || "").toLowerCase();
  if (status === "probation") return "Probation";
  if (status === "full-time" || status === "fulltime" || status === "confirmed") {
    return "Full-Time";
  }
  if (status === "intern") return "Intern";
  return null;
};

export const employmentTypeBadge = (emp: EmployeeListItem): BadgeStatus => {
  const status = String(emp.employmentStatus || "").toLowerCase();
  if (status === "probation") return "blue";
  if (status === "intern") return "warning";
  if (emp.isConsultancy) return "extra";
  return "neutral";
};

export const appLoginLabel = (emp: EmployeeListItem): string => {
  if (!emp.hasAppLogin) return "No Login";
  return emp.hasLoginEnabled ? "Enabled" : "Disabled";
};

export const appLoginBadge = (emp: EmployeeListItem): BadgeStatus => {
  if (!emp.hasAppLogin) return "neutral";
  return emp.hasLoginEnabled ? "success" : "warning";
};

export const pageWindowLabel = (
  page: number,
  limit: number,
  total: number,
): string => {
  if (total <= 0) return "Showing 0 of 0 employees";
  const start = (page - 1) * limit + 1;
  const end = Math.min(page * limit, total);
  return `Showing ${start}-${end} of ${total} employees`;
};

/** Compact page list: 1 … 4 5 6 … N */
export const paginationItems = (
  page: number,
  pages: number,
): Array<number | "ellipsis"> => {
  if (pages <= 7) {
    return Array.from({ length: Math.max(pages, 0) }, (_, i) => i + 1);
  }
  const items: Array<number | "ellipsis"> = [1];
  const start = Math.max(2, page - 1);
  const end = Math.min(pages - 1, page + 1);
  if (start > 2) items.push("ellipsis");
  for (let i = start; i <= end; i += 1) items.push(i);
  if (end < pages - 1) items.push("ellipsis");
  items.push(pages);
  return items;
};
