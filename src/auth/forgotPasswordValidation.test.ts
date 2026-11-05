import { describe, expect, it } from "vitest";
import {
  isResetPasswordReady,
  maskContact,
  validateForgotIdentify,
  validateResetPassword,
} from "./forgotPasswordValidation";

describe("validateForgotIdentify", () => {
  it("accepts a complete org code and contact", () => {
    expect(validateForgotIdentify("AMG8548", "hr@workza.com")).toBeNull();
  });

  it("rejects incomplete org codes and bad emails", () => {
    expect(validateForgotIdentify("AMG", "hr@workza.com")).toMatch(
      /Organization Code/,
    );
    expect(validateForgotIdentify("AMG8548", "not-an-email@")).toMatch(
      /email/,
    );
  });
});

describe("maskContact", () => {
  it("masks email and phone for the OTP subtitle", () => {
    expect(maskContact("name@workza.com")).toContain("***e@");
    expect(maskContact("9876543210")).toMatch(/\+91/);
  });
});

describe("reset password gates", () => {
  it("requires matching passwords of at least 5 characters", () => {
    expect(isResetPasswordReady("abcd", "abcd")).toBe(false);
    expect(isResetPasswordReady("abc12", "abc12")).toBe(true);
    expect(validateResetPassword("secret", "other")).toMatch(/match/i);
    expect(validateResetPassword("secret1", "secret1")).toBeNull();
  });
});
