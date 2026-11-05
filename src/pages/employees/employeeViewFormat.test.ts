import { describe, expect, it } from "vitest";
import {
  coverageLabel,
  displayValue,
  formatDateDisplay,
  formatDateIso,
  initialsFromName,
  managerDisplayName,
  maskAadhaar,
  maskAccountNumber,
} from "./employeeViewFormat";

describe("employeeViewFormat", () => {
  it("formats empty values as em dash", () => {
    expect(displayValue("")).toBe("—");
    expect(displayValue(null)).toBe("—");
  });

  it("masks aadhaar and bank account", () => {
    expect(maskAadhaar("123456789012")).toBe("XXXX-XXXX-9012");
    expect(maskAccountNumber("12345678903456")).toBe("•••• 3456");
  });

  it("formats dates", () => {
    expect(formatDateIso("1992-08-14T00:00:00.000Z")).toBe("1992-08-14");
    expect(formatDateDisplay("1966-02-08")).toBe("08-02-1966");
  });

  it("formats manager with designation", () => {
    expect(
      managerDisplayName({ name: "Ankit Kumar", designation: "HR Manager" }),
    ).toBe("Ankit Kumar (HR Manager)");
  });

  it("maps coverage and initials", () => {
    expect(coverageLabel("BOTH")).toBe("Both (ESIC & Medical)");
    expect(initialsFromName("Priya Sharma")).toBe("PS");
  });
});
