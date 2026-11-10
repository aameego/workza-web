import { describe, expect, it } from "vitest";
import {
  applyCalendarDailyBasic,
  buildManualComponentsFromLibrary,
  buildManualMatchSummary,
  manualModeAmountHint,
  manualTargetAmountLabel,
  partitionSalaryComponents,
  resolveManualSplitCodes,
} from "./salaryManualFlow";

const library = [
  {
    code: "BASIC",
    name: "Basic",
    category: "Earning",
    calculationType: "Fixed",
  },
  {
    code: "HRA",
    name: "HRA",
    category: "Earning",
  },
  {
    code: "PF",
    name: "PF",
    category: "Deduction",
  },
  {
    code: "PF_ER",
    name: "Employer PF",
    category: "Deduction",
    isEmployerContribution: true,
  },
];

describe("manualModeAmountHint / labels", () => {
  it("describes library-rate split for monthly and daily", () => {
    expect(manualModeAmountHint("DAILY")).toMatch(/library rates/i);
    expect(manualModeAmountHint("MONTHLY")).toMatch(/library rates/i);
    expect(manualModeAmountHint("CALENDAR_DAILY")).toMatch(/BASIC/i);
  });

  it("numbers the target amount field", () => {
    expect(manualTargetAmountLabel("MONTHLY")).toMatch(/^1\..*Target Annual CTC/);
    expect(manualTargetAmountLabel("DAILY")).toMatch(/^1\..*Daily Wage/);
    expect(manualTargetAmountLabel("CALENDAR_DAILY")).toMatch(/^1\..*Per Day/);
  });
});

describe("resolveManualSplitCodes", () => {
  it("auto-includes SPECIAL from the library for monthly split balancing", () => {
    const codes = resolveManualSplitCodes(
      ["BASIC", "HRA"],
      library,
      "MONTHLY",
    );
    // library fixture has no SPECIAL — stays as selected
    expect(codes).toEqual(["BASIC", "HRA"]);

    const withSpecial = resolveManualSplitCodes(
      ["BASIC"],
      [
        ...library,
        { code: "SPECIAL", name: "Special", category: "Earning" },
      ],
      "MONTHLY",
    );
    expect(withSpecial).toEqual(["BASIC", "SPECIAL"]);
  });

  it("does not inject SPECIAL for calendar daily", () => {
    expect(
      resolveManualSplitCodes(
        ["BASIC"],
        [{ code: "SPECIAL", name: "Special", category: "Earning" }],
        "CALENDAR_DAILY",
      ),
    ).toEqual(["BASIC"]);
  });
});

describe("buildManualComponentsFromLibrary", () => {
  it("builds zeroed rows for selected codes only", () => {
    const rows = buildManualComponentsFromLibrary(library, ["BASIC", "PF_ER"]);
    expect(rows).toHaveLength(2);
    expect(rows[0]).toMatchObject({
      code: "BASIC",
      monthlyAmount: 0,
      dailyAmount: 0,
      enabled: true,
    });
    expect(rows[1].isEmployerContribution).toBe(true);
  });
});

describe("applyCalendarDailyBasic", () => {
  it("rejects missing Fixed Basic", () => {
    const rows = buildManualComponentsFromLibrary(library, ["HRA"]);
    const result = applyCalendarDailyBasic(rows, library, 0);
    expect(result.error).toMatch(/Fixed Basic/i);
  });

  it("injects BASIC from library when not selected", () => {
    const rows = buildManualComponentsFromLibrary(library, ["HRA"]);
    const result = applyCalendarDailyBasic(rows, library, 10994);
    expect(result.error).toBe("");
    expect(result.components[0].code).toBe("BASIC");
    expect(result.components[0].monthlyAmount).toBe(10994);
  });

  it("overwrites BASIC amount when already selected", () => {
    const rows = buildManualComponentsFromLibrary(library, ["BASIC", "HRA"]);
    const result = applyCalendarDailyBasic(rows, library, 8000);
    expect(result.error).toBe("");
    const basic = result.components.find((c) => c.code === "BASIC");
    expect(basic?.monthlyAmount).toBe(8000);
  });
});

describe("buildManualMatchSummary", () => {
  it("guides empty manual apply", () => {
    const summary = buildManualMatchSummary({
      wageType: "MONTHLY",
      ctcAnnual: 120000,
      components: [],
    });
    expect(summary.status).toBe("empty");
    expect(summary.message).toMatch(/Apply & Split/i);
  });

  it("flags zero-amount monthly rows as short of CTC", () => {
    const rows = buildManualComponentsFromLibrary(library, ["BASIC"]);
    const summary = buildManualMatchSummary({
      wageType: "MONTHLY",
      ctcAnnual: 120000,
      components: rows,
    });
    expect(summary.status).toBe("short");
    expect(summary.message).toMatch(/less than Annual CTC|short/i);
  });

  it("passes when monthly earnings match CTC", () => {
    const summary = buildManualMatchSummary({
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
    });
    expect(summary.status).toBe("ok");
  });

  it("flags daily shortfall then ok when filled", () => {
    const short = buildManualMatchSummary({
      wageType: "DAILY",
      dailyWage: 500,
      components: [
        {
          code: "BASIC",
          category: "Earning",
          dailyAmount: 0,
          enabled: true,
        },
      ],
    });
    expect(short.status).toBe("short");

    const ok = buildManualMatchSummary({
      wageType: "DAILY",
      dailyWage: 500,
      components: [
        {
          code: "BASIC",
          category: "Earning",
          dailyAmount: 500,
          enabled: true,
        },
      ],
    });
    expect(ok.status).toBe("ok");
  });

  it("requires BASIC for calendar daily manual", () => {
    const missing = buildManualMatchSummary({
      wageType: "CALENDAR_DAILY",
      dailyWage: 423,
      components: [
        {
          code: "HRA",
          category: "Earning",
          monthlyAmount: 1000,
          enabled: true,
        },
      ],
    });
    expect(missing.status).toBe("incomplete");
    expect(missing.message).toMatch(/BASIC/i);

    const ok = buildManualMatchSummary({
      wageType: "CALENDAR_DAILY",
      dailyWage: 423,
      components: [
        {
          code: "BASIC",
          category: "Earning",
          monthlyAmount: 10994,
          enabled: true,
        },
      ],
    });
    expect(ok.status).toBe("ok");
  });
});

describe("partitionSalaryComponents", () => {
  it("keeps employer contributions out of deductions panel", () => {
    const parts = partitionSalaryComponents([
      { code: "BASIC", category: "Earning" },
      { code: "PF", category: "Deduction" },
      {
        code: "PF_ER",
        category: "Deduction",
        isEmployerContribution: true,
      },
    ]);
    expect(parts.earnings.map((c) => c.code)).toEqual(["BASIC"]);
    expect(parts.deductions.map((c) => c.code)).toEqual(["PF"]);
    expect(parts.employerContributions.map((c) => c.code)).toEqual(["PF_ER"]);
  });
});
