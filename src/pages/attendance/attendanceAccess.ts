import type { SessionUser } from "../../layouts/sessionUser";

type AccessUser = SessionUser & {
  permissions?: string[];
};

const permissionList = (user: AccessUser | null): string[] =>
  Array.isArray(user?.permissions) ? user!.permissions! : [];

/**
 * Mirrors CRA `roleHasPermission` attendance implications:
 * - Admin always
 * - attendance:view-team implied by view-org or manage
 */
const hasPermission = (
  user: AccessUser | null,
  permission: string,
): boolean => {
  if (!user?.role) return false;
  if (user.role === "Admin") return true;
  const perms = permissionList(user);
  if (perms.includes(permission)) return true;
  if (
    permission === "attendance:view-team" &&
    (perms.includes("attendance:view-org") ||
      perms.includes("attendance:manage"))
  ) {
    return true;
  }
  if (
    permission === "attendance:view" &&
    (perms.includes("attendance:view-org") ||
      perms.includes("attendance:view-team") ||
      perms.includes("attendance:manage"))
  ) {
    return true;
  }
  return false;
};

/** Admin / HR role shortcuts used by backend `authorizeRolesOrPermission("Admin","HR")`. */
const isAdminOrHr = (user: SessionUser | null): boolean =>
  user?.role === "Admin" || user?.role === "HR";

/**
 * Organization-wide attendance (Figma attendance-admin).
 * CRA: Admin | attendance:view-org | attendance:manage.
 * HR is included because the catalog grants those elevated perms and
 * backend org tools treat HR as an authorized role.
 */
export const canViewOrgAttendance = (user: SessionUser | null): boolean => {
  if (!user?.role) return false;
  if (user.role === "Admin" || user.role === "HR") return true;
  return (
    hasPermission(user, "attendance:view-org") ||
    hasPermission(user, "attendance:manage")
  );
};

/** Team attendance (manager My Team). */
export const canViewTeamAttendance = (user: SessionUser | null): boolean => {
  if (!user?.role) return false;
  if (user.role === "Admin") return true;
  return hasPermission(user, "attendance:view-team");
};

/**
 * Daily Mark Attendance (POST /attendance/mark).
 * CRA: Admin | attendance:mark — manage alone does NOT grant daily mark.
 */
export const canMarkAttendance = (user: SessionUser | null): boolean => {
  if (!user?.role) return false;
  if (user.role === "Admin") return true;
  return hasPermission(user, "attendance:mark");
};

/**
 * Month mark, bulk upload, monthly reports — Admin/HR or attendance:manage.
 */
export const canManageAttendance = (user: SessionUser | null): boolean => {
  if (!user?.role) return false;
  if (isAdminOrHr(user)) return true;
  return hasPermission(user, "attendance:manage");
};

/**
 * Row correction via POST /regularization/direct/attendance.
 * Backend: Admin/HR or regularization:direct-edit or attendance:manage.
 */
export const canDirectEditAttendance = (user: SessionUser | null): boolean => {
  if (!user?.role) return false;
  if (isAdminOrHr(user)) return true;
  return (
    hasPermission(user, "regularization:direct-edit") ||
    hasPermission(user, "attendance:manage")
  );
};

/**
 * Org report download needs manage; team/self download stays open for viewers.
 */
export const canDownloadAttendanceReport = (
  user: SessionUser | null,
  target: "org" | "team" | "self" | string,
): boolean => {
  if (target === "org") return canManageAttendance(user);
  if (target === "team") return canViewTeamAttendance(user);
  return canSelfCheckIn(user) || canViewOrgAttendance(user);
};

/** Self check-in when user has a linked employee profile. */
export const canSelfCheckIn = (user: SessionUser | null): boolean =>
  Boolean(user?.employeeId);

export type AttendanceViewMode = "admin" | "manager" | "employee" | "none";

export const resolveAttendanceViewMode = (
  user: SessionUser | null,
): AttendanceViewMode => {
  if (canViewOrgAttendance(user)) return "admin";
  if (canViewTeamAttendance(user)) return "manager";
  if (canSelfCheckIn(user) || user?.role === "Employee") return "employee";
  return "none";
};
