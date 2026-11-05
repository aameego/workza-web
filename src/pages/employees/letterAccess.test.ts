import { describe, expect, it } from "vitest";
import { canManageEmployees, getLetterAccess } from "./letterAccess";

describe("getLetterAccess", () => {
  it("gives Admin full letter access without explicit permissions", () => {
    expect(getLetterAccess({ role: "Admin" })).toMatchObject({
      canView: true,
      canIssue: true,
      canManageOffers: true,
    });
  });

  it("gives HR issue+view when modules/permissions are omitted", () => {
    expect(getLetterAccess({ role: "HR" })).toMatchObject({
      canView: true,
      canIssue: true,
    });
  });

  it("denies employees without letters module", () => {
    expect(
      getLetterAccess({
        role: "Employee",
        allowedModules: ["attendance"],
        permissions: [],
      } as never),
    ).toMatchObject({
      canView: false,
      canIssue: false,
    });
  });
});

describe("canManageEmployees", () => {
  it("allows Admin and HR only", () => {
    expect(canManageEmployees("Admin")).toBe(true);
    expect(canManageEmployees("HR")).toBe(true);
    expect(canManageEmployees("Employee")).toBe(false);
  });
});
