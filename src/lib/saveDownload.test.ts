import { describe, expect, it } from "vitest";
import {
  fileNameFromContentDisposition,
  mimeTypeForFileName,
} from "./saveDownload";

describe("mimeTypeForFileName", () => {
  it("maps xlsx extension", () => {
    expect(mimeTypeForFileName("Employees.xlsx")).toContain("spreadsheetml");
  });

  it("prefers non-octet blob type", () => {
    expect(mimeTypeForFileName("a.xlsx", "application/pdf")).toBe(
      "application/pdf",
    );
  });
});

describe("fileNameFromContentDisposition", () => {
  it("parses quoted filename", () => {
    expect(
      fileNameFromContentDisposition(
        'attachment; filename="Employees-Export-2026-01-01.xlsx"',
        "fallback.xlsx",
      ),
    ).toBe("Employees-Export-2026-01-01.xlsx");
  });

  it("uses fallback when missing", () => {
    expect(fileNameFromContentDisposition(null, "fallback.xlsx")).toBe(
      "fallback.xlsx",
    );
  });
});
