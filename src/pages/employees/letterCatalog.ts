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
