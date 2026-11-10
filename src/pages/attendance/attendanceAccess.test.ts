import { describe, expect, it } from "vitest";
import type { SessionUser } from "../../layouts/sessionUser";
import {
  canDirectEditAttendance,
  canDownloadAttendanceReport,
  canManageAttendance,
  canMarkAttendance,
  canSelfCheckIn,
  canViewOrgAttendance,
  canViewTeamAttendance,
  resolveAttendanceViewMode,
} from "./attendanceAccess";

const user = (overrides: Partial<SessionUser>): SessionUser => ({
  role: "Employee",
  ...overrides,
});

describe("attendanceAccess", () => {
  it("grants org view to Admin and HR", () => {
    expect(canViewOrgAttendance(user({ role: "Admin" }))).toBe(true);
    expect(canViewOrgAttendance(user({ role: "HR" }))).toBe(true);
    expect(canViewOrgAttendance(user({ role: "Employee" }))).toBe(false);
  });

  it("honours attendance:view-org and manage for org view", () => {
    expect(
      canViewOrgAttendance(
        user({ role: "Manager", permissions: ["attendance:view-org"] }),
      ),
    ).toBe(true);
    expect(
      canViewOrgAttendance(
        user({ role: "Custom", permissions: ["attendance:manage"] }),
      ),
    ).toBe(true);
    expect(
      canViewOrgAttendance(
        user({ role: "Custom", permissions: ["attendance:mark"] }),
      ),
    ).toBe(false);
  });

  it("grants team view via permission or org implication", () => {
    expect(
      canViewTeamAttendance(
        user({ role: "Manager", permissions: ["attendance:view-team"] }),
      ),
    ).toBe(true);
    expect(
      canViewTeamAttendance(
        user({ role: "Custom", permissions: ["attendance:view-org"] }),
      ),
    ).toBe(true);
    expect(canViewTeamAttendance(user({ role: "Employee" }))).toBe(false);
  });

  it("allows mark for Admin or attendance:mark only", () => {
    expect(canMarkAttendance(user({ role: "Admin" }))).toBe(true);
    expect(
      canMarkAttendance(
        user({ role: "HR", permissions: ["attendance:mark"] }),
      ),
    ).toBe(true);
    expect(
      canMarkAttendance(
        user({ role: "Custom", permissions: ["attendance:manage"] }),
      ),
    ).toBe(false);
  });

  it("allows manage for Admin/HR or attendance:manage", () => {
    expect(canManageAttendance(user({ role: "HR" }))).toBe(true);
    expect(
      canManageAttendance(
        user({ role: "Custom", permissions: ["attendance:manage"] }),
      ),
    ).toBe(true);
  });

  it("allows direct edit for Admin/HR or direct-edit/manage", () => {
    expect(canDirectEditAttendance(user({ role: "HR" }))).toBe(true);
    expect(
      canDirectEditAttendance(
        user({ role: "Custom", permissions: ["regularization:direct-edit"] }),
      ),
    ).toBe(true);
    expect(
      canDirectEditAttendance(
        user({ role: "Custom", permissions: ["attendance:mark"] }),
      ),
    ).toBe(false);
  });

  it("requires manage for org download; team needs team view", () => {
    expect(
      canDownloadAttendanceReport(user({ role: "HR" }), "org"),
    ).toBe(true);
    expect(
      canDownloadAttendanceReport(
        user({ role: "Custom", permissions: ["attendance:view-org"] }),
        "org",
      ),
    ).toBe(false);
    expect(
      canDownloadAttendanceReport(
        user({ role: "Manager", permissions: ["attendance:view-team"] }),
        "team",
      ),
    ).toBe(true);
  });

  it("allows self check-in when employeeId is linked", () => {
    expect(canSelfCheckIn(user({ employeeId: "e1" }))).toBe(true);
    expect(canSelfCheckIn(user({}))).toBe(false);
  });

  it("resolves view mode in admin → manager → employee order", () => {
    expect(resolveAttendanceViewMode(user({ role: "Admin" }))).toBe("admin");
    expect(
      resolveAttendanceViewMode(
        user({ role: "Manager", permissions: ["attendance:view-team"] }),
      ),
    ).toBe("manager");
    expect(
      resolveAttendanceViewMode(
        user({ role: "Employee", employeeId: "e1" }),
      ),
    ).toBe("employee");
    expect(resolveAttendanceViewMode(null)).toBe("none");
  });
});
