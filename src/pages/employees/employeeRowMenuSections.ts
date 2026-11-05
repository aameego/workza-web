import type { EmployeeListItem } from "../../services/employeeTypes";
import type { LetterAccess } from "./letterAccess";
import { employeeLetterActions } from "./employeeLetterActions";
import type { DirectoryTab } from "./employeeListHelpers";

export type MenuSectionKey =
  | "general"
  | "probation"
  | "letters"
  | "convert"
  | "access"
  | "danger";

/** Figma accordion order: GENERAL → PROBATION → LETTERS → CONVERT → ACCESS → DANGER */
export const MENU_SECTION_ORDER: MenuSectionKey[] = [
  "general",
  "probation",
  "letters",
  "convert",
  "access",
  "danger",
];

export const MENU_SECTION_LABEL: Record<MenuSectionKey, string> = {
  general: "General",
  probation: "Probation",
  letters: "Letters",
  convert: "Convert",
  access: "Access",
  danger: "Danger",
};

export type EmployeeRowMenuContext = {
  directory: DirectoryTab;
  canManage: boolean;
  canManageProbation: boolean;
  letterAccess: LetterAccess;
  employee: EmployeeListItem;
};

export const visibleMenuSections = ({
  directory,
  canManage,
  canManageProbation: probationOk,
  letterAccess,
  employee,
}: EmployeeRowMenuContext): MenuSectionKey[] => {
  const letters = employeeLetterActions(letterAccess, employee, {
    canTerminate: false,
  });
  const showProbation =
    directory === "employee" &&
    probationOk &&
    !employee.isConsultancy &&
    employee.employmentStatus === "probation" &&
    !employee.isDeleted &&
    !employee.isExited;

  return MENU_SECTION_ORDER.filter((key) => {
    switch (key) {
      case "general":
        return true;
      case "probation":
        return showProbation;
      case "letters":
        return letters.any;
      case "convert":
        return canManage;
      case "access":
        return canManage && Boolean(employee.hasAppLogin);
      case "danger":
        return canManage;
      default:
        return false;
    }
  });
};
