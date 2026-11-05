import { describe, expect, it } from "vitest";
import { isNavPathActive, normalizeAppPath, titleForPath } from "./navConfig";

describe("titleForPath", () => {
  it("titles add-employee under vendor slug", () => {
    expect(titleForPath("/acme/employees/new")).toBe("Add New Employee");
  });

  it("titles employee list", () => {
    expect(titleForPath("/acme/employees")).toBe("Employees");
  });
});

describe("isNavPathActive", () => {
  it("keeps Employees active on add screen", () => {
    expect(isNavPathActive("/employees/new", "/employees")).toBe(true);
    expect(isNavPathActive("/employees", "/employees")).toBe(true);
    expect(isNavPathActive("/employees", "/dashboard")).toBe(false);
  });
});

describe("normalizeAppPath", () => {
  it("strips vendor slug including nested routes", () => {
    expect(normalizeAppPath("/acme/employees/new")).toBe("/employees/new");
  });
});
