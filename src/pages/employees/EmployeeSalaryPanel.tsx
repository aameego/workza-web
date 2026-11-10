import { useMemo, useState } from "react";
import { Button, cn } from "../../design-system";
import { ApiError } from "../../lib/apiClient";
import { useEmployeeSalary } from "../../hooks/useEmployeeDetailTabs";
import { EmployeeSectionHeader } from "./EmployeeInfoField";
import {
  buildSalaryViewModel,
  earningBarCode,
  formatInr,
} from "./salaryViewModel";

export type EmployeeSalaryPanelProps = {
  employeeId: string;
};

const segmentColor: Record<string, string> = {
  basic: "bg-[#1f5da3]",
  hra: "bg-[#12b76a]",
  special: "bg-[#f79009]",
  conveyance: "bg-[#7a5af8]",
  medical: "bg-[#ee46bc]",
  lta: "bg-[#15b79e]",
  incentive: "bg-[#6172f3]",
  default: "bg-wz-neutral-400",
};

export default function EmployeeSalaryPanel({
  employeeId,
}: EmployeeSalaryPanelProps) {
  const { data, isLoading, isError, error, refetch } = useEmployeeSalary(
    employeeId,
    true,
  );
  const [showAnnual, setShowAnnual] = useState(false);

  const model = useMemo(
    () =>
      buildSalaryViewModel({
        structure: data?.structure ?? null,
        preview: data?.preview ?? null,
        showAnnual,
      }),
    [data, showAnnual],
  );

  if (isLoading) {
    return (
      <section className="rounded-wz-xl border border-wz-border bg-white p-wz-6 text-sm text-wz-text-secondary">
        Loading salary structure…
      </section>
    );
  }

  if (isError) {
    return (
      <section className="rounded-wz-xl border border-wz-border bg-white p-wz-6">
        <p className="m-0 text-sm text-wz-error" role="alert">
          {error instanceof ApiError
            ? error.message
            : "Could not load salary structure."}
        </p>
        <Button
          type="button"
          variant="secondary"
          className="mt-wz-3"
          onClick={() => void refetch()}
        >
          Retry
        </Button>
      </section>
    );
  }

  if (!model) {
    return (
      <section className="rounded-wz-xl border border-wz-border bg-white p-wz-6 text-sm text-wz-text-secondary">
        No salary structure assigned yet.
      </section>
    );
  }

  const activeEarnings = model.earnings.filter((e) => e.amount > 0);

  return (
    <section className="rounded-wz-xl border border-wz-border bg-white p-wz-6">
      <div className="flex flex-col gap-wz-6">
        <div className="flex flex-wrap items-start justify-between gap-wz-4">
          <EmployeeSectionHeader title="Salary Structure" />
          {model.showToggle ? (
            <div className="inline-flex rounded-wz-md border border-wz-border p-0.5">
              <button
                type="button"
                className={cn(
                  "cursor-pointer rounded-wz-sm border-0 px-3 py-1.5 text-xs font-semibold",
                  !showAnnual
                    ? "bg-wz-primary text-white"
                    : "bg-transparent text-wz-text-secondary",
                )}
                onClick={() => setShowAnnual(false)}
              >
                Monthly
              </button>
              <button
                type="button"
                className={cn(
                  "cursor-pointer rounded-wz-sm border-0 px-3 py-1.5 text-xs font-semibold",
                  showAnnual
                    ? "bg-wz-primary text-white"
                    : "bg-transparent text-wz-text-secondary",
                )}
                onClick={() => setShowAnnual(true)}
              >
                Annual
              </button>
            </div>
          ) : null}
        </div>

        <div className="grid grid-cols-1 gap-wz-4 sm:grid-cols-3">
          {model.metrics.map((metric) => (
            <div key={metric.label} className="min-w-0">
              <p className="m-0 text-xs font-semibold tracking-[0.5px] text-[#6c757d] uppercase">
                {metric.label}
              </p>
              <p
                className={cn(
                  "m-0 mt-1 text-lg font-bold",
                  metric.highlight ? "text-[#1f5da3]" : "text-[#0a1f4a]",
                )}
              >
                {metric.value}
              </p>
            </div>
          ))}
        </div>

        {model.wageType === "CALENDAR_DAILY" ? (
          <p className="m-0 text-center text-[11px] text-wz-text-secondary">
            Payroll uses Horticulture sheet formulas: earned pay = rate × working
            days; ESIC eligibility on rate × 26; HRA = earned net − earned basic.
          </p>
        ) : null}

        {model.wageType === "DAILY" ? (
          <p className="m-0 text-center text-[11px] text-wz-text-secondary">
            Monthly estimate: 28 days = {formatInr(model.netSalary * 28)} • 30
            days = {formatInr(model.netSalary * 30)} • 31 days ={" "}
            {formatInr(model.netSalary * 31)}
          </p>
        ) : null}

        {activeEarnings.length > 0 && model.ctcTarget > 0 ? (
          <div className="flex flex-col gap-2">
            <p className="m-0 text-sm font-semibold text-[#0a1f4a]">
              Structure Split
            </p>
            <div className="flex h-2.5 w-full overflow-hidden rounded-wz-full bg-wz-neutral-100">
              {activeEarnings.map((item) => {
                const pct = (item.amount / model.ctcTarget) * 100;
                const code = earningBarCode(item.code);
                return (
                  <div
                    key={item.code || item.name}
                    className={cn("h-full", segmentColor[code])}
                    style={{ width: `${pct}%` }}
                    title={`${item.name}: ${formatInr(item.amount)} (${pct.toFixed(1)}%)`}
                  />
                );
              })}
            </div>
            <div className="flex flex-wrap gap-3">
              {activeEarnings.map((item) => {
                const pct = (item.amount / model.ctcTarget) * 100;
                const code = earningBarCode(item.code);
                return (
                  <span
                    key={`leg-${item.code || item.name}`}
                    className="inline-flex items-center gap-1.5 text-xs text-wz-text-secondary"
                  >
                    <span
                      className={cn(
                        "size-2 rounded-wz-full",
                        segmentColor[code],
                      )}
                    />
                    {item.name} ({pct.toFixed(1)}%)
                  </span>
                );
              })}
            </div>
          </div>
        ) : null}

        <div className="grid grid-cols-1 gap-wz-6 lg:grid-cols-2">
          <div>
            <p className="m-0 mb-3 text-sm font-semibold text-[#0a1f4a]">
              Earnings
            </p>
            <div className="flex flex-col gap-2">
              {model.earnings.length ? (
                model.earnings.map((item) => (
                  <div
                    key={item.code || item.name}
                    className="flex items-center justify-between gap-3 text-sm"
                  >
                    <span className="text-wz-text-secondary">{item.name}</span>
                    <strong className="font-semibold text-[#0a1f4a]">
                      {formatInr(item.amount)}
                      {model.suffix}
                    </strong>
                  </div>
                ))
              ) : (
                <p className="m-0 text-sm text-wz-text-secondary">
                  No earnings configured.
                </p>
              )}
            </div>
          </div>
          <div className="flex flex-col gap-wz-6">
            <div>
              <p className="m-0 mb-3 text-sm font-semibold text-[#0a1f4a]">
                Deductions
              </p>
              <div className="flex flex-col gap-2">
                {model.deductions.length ? (
                  model.deductions.map((item) => (
                    <div
                      key={item.code || item.name}
                      className="flex items-center justify-between gap-3 text-sm"
                    >
                      <span className="text-wz-text-secondary">{item.name}</span>
                      <strong className="font-semibold text-[#0a1f4a]">
                        {formatInr(item.amount)}
                        {model.suffix}
                      </strong>
                    </div>
                  ))
                ) : (
                  <p className="m-0 text-sm text-wz-text-secondary">
                    No deductions configured.
                  </p>
                )}
              </div>
            </div>
            {model.employerContributions.length ? (
              <div>
                <p className="m-0 mb-3 text-sm font-semibold text-[#0a1f4a]">
                  Employer Contributions
                </p>
                <div className="flex flex-col gap-2">
                  {model.employerContributions.map((item) => (
                    <div
                      key={item.code || item.name}
                      className="flex items-center justify-between gap-3 text-sm"
                    >
                      <span className="text-wz-text-secondary">{item.name}</span>
                      <strong className="font-semibold text-[#0a1f4a]">
                        {formatInr(item.amount)}
                        {model.suffix}
                      </strong>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        </div>

        <div className="flex flex-col gap-2 border-t border-wz-border pt-wz-4">
          <div className="flex items-center justify-between text-sm">
            <span className="text-wz-text-secondary">Total Earnings (Gross)</span>
            <strong className="text-[#0a1f4a]">{formatInr(model.gross)}</strong>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-wz-text-secondary">Total Deductions</span>
            <strong className="text-wz-error">
              -{formatInr(model.totalDeduction)}
            </strong>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="font-semibold text-[#0a1f4a]">
              Estimated Net Salary
            </span>
            <strong className="text-lg text-[#1f5da3]">
              {formatInr(model.netSalary)}
            </strong>
          </div>
        </div>
      </div>
    </section>
  );
}
