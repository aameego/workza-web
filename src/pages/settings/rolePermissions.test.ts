import { describe, expect, it } from "vitest";
import {
  BASELINE_PERMISSIONS,
  ELEVATED_GROUPS,
  elevatedOf,
  moduleCount,
  permissionsToSave,
} from "./rolePermissions";

describe("rolePermissions", () => {
  it("counts distinct modules", () => {
    expect(moduleCount(["leave:view", "leave:apply", "payroll:manage"])).toBe(2);
    expect(moduleCount([])).toBe(0);
  });

  it("always saves the baseline once, plus the selection", () => {
    const saved = permissionsToSave(["payroll:manage", "leave:view"]);
    expect(saved).toHaveLength(BASELINE_PERMISSIONS.length + 1);
    expect(saved).toContain("payroll:manage");
  });

  it("splits out the elevated permissions of a role", () => {
    expect([...elevatedOf([...BASELINE_PERMISSIONS, "employees:view"])]).toEqual(["employees:view"]);
  });

  it("never offers the Administrator-only roles:manage", () => {
    const keys = ELEVATED_GROUPS.flatMap((g) => g.perms.map((p) => p.key));
    expect(keys).not.toContain("roles:manage");
    expect(new Set(keys).size).toBe(keys.length);
  });
});

import { filterRoles, roleNameError } from "./rolePermissions";

describe("roles table filter", () => {
  const roles = [
    { roleName: "Admin", isAdmin: true, isSystem: true, createdAt: "2026-11-20T10:00:00" },
    { roleName: "HR", isSystem: true, createdAt: "2026-11-20T10:00:00" },
    { roleName: "Finance", isSystem: false, createdAt: "2026-11-24T18:30:00" },
  ];
  it("hides Administrator and filters by generation and created day", () => {
    expect(filterRoles(roles, "all", "").map((r) => r.roleName)).toEqual(["HR", "Finance"]);
    expect(filterRoles(roles, "custom", "").map((r) => r.roleName)).toEqual(["Finance"]);
    expect(filterRoles(roles, "all", "2026-11-24").map((r) => r.roleName)).toEqual(["Finance"]);
  });
  it("validates role names like the backend", () => {
    expect(roleNameError("ab")).toMatch(/at least 3/);
    expect(roleNameError("Finance Team")).toBe("");
    expect(roleNameError("Fin@nce")).toMatch(/only contain/);
  });
});
