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

/**
 * CRA canViewDepartments: Admin/HR always, else departments:view|manage.
 * departments:manage also implies view.
 */
export const canViewDepartments = (user: SessionUser | null): boolean => {
  if (!user?.role) return false;
  if (isAdminOrHr(user)) return true;
  return (
    hasPermission(user, "departments:view") ||
    hasPermission(user, "departments:manage")
  );
};

/** CRA: Admin always, else departments:manage */
export const canManageDepartments = (user: SessionUser | null): boolean => {
  if (!user?.role) return false;
  if (user.role === "Admin") return true;
  return hasPermission(user, "departments:manage");
};
