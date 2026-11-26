import { useState } from "react";
import { CalendarClock, ChevronDown } from "lucide-react";
import {
  Button,
  Card,
  ConfirmDialog,
  Field,
  Input,
  Select,
  cn,
  showSuccessToast,
} from "../../../design-system";
import { ApiError } from "../../../lib/apiClient";
import { useLeavePolicy, useUpdateLeavePolicy } from "../../../hooks/useLeave";
import type {
  LeavePolicy,
  LeavePolicyType,
} from "../../../services/leaveService";
import {
  MONTHS,
  STANDARD_CODES,
  buildPolicyPayload,
  describeType,
  elAccrualMethod,
  isBalanceType,
  isOtherType,
  monthlyCreditExceedsYearlyCapWarning,
  monthLabel,
  needsMonthlyCredit,
  showsMinPaidDaysField,
  showsWorkingDaysField,
  validatePolicy,
} from "../leavePolicyForm";
import LeaveAccrualModal from "./LeaveAccrualModal";

/** Left accent + code chip colour per leave type (Figma Leave policy cards). */
const ACCENT: Record<string, string> = {
  CL: "border-l-[#1570ef]",
  SL: "border-l-[#12b76a]",
  EL: "border-l-[#f79009]",
  CO: "border-l-[#7a5af8]",
  WFH: "border-l-[#0ea5e9]",
};

const CHIP: Record<string, string> = {
  CL: "bg-[#e8eef8] text-[#1570ef]",
  SL: "bg-[#e3f5ec] text-[#027a48]",
  EL: "bg-[#fef0c7] text-[#b54708]",
  CO: "bg-[#f4ebff] text-[#6938ef]",
  WFH: "bg-[#e0f2fe] text-[#026aa2]",
};

const inputClass = "max-w-[200px]";

type Status = { type: "ok" | "err"; message: string } | null;

/** Switch with optional stacked label + hint (Figma policy toggles). */
function PolicySwitch({
  checked,
  onChange,
  label,
  hint,
  disabled = false,
  ariaLabel,
  className,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  hint?: string;
  disabled?: boolean;
  ariaLabel?: string;
  className?: string;
}) {
  return (
    <label
      className={cn(
        "flex cursor-pointer items-start gap-3 select-none",
        disabled ? "cursor-not-allowed opacity-70" : "",
        className,
      )}
    >
      <input
        type="checkbox"
        role="switch"
        className="sr-only"
        checked={checked}
        disabled={disabled}
        aria-label={ariaLabel}
        onChange={(e) => onChange(e.target.checked)}
      />
      <span
        className={cn(
          "relative mt-0.5 inline-block h-6 w-10 shrink-0 rounded-full transition-colors duration-300",
          checked ? "bg-wz-primary" : "bg-[#e5e9ef]",
        )}
      >
        <span
          className={cn(
            "absolute top-0.5 left-0.5 size-5 rounded-full bg-white shadow-md transition-transform duration-300",
            checked && "translate-x-4",
          )}
        />
      </span>
      {label ? (
        <span className="flex min-w-0 flex-col">
          <span className="text-sm leading-5 font-semibold text-wz-heading">
            {label}
          </span>
          {hint ? (
            <span className="text-xs leading-4 text-wz-text-muted">{hint}</span>
          ) : null}
        </span>
      ) : null}
    </label>
  );
}

/**
 * Settings → Leave Policy: the organisation-wide leave rules (leave year,
 * accrual per type, expiry) plus the manual monthly accrual trigger.
 * Saves through PUT /leave/policy with `templateKey: "custom"`.
 */
export function LeavePolicyTab() {
  const policyQuery = useLeavePolicy();
  const updateMutation = useUpdateLeavePolicy();

  const serverPolicy = policyQuery.data?.policy ?? null;
  const [local, setLocal] = useState<LeavePolicy | null>(null);
  const [status, setStatus] = useState<Status>(null);
  const [expanded, setExpanded] = useState<string | null>("CL");
  const [saveConfirm, setSaveConfirm] = useState(false);
  const [accrualOpen, setAccrualOpen] = useState(false);

  // Seed the editor once the query resolves — render phase (no setState in effect).
  if (serverPolicy && local === null) {
    setLocal(serverPolicy);
  }

  const saving = updateMutation.isPending;
  const policy = local;

  const patchPolicy = (patch: Partial<LeavePolicy>) =>
    setLocal((prev) => (prev ? { ...prev, ...patch } : prev));

  const updateType = (code: string, patch: Partial<LeavePolicyType>) =>
    setLocal((prev) =>
      prev
        ? {
            ...prev,
            types: (prev.types || []).map((t) =>
              t.code === code ? { ...t, ...patch } : t,
            ),
          }
        : prev,
    );

  const updateAccrual = (
    code: string,
    patch: NonNullable<LeavePolicyType["accrual"]>,
  ) =>
    setLocal((prev) =>
      prev
        ? {
            ...prev,
            types: (prev.types || []).map((t) =>
              t.code === code
                ? { ...t, accrual: { ...(t.accrual || {}), ...patch } }
                : t,
            ),
          }
        : prev,
    );

  const updateYearEnd = (
    code: string,
    patch: NonNullable<LeavePolicyType["yearEnd"]>,
  ) =>
    setLocal((prev) =>
      prev
        ? {
            ...prev,
            types: (prev.types || []).map((t) =>
              t.code === code
                ? { ...t, yearEnd: { ...(t.yearEnd || {}), ...patch } }
                : t,
            ),
          }
        : prev,
    );

  const updateMonthEnd = (
    code: string,
    patch: NonNullable<LeavePolicyType["monthEnd"]>,
  ) =>
    setLocal((prev) =>
      prev
        ? {
            ...prev,
            types: (prev.types || []).map((t) =>
              t.code === code
                ? { ...t, monthEnd: { ...(t.monthEnd || {}), ...patch } }
                : t,
            ),
          }
        : prev,
    );

  const updateDocuments = (
    code: string,
    patch: NonNullable<LeavePolicyType["documents"]>,
  ) =>
    setLocal((prev) =>
      prev
        ? {
            ...prev,
            types: (prev.types || []).map((t) =>
              t.code === code
                ? { ...t, documents: { ...(t.documents || {}), ...patch } }
                : t,
            ),
          }
        : prev,
    );

  const handleSaveClick = () => {
    if (!policy) return;
    const validationError = validatePolicy(policy);
    if (validationError) {
      setStatus({ type: "err", message: validationError });
      return;
    }
    setStatus(null);
    setSaveConfirm(true);
  };

  const handleSave = async () => {
    if (!policy || saving) return;
    try {
      const res = await updateMutation.mutateAsync(buildPolicyPayload(policy));
      if (res.policy) setLocal(res.policy);
      const n = res.sync?.employeeCount;
      setStatus({
        type: "ok",
        message:
          typeof n === "number"
            ? `Leave policy saved successfully. Leave balances were updated for ${n} employee${n === 1 ? "" : "s"}.`
            : "Leave policy saved successfully.",
      });
      showSuccessToast("Leave policy saved.");
    } catch (err) {
      setStatus({
        type: "err",
        message:
          err instanceof ApiError ? err.message : "Could not save policy.",
      });
    } finally {
      setSaveConfirm(false);
    }
  };

  const queryError = policyQuery.error
    ? policyQuery.error instanceof ApiError
      ? policyQuery.error.message
      : "Could not load leave policy."
    : null;

  const types = policy?.types || [];
  const balanceTypes = types.filter(isBalanceType);
  const otherTypes = types.filter(isOtherType);

  const renderTypeCard = (t: LeavePolicyType) => {
    const isOpen = expanded === t.code;
    const isStandard = STANDARD_CODES.includes(t.code);
    const method = elAccrualMethod(t);
    const name = t.name || t.code;
    const capWarning =
      t.code === "EL"
        ? monthlyCreditExceedsYearlyCapWarning({
            monthlyCredit: t.accrual?.monthlyCredit,
            yearlyCap: t.accrual?.yearlyCap,
          })
        : null;

    const showDaysField =
      isStandard ||
      (needsMonthlyCredit(method) && t.code !== "WFH" && t.code !== "CO");
    const showCapField = t.code !== "WFH";
    const showMinDaysField =
      (t.code === "EL" || !isStandard) &&
      showsMinPaidDaysField(method) &&
      t.code !== "CO";
    const showWorkingDaysField =
      (t.code === "EL" || !isStandard) &&
      showsWorkingDaysField(method) &&
      t.code !== "CO";

    return (
      <article
        key={t.code}
        className={cn(
          "overflow-hidden rounded-wz-md border border-wz-border border-l-4 bg-white",
          ACCENT[t.code] || "border-l-wz-neutral-200",
          !t.enabled && "bg-wz-neutral-50",
        )}
      >
        <div className="flex items-start gap-3 px-4 py-3.5">
          <button
            type="button"
            aria-expanded={isOpen}
            onClick={() => setExpanded((prev) => (prev === t.code ? null : t.code))}
            className="flex min-w-0 flex-1 cursor-pointer items-start gap-3 border-0 bg-transparent p-0 text-left"
          >
            <span
              className={cn(
                "mt-0.5 inline-flex size-7 shrink-0 items-center justify-center rounded-wz-sm text-[11px] font-bold",
                CHIP[t.code] || "bg-wz-neutral-100 text-wz-text-muted",
              )}
            >
              {t.code}
            </span>
            <span className="flex min-w-0 flex-1 flex-col">
              <span className="text-sm leading-5 font-semibold text-wz-heading">
                {name}
              </span>
              <span className="mt-0.5 text-xs leading-4 text-wz-text-muted">
                {describeType(t, policy ?? undefined)}
              </span>
            </span>
            <ChevronDown
              size={18}
              aria-hidden
              className={cn(
                "mt-1 shrink-0 text-wz-text-muted transition-transform duration-200",
                isOpen && "rotate-180",
              )}
            />
          </button>
          <PolicySwitch
            checked={Boolean(t.enabled)}
            disabled={saving}
            ariaLabel={`${t.enabled ? "Disable" : "Enable"} ${name}`}
            className="shrink-0"
            onChange={(enabled) => updateType(t.code, { enabled })}
          />
        </div>

        {t.enabled && isOpen ? (
          <div className="flex flex-col gap-4 border-t border-wz-border px-4 py-4">
            {!isStandard && t.code !== "WFH" && t.code !== "CO" ? (
              <PolicySwitch
                checked={Boolean(t.hasBalance)}
                disabled={saving}
                label="Track remaining days"
                hint="Turn off for types like work from home, where people apply but do not use a quota."
                onChange={(hasBalance) => updateType(t.code, { hasBalance })}
              />
            ) : null}

            {t.hasBalance ? (
              <>
                {t.code === "EL" ? (
                  <Field
                    label="How EL is earned"
                    htmlFor={`el-method-${t.code}`}
                    hint="Paid days count Present, Late, Half Day, approved paid leave, and work from home. Credit for attendance-based rules is added on the 1st for the month that just ended."
                  >
                    <Select
                      id={`el-method-${t.code}`}
                      value={method}
                      disabled={saving}
                      onChange={(e) =>
                        updateAccrual(t.code, {
                          method: e.target.value,
                          minPresentDays: showsMinPaidDaysField(e.target.value)
                            ? t.accrual?.minPresentDays || 0
                            : 0,
                          standardWorkingDays: showsWorkingDaysField(
                            e.target.value,
                          )
                            ? t.accrual?.standardWorkingDays || 26
                            : 0,
                        })
                      }
                    >
                      <option value="fixed_monthly">Fixed days each month</option>
                      <option value="full_if_min_present">
                        Full credit if minimum paid days
                      </option>
                      <option value="prorate_paid_days">Prorate by paid days</option>
                    </Select>
                  </Field>
                ) : isStandard ? (
                  <p className="m-0 text-xs leading-4 text-wz-text-muted">
                    Standard policy; a fixed amount added every month, up to the
                    yearly maximum.
                  </p>
                ) : null}

                {t.code === "CO" ? (
                  <p className="m-0 text-xs leading-4 text-wz-text-muted">
                    No upfront grant and no monthly accrual — CO is earned only
                    through approved credit requests (worked on off-days).
                  </p>
                ) : null}

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                  {showDaysField ? (
                    <Field
                      label="Days each month"
                      htmlFor={`monthly-credit-${t.code}`}
                      hint={
                        t.code === "EL" && method === "full_if_min_present"
                          ? "Added on the 1st for the closed month when the minimum is met."
                          : t.code === "EL" && method === "prorate_paid_days"
                            ? "EL for a full month of the working days below. Added on the 1st for the closed month."
                            : "Accrues monthly, starting from the joining month."
                      }
                    >
                      <Input
                        id={`monthly-credit-${t.code}`}
                        type="number"
                        min={0}
                        step={0.5}
                        disabled={saving}
                        className={inputClass}
                        value={String(t.accrual?.monthlyCredit ?? "")}
                        onChange={(e) =>
                          updateAccrual(t.code, {
                            monthlyCredit:
                              e.target.value === "" ? null : Number(e.target.value),
                          })
                        }
                      />
                    </Field>
                  ) : null}

                  {showCapField ? (
                    <Field
                      label={
                        t.code === "CO"
                          ? "Maximum earnable per year"
                          : "Maximum per year"
                      }
                      htmlFor={`yearly-cap-${t.code}`}
                      hint={
                        t.code === "CO"
                          ? "Approvals stop adding CO once this limit is reached."
                          : "Credits stop once this limit is reached."
                      }
                    >
                      <Input
                        id={`yearly-cap-${t.code}`}
                        type="number"
                        min={0}
                        step={0.5}
                        disabled={saving}
                        className={inputClass}
                        value={String(t.accrual?.yearlyCap ?? "")}
                        onChange={(e) =>
                          updateAccrual(t.code, {
                            yearlyCap:
                              e.target.value === "" ? null : Number(e.target.value),
                          })
                        }
                      />
                    </Field>
                  ) : null}

                  {showMinDaysField ? (
                    <Field
                      label="Minimum paid days in the month"
                      htmlFor={`min-days-${t.code}`}
                      hint={
                        method === "prorate_paid_days"
                          ? "No EL is credited below this. 0 means no minimum."
                          : undefined
                      }
                    >
                      <Input
                        id={`min-days-${t.code}`}
                        type="number"
                        min={0}
                        step={1}
                        disabled={saving}
                        className={inputClass}
                        value={String(t.accrual?.minPresentDays ?? 0)}
                        onChange={(e) =>
                          updateAccrual(t.code, {
                            minPresentDays:
                              e.target.value === ""
                                ? null
                                : Number(e.target.value),
                          })
                        }
                      />
                    </Field>
                  ) : null}

                  {showWorkingDaysField ? (
                    <Field
                      label="Working days in a full month"
                      htmlFor={`working-days-${t.code}`}
                      hint="Paid days above this still credit only the monthly EL."
                    >
                      <Input
                        id={`working-days-${t.code}`}
                        type="number"
                        min={0.5}
                        step={0.5}
                        disabled={saving}
                        className={inputClass}
                        value={String(t.accrual?.standardWorkingDays ?? 26)}
                        onChange={(e) =>
                          updateAccrual(t.code, {
                            standardWorkingDays:
                              e.target.value === ""
                                ? null
                                : Number(e.target.value),
                          })
                        }
                      />
                    </Field>
                  ) : null}
                </div>

                {capWarning ? (
                  <p
                    className="m-0 rounded-wz-md border border-wz-warning/35 bg-wz-warning/10 px-3 py-2 text-xs text-wz-warning"
                    role="status"
                  >
                    {capWarning}
                  </p>
                ) : null}

                {t.code === "EL" ? (
                  <Field
                    label="Carry to next year, up to"
                    htmlFor={`carry-${t.code}`}
                    hint="Days above this limit are lost. Only used when unused days do NOT expire."
                    className="max-w-[320px]"
                  >
                    <Input
                      id={`carry-${t.code}`}
                      type="number"
                      min={0}
                      placeholder="No limit"
                      disabled={saving}
                      className={inputClass}
                      value={String(t.yearEnd?.carryForwardMax ?? "")}
                      onChange={(e) =>
                        updateYearEnd(t.code, {
                          carryForwardMax:
                            e.target.value === "" ? null : Number(e.target.value),
                        })
                      }
                    />
                  </Field>
                ) : null}

                {t.code === "SL" ? (
                  <Field
                    label="Ask for a medical document when sick leave is more than"
                    htmlFor={`doc-days-${t.code}`}
                    hint="Leave blank if a document is never required."
                    className="max-w-[420px]"
                  >
                    <span className="flex items-center gap-2">
                      <Input
                        id={`doc-days-${t.code}`}
                        type="number"
                        min={0}
                        placeholder="—"
                        disabled={saving}
                        className="max-w-[120px]"
                        value={String(t.documents?.requiredWhenDaysGt ?? "")}
                        onChange={(e) =>
                          updateDocuments(t.code, {
                            requiredWhenDaysGt:
                              e.target.value === ""
                                ? null
                                : Number(e.target.value),
                          })
                        }
                      />
                      <span className="text-sm text-wz-text-muted">days</span>
                    </span>
                  </Field>
                ) : null}
              </>
            ) : null}

            {t.code === "WFH" ? (
              <>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                  <Field
                    label="WFH days per month"
                    htmlFor={`wfh-monthly-${t.code}`}
                    hint="Added to balance every month. Blank = unlimited."
                  >
                    <Input
                      id={`wfh-monthly-${t.code}`}
                      type="number"
                      min={0}
                      step={1}
                      placeholder="No limit"
                      disabled={saving}
                      className={inputClass}
                      value={String(t.monthlyLimit ?? "")}
                      onChange={(e) =>
                        updateType(t.code, {
                          monthlyLimit:
                            e.target.value === "" ? null : Number(e.target.value),
                        })
                      }
                    />
                  </Field>
                  <Field
                    label="WFH days per year"
                    htmlFor={`wfh-annual-${t.code}`}
                    hint="Max per leave year. Blank = unlimited."
                  >
                    <Input
                      id={`wfh-annual-${t.code}`}
                      type="number"
                      min={0}
                      step={1}
                      placeholder="No limit"
                      disabled={saving}
                      className={inputClass}
                      value={String(t.annualLimit ?? "")}
                      onChange={(e) =>
                        updateType(t.code, {
                          annualLimit:
                            e.target.value === "" ? null : Number(e.target.value),
                        })
                      }
                    />
                  </Field>
                </div>
                <PolicySwitch
                  checked={t.monthEnd?.lapseUnused !== false}
                  disabled={saving}
                  label="Unused days expire at month end"
                  hint="If off, leftover WFH days carry into next month (yearly cap still applies)."
                  onChange={(lapseUnused) =>
                    updateMonthEnd(t.code, { lapseUnused })
                  }
                />
              </>
            ) : null}

            {t.code !== "WFH" ? (
              <PolicySwitch
                checked={t.yearEnd?.lapseUnused !== false}
                disabled={saving}
                label="Unused days expire at year end"
                hint="If off, leftover days can be carried into the next leave year."
                onChange={(lapseUnused) => updateYearEnd(t.code, { lapseUnused })}
              />
            ) : null}
          </div>
        ) : null}
      </article>
    );
  };

  return (
    <div className="flex flex-col gap-wz-6">
      <Card className="w-full space-y-wz-5">
        <div className="flex flex-wrap items-start justify-between gap-wz-4">
          <div className="min-w-0 max-w-[640px]">
            <h2 className="m-0 text-lg font-semibold text-wz-heading">
              Leave policy
            </h2>
            <p className="m-0 mt-1 text-sm leading-5 text-wz-text-muted">
              Decide how employees earn leave, when unused days expire, and
              which extra rules apply. This is what people will see on the Leave
              page.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Button
              variant="secondary"
              type="button"
              onClick={() => {
                setStatus(null);
                setAccrualOpen(true);
              }}
            >
              <CalendarClock size={16} className="mr-1.5" aria-hidden />
              Run Monthly Accrual
            </Button>
            <Button
              variant="primary"
              type="button"
              disabled={saving || !policy}
              onClick={handleSaveClick}
            >
              {saving ? "Saving…" : "Save Policy"}
            </Button>
          </div>
        </div>

        {status ? (
          <p
            className={cn(
              "m-0 rounded-wz-md px-3 py-2.5 text-sm",
              status.type === "ok"
                ? "bg-[#ecfdf3] text-[#027a48]"
                : "bg-[#fef3f2] text-[#b42318]",
            )}
            role={status.type === "ok" ? "status" : "alert"}
          >
            {status.message}
          </p>
        ) : null}

        {policyQuery.isLoading ? (
          <p className="m-0 text-sm text-wz-text-muted">
            Loading leave policy…
          </p>
        ) : queryError ? (
          <p className="m-0 rounded-wz-md bg-[#fef3f2] px-3 py-2 text-sm text-[#b42318]" role="alert">
            {queryError}
          </p>
        ) : !policy ? (
          <p className="m-0 text-sm text-wz-text-muted">No leave policy found.</p>
        ) : (
          <div className="flex flex-col gap-wz-5">
            {/* ── Leave year ──────────────────────────────── */}
            <section className="flex flex-col gap-4">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="min-w-0 max-w-[560px]">
                  <h3 className="m-0 text-[15px] leading-5 font-semibold text-wz-heading">
                    Leave year
                  </h3>
                  <p className="m-0 mt-1 text-sm leading-5 text-wz-text-muted">
                    Currently {policy.yearStartDay ?? 1}{" "}
                    {monthLabel(policy.yearStartMonth)} to the day before next
                    year’s start. Casual and sick leave that expire do so on the
                    last day of this year.
                  </p>
                </div>
                <div className="flex flex-wrap items-start gap-4">
                  <Field
                    label="Starts in"
                    htmlFor="leave-year-month"
                    className="w-[190px]"
                  >
                    <Select
                      id="leave-year-month"
                      value={String(policy.yearStartMonth ?? 1)}
                      disabled={saving}
                      onChange={(e) =>
                        patchPolicy({ yearStartMonth: Number(e.target.value) })
                      }
                    >
                      {MONTHS.map((label, i) => (
                        <option key={label} value={i + 1}>
                          {label}
                        </option>
                      ))}
                    </Select>
                  </Field>
                  <Field
                    label="On Day"
                    htmlFor="leave-year-day"
                    className="w-[92px]"
                  >
                    <Input
                      id="leave-year-day"
                      type="number"
                      min={1}
                      max={31}
                      disabled={saving}
                      value={String(policy.yearStartDay ?? 1)}
                      onChange={(e) =>
                        patchPolicy({
                          yearStartDay: Number(e.target.value) || 1,
                        })
                      }
                    />
                  </Field>
                </div>
              </div>

              <div className="border-t border-wz-border pt-4">
                <PolicySwitch
                  checked={policy.accruePaidLeaveDuringProbation === true}
                  disabled={saving}
                  label="Allow taking paid leave during probation"
                  hint="Off: CL, SL, and EL still collect each month, but employees cannot apply them until probation ends. On: employees may apply CL, SL, and EL while still on probation."
                  onChange={(accruePaidLeaveDuringProbation) =>
                    patchPolicy({ accruePaidLeaveDuringProbation })
                  }
                />
              </div>
            </section>

            {/* ── Leave type cards ────────────────────────── */}
            <section className="flex flex-col gap-4">
              {balanceTypes.map(renderTypeCard)}
            </section>

            {/* ── Other request types ─────────────────────── */}
            {otherTypes.length ? (
              <section className="flex flex-col gap-3 rounded-wz-md border border-wz-border bg-wz-neutral-50 p-4">
                <div>
                  <h3 className="m-0 text-[15px] leading-5 font-semibold text-wz-heading">
                    Other request types
                  </h3>
                  <p className="m-0 mt-1 text-xs leading-4 text-wz-text-muted">
                    These do not use a leave balance. Turn them off if employees
                    should not apply for them.
                  </p>
                </div>
                {otherTypes.map((t) => (
                  <div
                    key={t.code}
                    className="flex items-center gap-3 rounded-wz-md border border-wz-border bg-white px-3 py-2.5"
                  >
                    <span
                      className={cn(
                        "inline-flex size-7 shrink-0 items-center justify-center rounded-wz-sm text-[11px] font-bold",
                        CHIP[t.code] || "bg-wz-neutral-100 text-wz-text-muted",
                      )}
                    >
                      {t.code}
                    </span>
                    <span className="flex min-w-0 flex-1 flex-col">
                      <span className="text-sm leading-5 font-semibold text-wz-heading">
                        {t.name || t.label || t.code}
                      </span>
                      <span className="text-xs leading-4 text-wz-text-muted">
                        {t.paid === false ? "Unpaid" : "Counts as a paid day"}
                      </span>
                    </span>
                    <PolicySwitch
                      checked={Boolean(t.enabled)}
                      disabled={saving}
                      ariaLabel={`${t.enabled ? "Disable" : "Enable"} ${t.name || t.code}`}
                      className="shrink-0"
                      onChange={(enabled) => updateType(t.code, { enabled })}
                    />
                  </div>
                ))}
              </section>
            ) : null}
          </div>
        )}
      </Card>

      <ConfirmDialog
        open={saveConfirm}
        title="Save this leave policy?"
        message="The organisation policy will be replaced with the values you edited, and this year’s leave balances will be updated for every employee."
        tone="neutral"
        confirmLabel="Save Policy"
        loading={saving}
        onConfirm={() => void handleSave()}
        onClose={() => {
          if (!saving) setSaveConfirm(false);
        }}
      />

      <LeaveAccrualModal
        open={accrualOpen}
        onClose={() => {
          if (accrualOpen) setAccrualOpen(false);
        }}
      />
    </div>
  );
}

export default LeavePolicyTab;
