import type {
  EmployeeSalaryPreview,
  EmployeeSalaryStructure,
  SalaryComponentRow,
} from "../../services/employeeSalaryService";

export const formatInr = (n: number): string =>
  `₹${Number(n || 0).toLocaleString("en-IN")}`;

export const groupStructureComponents = (components: SalaryComponentRow[] = []) => ({
  earnings: components.filter(
    (c) => c.category?.toLowerCase() === "earning" && c.enabled !== false,
  ),
  deductions: components.filter(
    (c) =>
      c.category?.toLowerCase() === "deduction" &&
      !c.isEmployerContribution &&
      c.enabled !== false,
  ),
  employerContributions: components.filter(
    (c) => c.isEmployerContribution && c.enabled !== false,
  ),
});

export type SalaryViewModel = {
  wageType: string;
  showToggle: boolean;
  metrics: { label: string; value: string; highlight?: boolean }[];
  earnings: { name: string; amount: number; code?: string }[];
  deductions: { name: string; amount: number; code?: string }[];
  employerContributions: { name: string; amount: number; code?: string }[];
  ctcTarget: number;
  suffix: string;
  gross: number;
  totalDeduction: number;
  netSalary: number;
};

const rowAmount = (c: SalaryComponentRow, mult: number) =>
  Number(c.amount ?? c.monthlyAmount ?? c.dailyAmount ?? 0) * mult;

export const buildSalaryViewModel = ({
  structure,
  preview,
  showAnnual,
}: {
  structure: EmployeeSalaryStructure | null;
  preview: EmployeeSalaryPreview | null;
  showAnnual: boolean;
}): SalaryViewModel | null => {
  if (!structure?.components?.length && !preview?.earnings?.length) {
    return null;
  }

  const wageType = String(structure?.wageType || "MONTHLY").toUpperCase();
  const fallback = groupStructureComponents(structure?.components || []);
  const mult = showAnnual && wageType === "MONTHLY" ? 12 : 1;
  const suffix =
    wageType === "DAILY" ? "/day" : showAnnual ? "/yr" : "/mo";

  // Calendar daily: monthly preview amounts + per-day rate (CRA EmployeeSalaryStructureView).
  if (wageType === "CALENDAR_DAILY") {
    const dailyWage = Number(structure?.dailyWage || 0);
    const monthlyGross = Number(
      structure?.monthlyGross ||
        fallback.earnings.reduce(
          (s, c) => s + (Number(c.monthlyAmount) || 0),
          0,
        ),
    );
    const earnings = fallback.earnings.map((c) => ({
      name: c.name || c.code || "Earning",
      code: c.code,
      amount: c.monthlyAmount || 0,
    }));
    const deductions = fallback.deductions.map((c) => ({
      name: c.name || c.code || "Deduction",
      code: c.code,
      amount: c.monthlyAmount || 0,
    }));
    const employerContributions = fallback.employerContributions.map((c) => ({
      name: c.name || c.code || "Contribution",
      code: c.code,
      amount: c.monthlyAmount || 0,
    }));
    const totalDeduction = deductions.reduce((s, d) => s + d.amount, 0);
    const net = Math.max(0, monthlyGross - totalDeduction);
    return {
      wageType,
      showToggle: false,
      metrics: [
        { label: "Per Day Pay", value: `${formatInr(dailyWage)}/day` },
        {
          label: "Preview Monthly Gross",
          value: formatInr(monthlyGross),
        },
        {
          label: "Est. In-Hand",
          value: formatInr(net),
          highlight: true,
        },
      ],
      earnings,
      deductions,
      employerContributions,
      ctcTarget: monthlyGross || 1,
      suffix: "/mo",
      gross: monthlyGross,
      totalDeduction,
      netSalary: net,
    };
  }

  if (wageType === "DAILY") {
    const dailyWage = Number(structure?.dailyWage || 0);
    const dailyGross = Number(
      structure?.dailyGross ||
        fallback.earnings.reduce(
          (s, c) => s + (c.dailyAmount ?? c.monthlyAmount ?? 0),
          0,
        ),
    );
    const earnings = fallback.earnings.map((c) => ({
      name: c.name || c.code || "Earning",
      code: c.code,
      amount: c.dailyAmount ?? c.monthlyAmount ?? 0,
    }));
    const deductions = fallback.deductions.map((c) => ({
      name: c.name || c.code || "Deduction",
      code: c.code,
      amount: c.dailyAmount ?? c.monthlyAmount ?? 0,
    }));
    const employerContributions = fallback.employerContributions.map((c) => ({
      name: c.name || c.code || "Contribution",
      code: c.code,
      amount: c.dailyAmount ?? c.monthlyAmount ?? 0,
    }));
    const totalDeduction = deductions.reduce((s, d) => s + d.amount, 0);
    const net = Math.max(0, dailyGross - totalDeduction);
    return {
      wageType,
      showToggle: false,
      metrics: [
        { label: "Daily Wage", value: `${formatInr(dailyWage)}/day` },
        { label: "Daily Gross", value: `${formatInr(dailyGross)}/day` },
        {
          label: "Est. In-Hand /day",
          value: `${formatInr(net)}/day`,
          highlight: true,
        },
      ],
      earnings,
      deductions,
      employerContributions,
      ctcTarget: dailyWage || dailyGross || 1,
      suffix,
      gross: dailyGross,
      totalDeduction,
      netSalary: net,
    };
  }

  const earnings = (
    preview?.earnings?.length ? preview.earnings : fallback.earnings
  ).map((c) => ({
    name: c.name || c.code || "Earning",
    code: c.code,
    amount: rowAmount(c, mult),
  }));
  const deductions = (
    preview?.deductions?.length ? preview.deductions : fallback.deductions
  ).map((c) => ({
    name: c.name || c.code || "Deduction",
    code: c.code,
    amount: rowAmount(c, mult),
  }));
  const employerContributions = (
    preview?.employerContributions?.length
      ? preview.employerContributions
      : fallback.employerContributions
  ).map((c) => ({
    name: c.name || c.code || "Contribution",
    code: c.code,
    amount: rowAmount(c, mult),
  }));

  const gross =
    (preview?.grossSalary ?? structure?.monthlyGross ?? 0) * mult;
  const ctc =
    (structure?.ctcAnnual || preview?.ctcAnnual || 0) / (showAnnual ? 1 : 12);
  const totalDeduction =
    (preview?.totalDeduction ||
      fallback.deductions.reduce((s, d) => s + (d.monthlyAmount ?? 0), 0)) *
    mult;
  const netSalary =
    (preview?.netSalary ||
      Math.max(
        0,
        (structure?.monthlyGross ?? 0) -
          fallback.deductions.reduce((s, d) => s + (d.monthlyAmount ?? 0), 0),
      )) * mult;

  return {
    wageType,
    showToggle: wageType === "MONTHLY" || !wageType,
    metrics: [
      {
        label: showAnnual ? "Annual CTC" : "Monthly CTC",
        value: formatInr(ctc),
      },
      {
        label: showAnnual ? "Annual Gross" : "Monthly Gross",
        value: formatInr(gross),
      },
      {
        label: "Estimated In-Hand",
        value: formatInr(netSalary),
        highlight: true,
      },
    ],
    earnings,
    deductions,
    employerContributions,
    ctcTarget: ctc || gross || 1,
    suffix,
    gross,
    totalDeduction,
    netSalary,
  };
};

export const earningBarCode = (code?: string): string => {
  const valid = [
    "basic",
    "hra",
    "special",
    "conveyance",
    "medical",
    "lta",
    "incentive",
  ];
  const normalized = String(code || "").toLowerCase();
  return valid.includes(normalized) ? normalized : "default";
};
