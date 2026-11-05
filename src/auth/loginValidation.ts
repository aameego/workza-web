export type LoginFormValues = {
  identifier: string;
  password: string;
  orgCode: string;
  otp: string;
};

/** Sign In stays disabled until every visible required field has a value. */
export const isSignInReady = (
  form: LoginFormValues,
  is2FA: boolean,
): boolean =>
  form.identifier.trim() !== "" &&
  form.password !== "" &&
  form.orgCode.trim() !== "" &&
  (!is2FA || form.otp.trim().length === 6);

const ORG_CODE_PATTERN = /^[A-Z][A-Z0-9_]{1,31}$/;

/**
 * Submit-time validation. Returns the first field error, or null when valid.
 * Org codes match the shared identifier_code rule (A-Z / 0-9 / underscore).
 */
export const validateLoginForm = (
  form: LoginFormValues,
  is2FA: boolean,
): string | null => {
  if (!form.identifier.trim()) {
    return "Work Email or Mobile Number is required";
  }
  if (!form.password) {
    return "Password is required";
  }
  const org = form.orgCode.trim().toUpperCase();
  if (!org) {
    return "Organization Code is required";
  }
  if (!ORG_CODE_PATTERN.test(org)) {
    return "Organization Code must use only A-Z, 0-9, and underscore (2–32 chars, start with a letter)";
  }
  if (is2FA) {
    if (!/^\d{6}$/.test(form.otp.trim())) {
      return "Verification Code must be a 6-digit OTP";
    }
  }
  return null;
};
