import { describe, expect, it } from "vitest";
import {
  employeeIdFromRow,
  formatBulkMonthUploadResult,
  toDateInputValue,
  toTimeInputValue,
  validateAttendanceUploadFile,
  validateDirectEditAttendance,
} from "./attendanceEditHelpers";

describe("toDateInputValue", () => {
  it("formats Date objects as YYYY-MM-DD", () => {
    expect(toDateInputValue(new Date(2026, 8, 8))).toBe("2026-09-08");
  });
});

describe("toTimeInputValue", () => {
  it("converts 12h display to HH:mm", () => {
    expect(toTimeInputValue("11:07 AM")).toBe("11:07");
    expect(toTimeInputValue("1:30 PM")).toBe("13:30");
    expect(toTimeInputValue("—")).toBe("");
  });
});

describe("employeeIdFromRow", () => {
  it("reads nested employee object", () => {
    expect(
      employeeIdFromRow({ employeeId: { _id: "abc123", name: "Niharika" } as { _id: string } }),
    ).toBe("abc123");
  });
});

describe("validateDirectEditAttendance", () => {
  it("requires audit note and times for worked statuses", () => {
    expect(
      validateDirectEditAttendance({
        employeeId: "e1",
        date: "2026-11-05",
        status: "Present",
        checkIn: "",
        checkOut: "",
        auditNote: "ab",
      }),
    ).toMatch(/audit note/i);

    expect(
      validateDirectEditAttendance({
        employeeId: "e1",
        date: "2026-11-05",
        status: "Present",
        checkIn: "09:00",
        checkOut: "18:00",
        auditNote: "Corrected late mark",
      }),
    ).toBe("");
  });

  it("allows absent without times", () => {
    expect(
      validateDirectEditAttendance({
        employeeId: "e1",
        date: "2026-11-05",
        status: "Absent",
        checkIn: "",
        checkOut: "",
        auditNote: "Was on leave",
      }),
    ).toBe("");
  });
});

describe("validateAttendanceUploadFile", () => {
  it("rejects non-excel and oversized files", () => {
    expect(validateAttendanceUploadFile(null)).toMatch(/select/i);
    const bad = new File(["x"], "notes.csv", { type: "text/csv" });
    expect(validateAttendanceUploadFile(bad)).toMatch(/Invalid file type/i);
  });

  it("accepts xlsx", () => {
    const ok = new File(["x"], "month.xlsx", {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    expect(validateAttendanceUploadFile(ok)).toBeNull();
  });
});

describe("formatBulkMonthUploadResult", () => {
  it("summarizes counts and errors", () => {
    const text = formatBulkMonthUploadResult({
      message: "Done",
      uploaded: 10,
      failed: 1,
      skipped: 2,
      totalRows: 13,
      errors: ["Row 4: missing code"],
    });
    expect(text).toContain("Uploaded: 10");
    expect(text).toContain("Row 4");
  });
});
