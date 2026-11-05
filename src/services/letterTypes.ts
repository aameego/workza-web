export type LetterRecipientType = "employee" | "candidate";

export type LetterTemplateInputField = {
  key: string;
  label: string;
  kind?: string;
  required?: boolean;
  multiline?: boolean;
  options?: string[];
  choices?: boolean;
  min?: number;
  max?: number;
  integer?: boolean;
};

export type LetterTemplateSummary = {
  _id: string;
  name?: string;
  key?: string;
  category?: string;
  recipientType?: LetterRecipientType;
  recipientRule?: string | null;
  status?: string;
  archived?: boolean;
  isOffer?: boolean;
  inputFields?: LetterTemplateInputField[];
};

export type LetterTemplate = LetterTemplateSummary & {
  bodyHtml?: string;
  version?: number;
};

export type IssueLetterPayload = {
  templateId: string;
  recipientType: LetterRecipientType;
  employeeId?: string;
  candidateId?: string;
  values?: Record<string, string>;
  editedHtml?: string;
  sendEmail?: boolean;
  replacesLetterId?: string;
};

export type IssuedLetter = {
  _id: string;
  letterNumber?: string;
  templateName?: string;
  employeeId?: string;
  emailedAt?: string | null;
};

export type IssueLetterResult = {
  letter?: IssuedLetter;
  fileUrl?: string;
  emailed?: boolean;
  emailError?: string;
};
