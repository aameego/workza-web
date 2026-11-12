import type { LetterTemplateSummary } from "../../services/letterTypes";

const isActive = (template: LetterTemplateSummary): boolean =>
  !template.archived && template.status !== "archived";

/** Active templates matching recipient type / rule (CRA filterIssuableTemplates). */
export const filterIssuableTemplates = (
  templates: LetterTemplateSummary[],
  {
    recipientRule = null,
    recipientType = "",
  }: { recipientRule?: string | null; recipientType?: string } = {},
): LetterTemplateSummary[] =>
  templates.filter(
    (t) =>
      isActive(t) &&
      (!recipientRule || t.recipientRule === recipientRule) &&
      (!recipientType || t.recipientType === recipientType),
  );

export const issuedLetterFileName = (letter: {
  letterNumber?: string;
}): string =>
  `${String(letter?.letterNumber || "letter").replace(/[^\w-]+/g, "_")}.pdf`;

/** Figma copy for the details section of the built-in letters; other templates use backend labels. */
export const LETTER_FORM_COPY: Record<
  string,
  { title: string; subtitle: string; labels: Record<string, string> }
> = {
  warning: {
    title: "Incident Details",
    subtitle: "Provide details regarding the incident & action",
    labels: {
      incidentDate: "Incident Date",
      severity: "Warning Severity",
      responsePeriod: "Response Period (days)",
      reason: "Reason for Warning",
      actionTaken: "Action Taken",
    },
  },
  termination: {
    title: "Termination Details",
    subtitle: "Provide details regarding the termination",
    labels: {
      terminationDate: "Last Working Date",
      noticePeriod: "Notice Period (payment in lieu)",
      reason: "Reason for Termination",
    },
  },
};

export const letterFormCopy = (key?: string) =>
  LETTER_FORM_COPY[key || ""] || {
    title: "Letter Details",
    subtitle: "Provide details to be printed on the letter",
    labels: {} as Record<string, string>,
  };
