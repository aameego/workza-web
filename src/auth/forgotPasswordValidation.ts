/** Complete org codes look like AMG8548 (letters + digits). */
export const FORGOT_ORG_CODE_PATTERN = /^[A-Z]{2,10}-?[0-9]{3,8}$/;

export const isValidEmailFormat = (value: string) =>
  /\S+@\S+\.\S+/.test(String(value || "").trim());

export const maskContact = (emailOrPhone: string) => {
  const value = String(emailOrPhone || "").trim();
  if (value.includes("@")) {
    return value.replace(/(.{1}).*(@.*)/, "$1***e$2");
  }
  return `+91 ${value.replace(/.(?=.{4})/g, "•")}`;
};

export const validateForgotIdentify = (
  vendorCode: string,
  emailOrPhone: string,
): string | null => {
  const code = String(vendorCode || "").trim().toUpperCase();
  const contact = String(emailOrPhone || "").trim();
  if (!contact || !code) {
    return "Email/Phone or Organization Code is required";
  }
  if (contact.includes("@") && !isValidEmailFormat(contact)) {
    return "Please enter a valid registered email ID";
  }
  if (!FORGOT_ORG_CODE_PATTERN.test(code)) {
    return "Please enter a complete, valid Organization Code";
  }
  return null;
};

export const isResetPasswordReady = (
  newPassword: string,
  confirmPassword: string,
) =>
  newPassword.length >= 5 &&
  confirmPassword.length >= 5 &&
  newPassword === confirmPassword;

export const validateResetPassword = (
  newPassword: string,
  confirmPassword: string,
): string | null => {
  if (!newPassword || !confirmPassword) {
    return "Please enter and confirm your new password";
  }
  if (newPassword.length < 5) {
    return "Password must be at least 5 characters";
  }
  if (newPassword !== confirmPassword) {
    return "Passwords do not match.";
  }
  return null;
};
