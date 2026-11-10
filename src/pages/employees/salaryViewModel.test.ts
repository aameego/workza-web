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

  it("builds daily wage metrics without annual toggle", () => {
    const model = buildSalaryViewModel({
      structure: {
        wageType: "DAILY",
        dailyWage: 500,
        dailyGross: 500,
        components: [
          {
            code: "BASIC",
            name: "Basic",
            category: "Earning",
            dailyAmount: 500,
          },
        ],
      },
      preview: null,
      showAnnual: true,
    });
    expect(model?.showToggle).toBe(false);
    expect(model?.metrics[0]?.label).toBe("Daily Wage");
    expect(model?.suffix).toBe("/day");
    expect(model?.gross).toBe(500);
  });

  it("builds calendar-daily preview metrics (not monthly CTC)", () => {
    const model = buildSalaryViewModel({
      structure: {
        wageType: "CALENDAR_DAILY",
        dailyWage: 423,
        monthlyGross: 10994,
        components: [
          {
            code: "BASIC",
            name: "Basic",
            category: "Earning",
            monthlyAmount: 10994,
          },
          {
            code: "ESIC",
            name: "ESIC",
            category: "Deduction",
            monthlyAmount: 82,
          },
        ],
      },
      preview: null,
      showAnnual: false,
    });

    expect(model?.showToggle).toBe(false);
    expect(model?.metrics.map((m) => m.label)).toEqual([
      "Per Day Pay",
      "Preview Monthly Gross",
      "Est. In-Hand",
    ]);
    expect(model?.gross).toBe(10994);
    expect(model?.netSalary).toBe(10912);
    expect(model?.ctcTarget).toBe(10994);
    expect(model?.suffix).toBe("/mo");
  });
});
