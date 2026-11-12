import type { BadgeStatus } from "../../design-system";
import type { EmployeeListItem } from "../../services/employeeTypes";

export type DirectoryTab = "employee" | "consultancy";

/** Figma status filter (EMP-UI-03): no Exited / Deleted. Intern needs backend support. */
export const STATUS_FILTER_OPTIONS = [
  { value: "", label: "Employee Status" },
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
  { value: "full-time", label: "Full-Time" },
  { value: "probation", label: "Probation" },
  { value: "expiring-soon", label: "Probation Ending Soon" },
] as const;

/** Figma "App Login" filter — maps to backend `appLogin` query */
export const APP_LOGIN_FILTER_OPTIONS = [
  { value: "", label: "App Login" },
  { value: "enabled", label: "Enabled" },
  { value: "disabled", label: "Disabled" },
  { value: "none", label: "No Login" },
] as const;

/** Figma role filter (EMP-UI-03): access roles only — HR, Manager, Finance (+ custom roles). */
export const DEFAULT_ACCESS_ROLE_OPTIONS = ["HR", "Manager", "Finance"] as const;

/** Self-service roles left out of the Access Roles filter. */
export const NON_ACCESS_ROLES = ["Admin", "Employee", "Intern"] as const;

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
  if (status === "probation") return "info";
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
  noun = "employees",
): string => {
  if (total <= 0) return `Showing 0 of 0 ${noun}`;
  const start = (page - 1) * limit + 1;
  const end = Math.min(page * limit, total);
  return `Showing ${start}–${end} of ${total} ${noun}`;
};

/** Compact page list: 1 … 4 5 6 … N */
export { paginationItems } from "../../design-system/components/paginationItems";
