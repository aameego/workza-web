import { describe, expect, it } from "vitest";
import {
  buildEmployeeBulkTemplateRows,
  formatBulkUploadMessage,
  isExcelUploadFile,
} from "./employeeBulkTemplate";

describe("buildEmployeeBulkTemplateRows", () => {
  it("keeps title row then headers then sample", () => {
    const rows = buildEmployeeBulkTemplateRows({
      orgUnitLabel: "Department",
      sampleStructureName: "Standard CTC",
    });
    expect(rows).toHaveLength(3);
    expect(String(rows[0][0])).toMatch(/Bulk Upload Template/i);
    expect(rows[1]).toContain("Name");
    expect(rows[1]).toContain("DepartmentId / Name");
    expect(rows[1]).toContain("CTC Structure / Template Name");
    expect(rows[2]).toContain("Standard CTC");
  });
});

describe("formatBulkUploadMessage", () => {
  it("summarizes inserted and skipped", () => {
    expect(formatBulkUploadMessage({ inserted: 2, skipped: 1 })).toBe(
      "Upload Complete: 2 inserted, 1 skipped",
    );
  });

  it("appends row errors", () => {
    const msg = formatBulkUploadMessage({
      inserted: 0,
      skipped: 1,
      errors: ["Row 2: Name is required"],
    });
    expect(msg).toContain("Errors:");
    expect(msg).toContain("Row 2: Name is required");
  });
});

describe("isExcelUploadFile", () => {
  it("accepts xlsx/xls only", () => {
    expect(isExcelUploadFile(new File([], "a.xlsx"))).toBe(true);
    expect(isExcelUploadFile(new File([], "a.XLS"))).toBe(true);
    expect(isExcelUploadFile(new File([], "a.csv"))).toBe(false);
    expect(isExcelUploadFile(null)).toBe(false);
  });
});
