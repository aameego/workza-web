import { describe, expect, it } from "vitest";
import { buildSalaryViewModel, formatInr } from "./salaryViewModel";

describe("buildSalaryViewModel", () => {
  it("builds monthly metrics from preview + structure", () => {
    const model = buildSalaryViewModel({
      structure: {
        wageType: "MONTHLY",
        ctcAnnual: 500000,
        monthlyGross: 38629,
        components: [
          {
            code: "basic",
            name: "Basic Salary",
            category: "earning",
            monthlyAmount: 12855,
          },
          {
            code: "pf",
            name: "PF",
            category: "deduction",
            monthlyAmount: 1800,
          },
        ],
      },
      preview: {
        earnings: [{ name: "Basic Salary", code: "basic", amount: 12855 }],
        deductions: [{ name: "PF", code: "pf", amount: 1800 }],
        grossSalary: 38629,
        totalDeduction: 1931,
        netSalary: 36698,
        ctcAnnual: 500000,
      },
      showAnnual: false,
    });

    expect(model?.metrics[0]?.label).toBe("Monthly CTC");
    expect(model?.netSalary).toBe(36698);
    expect(formatInr(36698)).toContain("36,698");
  });

  it("returns null when empty", () => {
    expect(
      buildSalaryViewModel({
        structure: null,
        preview: null,
        showAnnual: false,
      }),
    ).toBeNull();
  });
});
