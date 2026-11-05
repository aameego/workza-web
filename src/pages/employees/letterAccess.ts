import type { SessionUser } from "../../layouts/sessionUser";

export type LetterAccess = {
  canView: boolean;
  canEdit: boolean;
  canIssue: boolean;
  canManageOffers: boolean;
  canIssueConsultancyAgreement: boolean;
};

type AccessUser = SessionUser & {
  allowedModules?: string[];
  permissions?: string[];
};

const FULL_LETTER_ROLES = new Set(["Admin", "HR"]);

const hasPermission = (user: AccessUser | null, permission: string): boolean => {
  if (!user?.role) return false;
  if (user.role === "Admin") return true;
  const perms = Array.isArray(user.permissions) ? user.permissions : [];
  return perms.includes(permission);
};

const hasLettersModule = (user: AccessUser | null): boolean => {
  if (!user?.role) return false;
  if (user.role === "Admin") return true;
  const modules = user.allowedModules;
  if (!Array.isArray(modules)) {
    // Legacy sessions without module lists — Admin/HR keep Letters.
    return FULL_LETTER_ROLES.has(user.role);
  }
  return modules.includes("letters");
};

/** Mirrors CRA getLetterAccess for row-menu letter actions. */
export const getLetterAccess = (user: SessionUser | null): LetterAccess => {
  const accessUser = user as AccessUser | null;
  const hasModule = hasLettersModule(accessUser);
  const canIssue = hasModule && hasPermission(accessUser, "letters:issue");
  const canView = hasModule && hasPermission(accessUser, "letters:view");
  const canEdit = hasModule && hasPermission(accessUser, "letters:templates");
  const canManageOffers = hasModule && hasPermission(accessUser, "letters:offers");

  // Admin/HR without an explicit permissions array still get issue+view (CRA FULL_ACCESS).
  if (hasModule && accessUser?.role && FULL_LETTER_ROLES.has(accessUser.role)) {
    const perms = Array.isArray(accessUser.permissions) ? accessUser.permissions : null;
    if (!perms || perms.length === 0) {
      return {
        canView: true,
        canEdit: accessUser.role === "Admin" || accessUser.role === "HR",
        canIssue: true,
        canManageOffers: true,
        canIssueConsultancyAgreement: true,
      };
    }
  }

  return {
    canView,
    canEdit,
    canIssue,
    canManageOffers,
    canIssueConsultancyAgreement: canIssue,
  };
};

export const canManageEmployees = (role?: string | null): boolean =>
  role === "Admin" || role === "HR";

export const canManageProbation = (role?: string | null): boolean =>
  role === "Admin" || role === "HR";
