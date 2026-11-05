import { describe, expect, it } from "vitest";
import { isSignInReady, validateLoginForm } from "./loginValidation";

const base = {
  identifier: "hr@workza.com",
  password: "secret12",
  orgCode: "ACME",
  otp: "",
};

describe("isSignInReady", () => {
  it("requires identifier, password, and org code", () => {
    expect(isSignInReady(base, false)).toBe(true);
    expect(isSignInReady({ ...base, identifier: "  " }, false)).toBe(false);
    expect(isSignInReady({ ...base, password: "" }, false)).toBe(false);
    expect(isSignInReady({ ...base, orgCode: "" }, false)).toBe(false);
  });

  it("requires a 6-digit OTP once 2FA is active", () => {
    expect(isSignInReady({ ...base, otp: "12345" }, true)).toBe(false);
    expect(isSignInReady({ ...base, otp: "123456" }, true)).toBe(true);
  });
});

describe("validateLoginForm", () => {
  it("accepts a complete form", () => {
    expect(validateLoginForm(base, false)).toBeNull();
  });

  it("allows any non-empty password length and rejects bad org codes", () => {
    expect(validateLoginForm({ ...base, password: "short" }, false)).toBeNull();
    expect(validateLoginForm({ ...base, orgCode: "1BAD" }, false)).toMatch(
      /Organization Code/,
    );
  });

  it("requires a numeric 6-digit OTP in 2FA mode", () => {
    expect(validateLoginForm({ ...base, otp: "12ab56" }, true)).toMatch(/OTP/);
    expect(validateLoginForm({ ...base, otp: "654321" }, true)).toBeNull();
  });
});
