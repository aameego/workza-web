import { describe, expect, it } from "vitest";
import {
  formatFileSize,
  pendingDocumentSlots,
} from "./documentTypes";

describe("pendingDocumentSlots", () => {
  it("shows all Figma slots when nothing uploaded", () => {
    expect(pendingDocumentSlots([]).map((s) => s.id)).toEqual([
      "pan",
      "bank",
      "bank_stmt",
      "dl",
      "passport",
    ]);
  });

  it("clears PAN and first BANK when those types exist", () => {
    expect(
      pendingDocumentSlots([
        { _id: "1", documentType: "PAN" },
        { _id: "2", documentType: "BANK" },
      ]).map((s) => s.id),
    ).toEqual(["bank_stmt", "dl", "passport"]);
  });

  it("formats file sizes", () => {
    expect(formatFileSize(1024)).toBe("1.0 KB");
    expect(formatFileSize(3.1 * 1024 * 1024)).toBe("3.1 MB");
  });
});
