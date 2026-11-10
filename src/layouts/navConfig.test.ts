import { describe, expect, it } from "vitest";
import {
  crumbsForPath,
  isNavPathActive,
  normalizeAppPath,
  titleForPath,
} from "./navConfig";

describe("titleForPath", () => {
  it("titles add-employee under vendor slug", () => {
    expect(titleForPath("/acme/employees/new")).toBe("Add New Employee");
  });

  it("titles employee list", () => {
    expect(titleForPath("/acme/employees")).toBe("Employees");
  });

  it("titles edit employee like Figma", () => {
    expect(titleForPath("/acme/employees/abc123/edit")).toBe(
      "Edit Employee Details",
    );
  });
});

describe("crumbsForPath", () => {
  it("builds Employees → Edit Employee Details", () => {
    expect(crumbsForPath("/acme/employees/abc123/edit")).toEqual([
      { label: "Employees", path: "/employees" },
      { label: "Edit Employee Details" },
    ]);
  });

  it("builds Employees → Add New Employee", () => {
    expect(crumbsForPath("/acme/employees/new")).toEqual([
      { label: "Employees", path: "/employees" },
      { label: "Add New Employee" },
    ]);
  });

  it("returns no crumbs on top-level pages", () => {
    expect(crumbsForPath("/acme/employees")).toEqual([]);
    expect(crumbsForPath("/acme/dashboard")).toEqual([]);
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
