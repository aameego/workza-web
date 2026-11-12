import { describe, expect, it } from "vitest";
import type { SessionUser } from "../../layouts/sessionUser";
import { canManageDepartments, canViewDepartments } from "./departmentAccess";

const user = (
  role: string,
  permissions: string[] = [],
): SessionUser => ({ role, permissions });

describe("departmentAccess", () => {
  it("lets Admin view and manage", () => {
    expect(canViewDepartments(user("Admin"))).toBe(true);
    expect(canManageDepartments(user("Admin"))).toBe(true);
  });

  it("lets HR view; manage only with permission", () => {
    expect(canViewDepartments(user("HR"))).toBe(true);
    expect(canManageDepartments(user("HR"))).toBe(false);
    expect(canManageDepartments(user("HR", ["departments:manage"]))).toBe(
      true,
    );
  });

  it("treats Admin as full access without explicit permissions", () => {
    expect(canManageDepartments(user("Admin"))).toBe(true);
  });

  it("requires permission for other roles", () => {
    expect(canViewDepartments(user("Manager"))).toBe(false);
    expect(canViewDepartments(user("Manager", ["departments:view"]))).toBe(
      true,
    );
    expect(
      canManageDepartments(user("Manager", ["departments:manage"])),
    ).toBe(true);
  });
});
