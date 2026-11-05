import { describe, expect, it } from "vitest";
import type { EmployeeListItem } from "../../services/employeeTypes";
import {
  APP_LOGIN_FILTER_OPTIONS,
  STATUS_FILTER_OPTIONS,
  appLoginBadge,
  appLoginLabel,
  employmentActiveBadge,
  employmentActiveLabel,
  employmentTypeLabel,
  pageWindowLabel,
  paginationItems,
} from "./employeeListHelpers";

const base = (overrides: Partial<EmployeeListItem> = {}): EmployeeListItem => ({
  _id: "1",
  name: "Asha",
  isActive: true,
  ...overrides,
});

describe("employeeListHelpers", () => {
  it("labels employment status", () => {
    expect(employmentActiveLabel(base())).toBe("Active");
    expect(employmentActiveBadge(base())).toBe("success");
    expect(employmentActiveLabel(base({ isActive: false }))).toBe("Inactive");
    expect(employmentActiveBadge(base({ isExited: true }))).toBe("error");
  });

  it("labels employment type", () => {
    expect(employmentTypeLabel(base({ employmentStatus: "probation" }))).toBe(
      "Probation",
    );
    expect(employmentTypeLabel(base({ employmentStatus: "full-time" }))).toBe(
      "Full-Time",
    );
    expect(employmentTypeLabel(base({ isConsultancy: true }))).toBe(
      "Consultant",
    );
  });

  it("labels app login", () => {
    expect(appLoginLabel(base({ hasAppLogin: false }))).toBe("No Login");
    expect(appLoginBadge(base({ hasAppLogin: false }))).toBe("neutral");
    expect(
      appLoginLabel(base({ hasAppLogin: true, hasLoginEnabled: true })),
    ).toBe("Enabled");
    expect(
      appLoginBadge(base({ hasAppLogin: true, hasLoginEnabled: false })),
    ).toBe("warning");
  });

  it("formats pagination window", () => {
    expect(pageWindowLabel(1, 10, 0)).toBe("Showing 0 of 0 employees");
    expect(pageWindowLabel(2, 10, 84)).toBe("Showing 11-20 of 84 employees");
  });

  it("builds compact page items", () => {
    expect(paginationItems(1, 3)).toEqual([1, 2, 3]);
    expect(paginationItems(1, 21)).toEqual([1, 2, "ellipsis", 21]);
    expect(paginationItems(10, 21)).toContain("ellipsis");
    expect(paginationItems(10, 21)).toContain(10);
  });

  it("exposes Figma filter placeholders", () => {
    expect(STATUS_FILTER_OPTIONS[0]?.label).toBe("Employee Status");
    expect(APP_LOGIN_FILTER_OPTIONS.map((o) => o.value)).toEqual([
      "",
      "enabled",
      "disabled",
      "none",
    ]);
  });
});
