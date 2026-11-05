import type { LetterAccess } from "./letterAccess";

export type EmployeeLetterTarget = {
  isConsultancy?: boolean;
};

/**
 * Letters actions in an Employees row menu — keep in sync with
 * AameegoGig-Frontend/src/utils/lettersNavigation.js employeeLetterActions.
 */
export const employeeLetterActions = (
  access: LetterAccess = {
    canView: false,
    canEdit: false,
    canIssue: false,
    canManageOffers: false,
    canIssueConsultancyAgreement: false,
  },
  employee: EmployeeLetterTarget = {},
  { canTerminate = false }: { canTerminate?: boolean } = {},
) => {
  const issue = Boolean(access.canIssue);
  const viewIssued = Boolean(access.canView);
  const consultancyAgreement =
    !issue &&
    Boolean(access.canIssueConsultancyAgreement) &&
    Boolean(employee.isConsultancy);
  const termination = Boolean(canTerminate);
  return {
    issue,
    viewIssued,
    consultancyAgreement,
    termination,
    any: issue || viewIssued || consultancyAgreement || termination,
  };
};

export const CONSULTANCY_RECIPIENT_RULE = "consultancy";

export const issuedLettersPath = (
  vendorSlug: string,
  { recipientId }: { recipientId: string },
) =>
  `/${vendorSlug}/letters?tab=issued&forRecipient=${encodeURIComponent(recipientId)}&forType=employee`;
