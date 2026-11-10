import { describe, expect, it } from "vitest";
import {
  hasSalaryData,
  validateAnnualCtc,
  validateComponentsMatchCtc,
  validateComponentsMatchDailyWage,
  validateDailyWage,
  validateStructureDraft,
} from "./salaryValidation";

describe("salaryValidation", () => {
  it("requires annual CTC of at least ₹12", () => {
    expect(validateAnnualCtc("")).toMatch(/required/i);
    expect(validateAnnualCtc(5)).toMatch(/at least/i);
    expect(validateAnnualCtc(600000)).toBe("");
  });

  it("validates daily wage bounds", () => {
    expect(validateDailyWage("")).toMatch(/required/i);
    expect(validateDailyWage(5)).toMatch(/at least/i);
    expect(validateDailyWage(500)).toBe("");
  });

  it("matches CTC earnings + employer contributions", () => {
    const ok = validateComponentsMatchCtc({
      ctcAnnual: 120000,
      components: [
        {
          code: "BASIC",
          category: "Earning",
          monthlyAmount: 8000,
          enabled: true,
        },
        {
          code: "PF_ER",
          category: "Deduction",
          isEmployerContribution: true,
          monthlyAmount: 2000,
          enabled: true,
        },
      ],
    });
    expect(ok).toBe("");

    const mismatch = validateComponentsMatchCtc({
      ctcAnnual: 120000,
      components: [
        {
          code: "BASIC",
          category: "Earning",
          monthlyAmount: 5000,
          enabled: true,
        },
      ],
    });
    expect(mismatch).toMatch(/less than Annual CTC/i);
  });

  it("matches daily wage to earnings", () => {
    expect(
      validateComponentsMatchDailyWage({
        dailyWage: 500,
        components: [
          {
            code: "BASIC",
            category: "Earning",
            dailyAmount: 500,
            enabled: true,
          },
        ],
      }),
    ).toBe("");
  });

  it("hasSalaryData / validateStructureDraft for empty vs filled drafts", () => {
    expect(hasSalaryData({ wageType: "MONTHLY", components: [] })).toBe(false);
    expect(
      hasSalaryData({ wageType: "MONTHLY", ctcAnnual: 600000, components: [] }),
    ).toBe(true);

    expect(validateStructureDraft(null)).toEqual([]);
    expect(
      validateStructureDraft({
        wageType: "MONTHLY",
        ctcAnnual: 120000,
        components: [
          {
            code: "BASIC",
            category: "Earning",
            monthlyAmount: 10000,
            enabled: true,
          },
        ],
      }),
    ).toEqual([]);
  });

  it("calendar daily draft requires BASIC and does not duplicate wage errors", () => {
    const missingBasic = validateStructureDraft({
      wageType: "CALENDAR_DAILY",
      dailyWage: 500,
      components: [
        {
          code: "HRA",
          category: "Earning",
          monthlyAmount: 1000,
          enabled: true,
        },
      ],
    });
    expect(missingBasic).toHaveLength(1);
    expect(missingBasic[0]).toMatch(/BASIC/i);

    const ok = validateStructureDraft({
      wageType: "CALENDAR_DAILY",
      dailyWage: 500,
      components: [
        {
          code: "BASIC",
          category: "Earning",
          monthlyAmount: 10994,
          enabled: true,
        },
      ],
    });
    expect(ok).toEqual([]);
  });

  it("daily draft flags mismatch without treating employer contrib as wage", () => {
    const errors = validateStructureDraft({
      wageType: "DAILY",
      dailyWage: 500,
      components: [
        {
          code: "BASIC",
          category: "Earning",
          dailyAmount: 400,
          enabled: true,
        },
      ],
    });
    expect(errors.some((e) => /less than Daily Wage/i.test(e))).toBe(true);
  });
});
