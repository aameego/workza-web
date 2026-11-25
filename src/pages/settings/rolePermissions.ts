import type { RoleOption } from "../../services/roleService";

/**
 * RBAC permission catalog — same keys as the backend (utils/seedDefaultRoles.js)
 * and the legacy app (src/utils/permissions.js). Permission key: module:feature.
 */

/** Self-service access every role gets; shown locked in the role editor. */
export const BASELINE_PERMISSIONS = [
  "dashboard:view",
  "attendance:view",
  "leave:view",
  "leave:apply",
  "leave:balance",
  "regularization:view",
  "regularization:submit",
  "payroll:view",
  "expenses:view",
  "expenses:create",
  "documents:view",
  "documents:upload",
  "resignation:view",
  "resignation:submit",
  "advance-loan:view",
  "advance-loan:create",
  "settings:profile",
  "settings:security",
  "settings:notifications",
];

export type PermissionGroup = {
  key: string;
  label: string;
  perms: { key: string; label: string }[];
};

/** HR / Admin features a role can be granted. roles:manage stays Administrator-only. */
export const ELEVATED_GROUPS: PermissionGroup[] = [
  {
    key: "employees",
    label: "Employees",
    perms: [
      { key: "employees:view", label: "View All Employees" },
      { key: "employees:manage", label: "Add / Edit / Delete Employees" },
      { key: "employees:letters", label: "Generate Letters (Appointment, Warning, etc.)" },
    ],
  },
  {
    key: "letters",
    label: "Letters",
    perms: [
      { key: "letters:view", label: "View Letter Templates & Issued Letters" },
      { key: "letters:templates", label: "Create / Edit Letter Templates" },
      { key: "letters:issue", label: "Generate, Download & Email Letters" },
      { key: "letters:offers", label: "Manage Offer Candidates & Offer Letters" },
    ],
  },
  {
    key: "consultancy",
    label: "Consultancy",
    perms: [
      { key: "consultancy:view", label: "View Consultancy" },
      { key: "consultancy:manage", label: "Add / Edit / Delete Consultancy" },
    ],
  },
  {
    key: "departments",
    label: "Departments / Sites",
    perms: [
      { key: "departments:view", label: "View Departments / Sites" },
      { key: "departments:manage", label: "Add / Edit / Delete Departments, Sites, Shifts & OT Policies" },
    ],
  },
  {
    key: "attendance",
    label: "Attendance",
    perms: [
      { key: "attendance:view-org", label: "View + Download Organization Attendance" },
      { key: "attendance:view-team", label: "View Team Attendance (Reporting Manager's Team)" },
      { key: "attendance:mark", label: "Mark / Correct Daily Attendance for Others" },
      { key: "attendance:manage", label: "Mark Month Attendance + Bulk Upload + Download Reports" },
    ],
  },
  {
    key: "leave",
    label: "Leave",
    perms: [
      { key: "leave:approve-all", label: "Approve / Reject Anyone's Leave" },
      { key: "leave:policy", label: "Manage Leave Policy" },
      { key: "leave:balances", label: "Edit Leave Balances" },
      { key: "leave:direct-edit", label: "Direct Edit Leave Records" },
      { key: "leave:alert-email", label: "Email alerts" },
      { key: "leave:alert-notification", label: "In-app & push alerts" },
    ],
  },
  {
    key: "regularization",
    label: "Regularization",
    perms: [
      { key: "regularization:view-all", label: "View All Regularization Requests" },
      { key: "regularization:approve", label: "Approve / Reject Regularization" },
      { key: "regularization:direct-edit", label: "Direct Edit Regularization" },
      { key: "regularization:alert-email", label: "Email alerts" },
      { key: "regularization:alert-notification", label: "In-app & push alerts" },
    ],
  },
  {
    key: "payroll",
    label: "Payroll",
    perms: [
      { key: "payroll:manage", label: "Generate / Calculate / Approve / Process Payroll" },
      { key: "payroll:config", label: "Manage Payroll Config" },
      { key: "payroll:components", label: "Manage Salary Components" },
      { key: "payroll:structure", label: "Manage Salary Structure" },
      { key: "payroll:reports", label: "View & Export Payroll Reports" },
      { key: "payroll:payments", label: "Manage Payments" },
      { key: "payroll:alert-email", label: "Email alerts" },
      { key: "payroll:alert-notification", label: "In-app & push alerts" },
    ],
  },
  {
    key: "expenses",
    label: "Expenses",
    perms: [
      { key: "expenses:approve", label: "Approve / Reject Expenses" },
      { key: "expenses:policy", label: "Manage Expense Policy" },
      { key: "expenses:reimburse", label: "Mark Expenses as Reimbursed" },
      { key: "expenses:alert-email", label: "Email alerts" },
      { key: "expenses:alert-notification", label: "In-app & push alerts" },
    ],
  },
  {
    key: "documents",
    label: "Documents",
    perms: [{ key: "documents:view-all", label: "View All Employees' Documents" }],
  },
  {
    key: "resignation",
    label: "Resignation",
    perms: [
      { key: "resignation:manage", label: "Manage Resignation Status / Final Approval" },
      { key: "resignation:alert-email", label: "Email alerts" },
      { key: "resignation:alert-notification", label: "In-app & push alerts" },
    ],
  },
  {
    key: "advanceLoan",
    label: "Advance Loan",
    perms: [
      { key: "advance-loan:approve", label: "Approve / Reject Loan Requests" },
      { key: "advance-loan:repayment", label: "Manage Repayment / Defer Deduction" },
      { key: "advance-loan:view-all", label: "View All Requests" },
      { key: "advance-loan:statistics", label: "View Loan Statistics" },
      { key: "loan-config:manage", label: "Manage Loan Configuration" },
      { key: "advance-loan:alert-email", label: "Email alerts" },
      { key: "advance-loan:alert-notification", label: "In-app & push alerts" },
    ],
  },
  {
    key: "probation",
    label: "Probation",
    perms: [
      { key: "probation:manage", label: "Manage Probation (Confirm / Extend Employees)" },
      { key: "settings:probation", label: "Manage Probation Policy" },
      { key: "probation:alert-email", label: "Email alerts" },
      { key: "probation:alert-notification", label: "In-app & push alerts" },
    ],
  },
  {
    key: "helpdesk",
    label: "Help Desk",
    perms: [
      { key: "helpdesk:alert-email", label: "Email alerts" },
      { key: "helpdesk:alert-notification", label: "In-app & push alerts" },
    ],
  },
  {
    key: "settings",
    label: "Settings",
    perms: [
      { key: "settings:org", label: "Manage Organization Profile" },
      { key: "settings:shifts", label: "Manage Shifts & Week Offs" },
      { key: "settings:holidays", label: "Manage Holidays" },
      { key: "settings:leave-policy", label: "Manage Leave Policy" },
      { key: "settings:salary", label: "Manage Salary Structure & Components" },
      { key: "settings:ot", label: "Manage OT Policy" },
    ],
  },
];

/** Distinct modules a permission list touches (e.g. "leave:apply" -> leave). */
export const moduleCount = (permissions: string[]): number =>
  new Set(permissions.map((p) => p.split(":")[0])).size;

/** Permissions to save: the locked baseline plus the chosen HR/Admin features. */
export const permissionsToSave = (selected: Iterable<string>): string[] => [
  ...new Set([...BASELINE_PERMISSIONS, ...selected]),
];

/** HR/Admin features already on a role (everything outside the baseline). */
export const elevatedOf = (permissions: string[]): Set<string> =>
  new Set(permissions.filter((p) => !BASELINE_PERMISSIONS.includes(p)));

export const roleLabel = (role: RoleOption): string => role.displayName || role.roleName;

const NAME_PATTERN = /^[A-Za-z0-9][A-Za-z0-9 _-]*$/;

/** Same rules the backend applies, so the error shows before saving. */
export const roleNameError = (name: string): string => {
  const value = name.trim();
  if (!value) return "Role name is required";
  if (value.length < 3) return "Role name must be at least 3 characters";
  if (value.length > 50) return "Role name must be 50 characters or less";
  if (!NAME_PATTERN.test(value)) {
    return "Role name can only contain letters, numbers, spaces, underscores and hyphens";
  }
  return "";
};

export type Generation = "all" | "system" | "custom";

/** Figma created-by stamp: 23/09/26, 12:34 PM */
export const formatCreatedAt = (iso?: string | null): string => {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const date = d.toLocaleDateString("en-GB", { day: "2-digit", month: "2-digit", year: "2-digit" });
  const time = d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
  return `${date}, ${time}`;
};

/** Local YYYY-MM-DD, to compare with the date input. */
const localDay = (iso?: string | null): string => {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

/** Roles shown in the table: Administrator is hidden (full access, not editable). */
export const filterRoles = (
  roles: RoleOption[],
  generation: Generation,
  createdOn: string,
): RoleOption[] =>
  roles.filter(
    (role) =>
      !role.isAdmin &&
      (generation === "all" || (generation === "system") === Boolean(role.isSystem)) &&
      (!createdOn || localDay(role.createdAt) === createdOn),
  );

