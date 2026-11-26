import { describe, expect, it } from "vitest";
import type { LeavePolicy } from "../../services/leaveService";
import {
  buildPolicyPayload,
  describeType,
  monthlyCreditExceedsYearlyCapWarning,
  validatePolicy,
} from "./leavePolicyForm";

const basePolicy = (overrides: Partial<LeavePolicy> = {}): LeavePolicy => ({
  yearStartMonth: 1,
  yearStartDay: 1,
  templateKey: "custom",
  accruePaidLeaveDuringProbation: false,
  types: [
    {
      code: "CL",
      name: "Casual Leave",
      enabled: true,
      hasBalance: true,
      accrual: { method: "fixed_monthly", monthlyCredit: 0.5, yearlyCap: 6 },
      yearEnd: { lapseUnused: true },
    },
    {
      code: "SL",
      name: "Sick Leave",
      enabled: true,
      hasBalance: true,
      accrual: { method: "fixed_monthly", monthlyCredit: 0.5, yearlyCap: 6 },
      yearEnd: { lapseUnused: true },
      documents: { requiredWhenDaysGt: 1 },
    },
    {
      code: "EL",
      name: "Earned Leave",
      enabled: true,
      hasBalance: true,
      accrual: { method: "fixed_monthly", monthlyCredit: 1, yearlyCap: 12 },
      yearEnd: { lapseUnused: false, carryForwardMax: 10 },
    },
  ],
  ...overrides,
});

describe("monthlyCreditExceedsYearlyCapWarning", () => {
  it("warns when monthly credit projects past the yearly cap", () => {
    expect(
      monthlyCreditExceedsYearlyCapWarning({
        monthlyCredit: 1,
        yearlyCap: 6,
      }),
    ).toBe(
      "Annual credit of 12 days (1 × 12) exceeds the yearly maximum of 6 days.",
    );
  });

  it("stays silent when the projection fits", () => {
    expect(
      monthlyCreditExceedsYearlyCapWarning({
        monthlyCredit: 0.5,
        yearlyCap: 6,
      }),
    ).toBeNull();
  });
});

describe("describeType", () => {
  it("summarises a standard type the way the card does", () => {
    const policy = basePolicy();
    expect(describeType(policy.types![0], policy)).toBe(
      "0.5 days added each month, up to 6 per year. Unused days expire at year end. Collects during probation; can be taken after confirmation.",
    );
  });

  it("appends the SL medical-document rule", () => {
    const policy = basePolicy();
    expect(describeType(policy.types![1], policy)).toContain(
      "Medical document needed when sick leave is more than 1 day.",
    );
  });

  it("says when a type is turned off", () => {
    const policy = basePolicy();
    expect(
      describeType({ ...policy.types![0], enabled: false }, policy),
    ).toBe("Turned off — employees cannot apply for this type.");
  });
});

describe("validatePolicy", () => {
  it("accepts a complete policy", () => {
    expect(validatePolicy(basePolicy())).toBe("");
  });

  it("rejects an out-of-range leave year start day", () => {
    expect(validatePolicy(basePolicy({ yearStartDay: 45 }))).toBe(
      "On Day must be a number between 1 and 31.",
    );
  });

  it("rejects a cleared Days each month value", () => {
    const policy = basePolicy();
    policy.types![0].accrual!.monthlyCredit = null;
    expect(validatePolicy(policy)).toBe(
      "Casual Leave — Days each month is required.",
    );
  });

  it("requires working days when EL is prorated", () => {
    const policy = basePolicy();
    policy.types![2].accrual = {
      method: "prorate_paid_days",
      monthlyCredit: 1,
      yearlyCap: 12,
      minPresentDays: 0,
      standardWorkingDays: 0,
    };
    expect(validatePolicy(policy)).toBe(
      "EL working days in a full month must be more than 0",
    );
  });
});

describe("buildPolicyPayload", () => {
  it("always sends templateKey custom with a types array", () => {
    const payload = buildPolicyPayload(basePolicy());
    expect(payload.templateKey).toBe("custom");
    expect(payload.yearStartMonth).toBe(1);
    expect(payload.yearStartDay).toBe(1);
    expect(payload.accruePaidLeaveDuringProbation).toBe(false);
    expect(payload.types).toHaveLength(3);
  });

  it("forces CL/SL to a fixed monthly credit and keeps the EL method", () => {
    const policy = basePolicy();
    policy.types![2].accrual = {
      method: "prorate_paid_days",
      monthlyCredit: 1,
      yearlyCap: 12,
      minPresentDays: 4,
      standardWorkingDays: 26,
    };
    const payload = buildPolicyPayload(policy);
    const cl = payload.types.find((t) => t.code === "CL")!;
    const sl = payload.types.find((t) => t.code === "SL")!;
    const el = payload.types.find((t) => t.code === "EL")!;

    expect(cl.accrual?.method).toBe("fixed_monthly");
    expect(cl.hasBalance).toBe(true);
    expect(cl.yearEnd?.lapseUnused).toBe(true);
    // SL keeps its document threshold; other types get a cleared one.
    expect(sl.documents?.requiredWhenDaysGt).toBe(1);
    expect(cl.documents?.requiredWhenDaysGt).toBeNull();

    expect(el.accrual?.method).toBe("prorate_paid_days");
    expect(el.accrual?.standardWorkingDays).toBe(26);
    expect(el.accrual?.minPresentDays).toBe(4);
    expect(el.yearEnd?.carryForwardMax).toBe(10);
    expect(el.yearEnd?.lapseUnused).toBe(false);
  });
});
