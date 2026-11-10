import { describe, expect, it } from "vitest";
import type { SessionUser } from "../../layouts/sessionUser";
import {
  canApproveLeave,
  canDirectEditLeave,
  canEditLeaveBalances,
  canManageLeavePolicy,
  canViewOrgLeave,
  resolveLeaveViewMode,
} from "./leaveAccess";

const user = (overrides: Partial<SessionUser>): SessionUser => ({
  role: "Employee",
  ...overrides,
});

describe("leaveAccess", () => {
  it("grants org leave to Admin and HR", () => {
    expect(canViewOrgLeave(user({ role: "Admin" }))).toBe(true);
    expect(canViewOrgLeave(user({ role: "HR" }))).toBe(true);
    expect(canViewOrgLeave(user({ role: "Employee" }))).toBe(false);
  });

  it("honours leave:approve-all / policy / balances for org view", () => {
    expect(
      canViewOrgLeave(
        user({ role: "Manager", permissions: ["leave:approve-all"] }),
      ),
    ).toBe(true);
    expect(
      canViewOrgLeave(
        user({ role: "Custom", permissions: ["leave:policy"] }),
      ),
    ).toBe(true);
    expect(
      canViewOrgLeave(
        user({ role: "Custom", permissions: ["leave:balances"] }),
      ),
    ).toBe(true);
    expect(
      canViewOrgLeave(
        user({ role: "Custom", permissions: ["leave:approve"] }),
      ),
    ).toBe(false);
  });

  it("allows approve for Admin/HR/Manager or leave:approve-all", () => {
    expect(canApproveLeave(user({ role: "Admin" }))).toBe(true);
    expect(canApproveLeave(user({ role: "HR" }))).toBe(true);
    expect(canApproveLeave(user({ role: "Manager" }))).toBe(true);
    expect(
      canApproveLeave(
        user({ role: "Custom", permissions: ["leave:approve-all"] }),
      ),
    ).toBe(true);
    expect(canApproveLeave(user({ role: "Employee" }))).toBe(false);
  });

  it("allows balance edit for Admin/HR or leave:balances", () => {
    expect(canEditLeaveBalances(user({ role: "HR" }))).toBe(true);
    expect(
      canEditLeaveBalances(
        user({ role: "Custom", permissions: ["leave:balances"] }),
      ),
    ).toBe(true);
    expect(canEditLeaveBalances(user({ role: "Manager" }))).toBe(false);
  });

  it("allows policy manage for Admin/HR or leave:policy", () => {
    expect(canManageLeavePolicy(user({ role: "Admin" }))).toBe(true);
    expect(
      canManageLeavePolicy(
        user({ role: "Custom", permissions: ["settings:leave-policy"] }),
      ),
    ).toBe(true);
    expect(canManageLeavePolicy(user({ role: "Employee" }))).toBe(false);
  });

  it("allows direct edit via leave:direct-edit", () => {
    expect(canDirectEditLeave(user({ role: "Admin" }))).toBe(true);
    expect(
      canDirectEditLeave(
        user({
          role: "Custom",
          permissions: ["regularization:direct-edit"],
        }),
      ),
    ).toBe(true);
  });

  it("resolves view mode by role priority", () => {
    expect(resolveLeaveViewMode(user({ role: "Admin" }))).toBe("admin");
    expect(resolveLeaveViewMode(user({ role: "HR" }))).toBe("admin");
    expect(resolveLeaveViewMode(user({ role: "Manager" }))).toBe("manager");
    expect(
      resolveLeaveViewMode(user({ role: "Employee", employeeId: "e1" })),
    ).toBe("employee");
    expect(resolveLeaveViewMode(user({ role: "Guest" }))).toBe("none");
  });
});
