import type { Signatory } from "../../services/organizationService";

/**
 * Organisation profile validation — mirrors AameegoGig-Frontend validation rules
 * (src/utils/inputValidation.js) and the backend validateOrgProfileUpdate.
 *
 * Field rules (backend ORG_PROFILE_FIELDS):
 *   name            → required, display_name (min 2, safe text, max 120)
 *   companyAddress  → long_text (max 500, prose-safe)
 *   contactEmail    → required, email (strict format)
 *   signatoryName   → person_name (letters + spaces only)
 *   signatoryTitle  → display_name (min 2, safe text)
 *   employeeCodePrefix → required, 2–6 letters/numbers, uppercase, no specials
 */

const LIMITS = {
  TEXT_SHORT: 120,
  TEXT_LONG: 2000,
  EMAIL_MAX: 254,
} as const;

const PATTERNS = {
  EMAIL: /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/,
  PERSON_NAME: /^[A-Za-z][\sA-Za-z.]*$/,
  DISPLAY_NAME: /^[\w\s.,()\-/&'+]{2,120}$/u,
  IDENTIFIER_CODE: /^[A-Z][A-Z0-9_]{1,31}$/,
  EMPLOYEE_CODE: /^[A-Za-z0-9_-]{2,32}$/,
} as const;

const UNSAFE_TEXT_REGEX = /[<>"'`;\\{}]|script|javascript|onerror|onload/i;
const UNSAFE_PROSE_REGEX = /[<>]|\{\{|\}\}|javascript\s*:|\bon[a-z]+\s*=/i;

const isBlank = (value: unknown) =>
  value == null ||
  (typeof value === "string" && value.trim() === "");

const validateSafeText = (
  value: string,
  label: string,
  maxLength: number | { maxLength: number } = LIMITS.TEXT_SHORT,
): string | null => {
  const limit = typeof maxLength === "number" ? maxLength : maxLength.maxLength;
  const str = String(value);
  if (UNSAFE_TEXT_REGEX.test(str)) {
    return `${label} contains invalid or unsafe characters`;
  }
  if (str.length > limit) {
    return `${label} must be at most ${limit} characters`;
  }
  return null;
};

/** Strict email check mirroring AameegoGig-Frontend isValidEmailFormat. */
const isValidEmailFormat = (value: string): boolean => {
  const v = String(value || "").trim();
  if (!v || v.length > LIMITS.EMAIL_MAX || /\s/.test(v)) return false;
  if (!PATTERNS.EMAIL.test(v)) return false;
  if (v.includes("..")) return false;
  const parts = v.split("@");
  if (parts.length !== 2) return false;
  const [local, domain] = parts;
  if (!local || !domain) return false;
  if (local.length > 64) return false;
  if (local.startsWith(".") || local.endsWith(".")) return false;
  if (
    domain.startsWith(".") ||
    domain.endsWith(".") ||
    domain.startsWith("-") ||
    domain.endsWith("-")
  )
    return false;
  const labels = domain.split(".");
  if (labels.length < 2) return false;
  for (const label of labels) {
    if (!label || label.length > 63) return false;
    if (label.startsWith("-") || label.endsWith("-")) return false;
  }
  const tld = labels[labels.length - 1];
  if (!/^[A-Za-z]{2,}$/.test(tld)) return false;
  return true;
};

export type OrgFieldErrors = Partial<Record<keyof OrgFormData, string>>;

export type OrgFormData = {
  name: string;
  code: string;
  employeeCodePrefix: string;
  contactEmail: string;
  companyAddress: string;
  signatoryName: string;
  signatoryTitle: string;
  allowMultipleSignatures: boolean;
  signatories: Signatory[];
};

const required = (value: unknown, label: string): string | null =>
  isBlank(value) ? `${label} is required` : null;

/**
 * Validate every field of the organisation profile form.
 * Returns an object of field → error message (empty when valid).
 */
export const validateOrganizationForm = (data: OrgFormData): OrgFieldErrors => {
  const errors: OrgFieldErrors = {};

  // --- name (required, display_name) ---
  if (required(data.name, "Company name")) {
    errors.name = "Company name is required";
  } else {
    const nameErr = validateSafeText(data.name.trim(), "Company name");
    if (nameErr) errors.name = nameErr;
    else if (!PATTERNS.DISPLAY_NAME.test(data.name.trim())) {
      errors.name = "Company name contains unsupported special characters";
    } else if (data.name.trim().length < 2) {
      errors.name = "Company name must be at least 2 characters";
    }
  }

  // --- code (required, identifier_code style: letters-led, 2–32) ---
  if (required(data.code, "Organization code")) {
    errors.code = "Organization code is required";
  } else {
    const v = String(data.code).trim().toUpperCase();
    if (!PATTERNS.IDENTIFIER_CODE.test(v)) {
      errors.code =
        "Organization code must use only A-Z, 0-9, and underscore (2–32 chars, start with a letter)";
    }
  }

  // --- employeeCodePrefix (required, 2–6 letters/numbers, uppercase) ---
  if (required(data.employeeCodePrefix, "Employee code prefix")) {
    errors.employeeCodePrefix = "Employee code prefix is required";
  } else {
    const cleaned = String(data.employeeCodePrefix)
      .trim()
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, "");
    if (cleaned.length < 2 || cleaned.length > 6) {
      errors.employeeCodePrefix =
        "Employee code prefix must be 2–6 letters or numbers.";
    }
  }

  // --- contactEmail (required, strict email) ---
  if (required(data.contactEmail, "HR / Payroll contact email")) {
    errors.contactEmail = "HR / Payroll contact email is required";
  } else {
    const safe = validateSafeText(data.contactEmail, "Contact email", {
      maxLength: LIMITS.EMAIL_MAX,
    });
    if (safe) errors.contactEmail = safe;
    else if (!isValidEmailFormat(data.contactEmail)) {
      errors.contactEmail = "Contact email must be a valid email address";
    }
  }

  // --- companyAddress (long_text, prose-safe, max 500) ---
  if (data.companyAddress) {
    const safe = validateSafeText(
      data.companyAddress,
      "Company address",
      LIMITS.TEXT_LONG,
    );
    if (safe) errors.companyAddress = safe;
    else if (UNSAFE_PROSE_REGEX.test(data.companyAddress)) {
      errors.companyAddress = "Company address contains invalid or unsafe characters";
    } else if (data.companyAddress.length > 500) {
      errors.companyAddress = "Company address must be at most 500 characters";
    }
  }

  // --- signatoryName (person_name: letters + spaces only) ---
  if (data.signatoryName) {
    const safe = validateSafeText(data.signatoryName, "Authorised signatory name");
    if (safe) errors.signatoryName = safe;
    else if (!PATTERNS.PERSON_NAME.test(data.signatoryName.trim())) {
      errors.signatoryName =
        "Authorised signatory name must contain only letters and spaces";
    }
  }

  // --- signatoryTitle (display_name: min 2, safe text) ---
  if (data.signatoryTitle) {
    const safe = validateSafeText(data.signatoryTitle, "Signatory designation");
    if (safe) errors.signatoryTitle = safe;
    else if (!PATTERNS.DISPLAY_NAME.test(data.signatoryTitle.trim())) {
      errors.signatoryTitle = "Signatory designation contains unsupported special characters";
    } else if (data.signatoryTitle.trim().length < 2) {
      errors.signatoryTitle = "Signatory designation must be at least 2 characters";
    }
  }

  return errors;
};

/** Validate a single field on blur/change. Returns the error message or null. */
export const validateOrganizationField = (
  name: keyof OrgFormData,
  value: string,
): string | null => {
  switch (name) {
    case "name":
      if (isBlank(value)) return "Company name is required";
      if (!PATTERNS.DISPLAY_NAME.test(value.trim()))
        return "Company name contains unsupported special characters";
      if (value.trim().length < 2)
        return "Company name must be at least 2 characters";
      return validateSafeText(value.trim(), "Company name");

    case "code":
      if (isBlank(value)) return "Organization code is required";
      {
        const v = String(value).trim().toUpperCase();
        if (!PATTERNS.IDENTIFIER_CODE.test(v)) {
          return "Organization code must use only A-Z, 0-9, and underscore (2–32 chars, start with a letter)";
        }
      }
      return null;

    case "employeeCodePrefix":
      if (isBlank(value)) return "Employee code prefix is required";
      {
        const cleaned = String(value)
          .trim()
          .toUpperCase()
          .replace(/[^A-Z0-9]/g, "");
        if (cleaned.length < 2 || cleaned.length > 6)
          return "Employee code prefix must be 2–6 letters or numbers.";
      }
      return null;

    case "contactEmail":
      if (isBlank(value)) return "HR / Payroll contact email is required";
      if (!isValidEmailFormat(value)) return "Contact email must be a valid email address";
      return validateSafeText(value, "Contact email", {
        maxLength: LIMITS.EMAIL_MAX,
      });

    case "companyAddress":
      if (UNSAFE_PROSE_REGEX.test(value))
        return "Company address contains invalid or unsafe characters";
      if (value.length > 500) return "Company address must be at most 500 characters";
      return validateSafeText(value, "Company address", LIMITS.TEXT_LONG);

    case "signatoryName":
      if (!PATTERNS.PERSON_NAME.test(value.trim()))
        return "Authorised signatory name must contain only letters and spaces";
      return validateSafeText(value, "Authorised signatory name");

    case "signatoryTitle":
      if (value.trim() && !PATTERNS.DISPLAY_NAME.test(value.trim()))
        return "Signatory designation contains unsupported special characters";
      if (value.trim().length > 0 && value.trim().length < 2)
        return "Signatory designation must be at least 2 characters";
      return validateSafeText(value, "Signatory designation");

    default:
      return null;
  }
};
