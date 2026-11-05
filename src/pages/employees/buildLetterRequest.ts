import type {
  IssueLetterPayload,
  LetterTemplate,
} from "../../services/letterTypes";

export type LetterRecipient = {
  _id: string;
};

/** Mirrors CRA buildLetterRequest for employee-issued letters. */
export const buildLetterRequest = ({
  template,
  recipient,
  values = {},
  editedHtml = null,
  sendEmail = false,
  replacesLetterId = "",
}: {
  template: LetterTemplate;
  recipient: LetterRecipient;
  values?: Record<string, string>;
  editedHtml?: string | null;
  sendEmail?: boolean;
  replacesLetterId?: string;
}): IssueLetterPayload => ({
  templateId: template._id,
  recipientType: template.recipientType || "employee",
  ...(template.recipientType === "candidate"
    ? { candidateId: recipient._id }
    : { employeeId: recipient._id }),
  values: Object.fromEntries(
    (template.inputFields || []).map((field) => [
      field.key,
      values[field.key] ?? "",
    ]),
  ),
  ...(editedHtml ? { editedHtml } : {}),
  ...(sendEmail ? { sendEmail: true } : {}),
  ...(replacesLetterId ? { replacesLetterId } : {}),
});

export const validateRequiredLetterValues = (
  template: LetterTemplate,
  values: Record<string, string>,
): string | null => {
  for (const field of template.inputFields || []) {
    if (!field.required) continue;
    const value = String(values[field.key] ?? "").trim();
    if (!value) {
      return `${field.label || field.key} is required`;
    }
  }
  return null;
};
