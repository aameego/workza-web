import type { SessionUser } from "../../layouts/sessionUser";

type AccessUser = SessionUser & {
  permissions?: string[];
};

const permissionList = (user: AccessUser | null): string[] =>
  Array.isArray(user?.permissions) ? user!.permissions! : [];

const hasPermission = (
  user: AccessUser | null,
  permission: string,
): boolean => {
  if (!user?.role) return false;
  if (user.role === "Admin") return true;
  return permissionList(user).includes(permission);
};

const isAdminOrHr = (user: SessionUser | null): boolean =>
  user?.role === "Admin" || user?.role === "HR";

/** Org-wide leave (Figma leave-directory-admin). */
export const canViewOrgLeave = (user: SessionUser | null): boolean => {
  if (!user?.role) return false;
  if (isAdminOrHr(user)) return true;
  return (
    hasPermission(user, "leave:approve-all") ||
    hasPermission(user, "leave:policy") ||
    hasPermission(user, "leave:balances")
  );
};

export const canApproveLeave = (user: SessionUser | null): boolean => {
  if (!user?.role) return false;
  // Admin/HR org directory + Manager team scope; others need leave:approve-all.
  if (user.role === "Admin" || user.role === "HR" || user.role === "Manager") {
    return true;
  }
  return hasPermission(user, "leave:approve-all");
};

export const canEditLeaveBalances = (user: SessionUser | null): boolean => {
  if (!user?.role) return false;
  if (isAdminOrHr(user)) return true;
  return (
    hasPermission(user, "leave:balances") ||
    hasPermission(user, "leave:direct-edit")
  );
};

export const canManageLeavePolicy = (user: SessionUser | null): boolean => {
  if (!user?.role) return false;
  if (isAdminOrHr(user)) return true;
  return (
    hasPermission(user, "leave:policy") ||
    hasPermission(user, "settings:leave-policy")
  );
};

export const canDirectEditLeave = (user: SessionUser | null): boolean => {
  if (!user?.role) return false;
  if (isAdminOrHr(user)) return true;
  return (
    hasPermission(user, "leave:direct-edit") ||
    hasPermission(user, "regularization:direct-edit")
  );
};

export const canApplyLeave = (user: SessionUser | null): boolean =>
  Boolean(user?.employeeId) ||
  user?.role === "Employee" ||
  user?.role === "Manager" ||
  user?.role === "Intern";

export type LeaveViewMode = "admin" | "manager" | "employee" | "none";

/**
 * Admin/HR → org admin UI.
 * Manager role → My Data / My Team tabs.
 * Linked employee / Employee → self UI.
 */
export const resolveLeaveViewMode = (
  user: SessionUser | null,
): LeaveViewMode => {
  if (canViewOrgLeave(user)) return "admin";
  if (user?.role === "Manager") return "manager";
  if (canApplyLeave(user) || user?.employeeId) return "employee";
  return "none";
};
