import { useEffect, useMemo, useState } from "react";
import { ChevronLeft } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { Button, Field, Input, Select } from "../../design-system";
import { ApiError } from "../../lib/apiClient";
import { readSessionUser } from "../../layouts/sessionUser";
import {
  useApplyLeavePolicyTemplate,
  useLeavePolicy,
  useRunLeaveAccrual,
  useUpdateLeavePolicy,
} from "../../hooks/useLeave";
import type { LeavePolicy, LeavePolicyType } from "../../services/leaveService";
import { canManageLeavePolicy } from "./leaveAccess";
import { accrualMonthOptions, accrualResultMessage } from "./leaveAccrual";

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const TEMPLATES = [
  { value: "india_standard", label: "India standard (CL/SL/EL)" },
  { value: "startup_lean", label: "Startup lean" },
  { value: "custom", label: "Custom (current)" },
];

export default function LeavePolicyPage() {
  const navigate = useNavigate();
  const { vendorSlug } = useParams();
  const base = `/${vendorSlug || "app"}`;
  const user = readSessionUser();
  const allowed = canManageLeavePolicy(user);

  const policyQuery = useLeavePolicy(allowed);
  const updateMutation = useUpdateLeavePolicy();
  const templateMutation = useApplyLeavePolicyTemplate();
  const accrualMutation = useRunLeaveAccrual();

  const [local, setLocal] = useState<LeavePolicy | null>(null);
  const [status, setStatus] = useState<{ type: "ok" | "err"; message: string } | null>(
    null,
  );
  const [templateKey, setTemplateKey] = useState("india_standard");
  const [accrualMonth, setAccrualMonth] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${d.getMonth() + 1}`;
  });

  useEffect(() => {
    if (policyQuery.data?.policy) {
      setLocal(policyQuery.data.policy);
    }
  }, [policyQuery.data]);

  const types = useMemo(() => local?.types || [], [local]);

  const updateType = (code: string, patch: Partial<LeavePolicyType>) => {
    setLocal((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        types: (prev.types || []).map((t) =>
          t.code === code ? { ...t, ...patch } : t,
        ),
      };
    });
  };

  const updateAccrual = (
    code: string,
    patch: NonNullable<LeavePolicyType["accrual"]>,
  ) => {
    setLocal((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        types: (prev.types || []).map((t) =>
          t.code === code
            ? { ...t, accrual: { ...(t.accrual || {}), ...patch } }
            : t,
        ),
      };
    });
  };

  if (!allowed) {
    return (
      <section className="rounded-wz-xl border border-wz-border bg-white p-wz-6">
        <h1 className="m-0 text-lg font-semibold text-wz-text-primary">
          Leave Policy
        </h1>
        <p className="m-0 mt-2 text-sm text-wz-text-secondary">
          You do not have access to leave policy settings.
        </p>
        <Button
          type="button"
          variant="secondary"
          className="mt-4"
          onClick={() => navigate(`${base}/leave`)}
        >
          Back to Leave
        </Button>
      </section>
    );
  }

  const save = async () => {
    if (!local) return;
    setStatus(null);
    try {
      const res = await updateMutation.mutateAsync({
        ...local,
        templateKey: local.templateKey || "custom",
        yearStartMonth: local.yearStartMonth ?? 1,
        yearStartDay: local.yearStartDay ?? 1,
        accruePaidLeaveDuringProbation:
          local.accruePaidLeaveDuringProbation === true,
        types: local.types,
      });
      setLocal(res.policy || res);
      setStatus({ type: "ok", message: "Leave policy saved successfully." });
    } catch (err) {
      setStatus({
        type: "err",
        message:
          err instanceof ApiError ? err.message : "Could not save policy.",
      });
    }
  };

  const applyTemplate = async () => {
    setStatus(null);
    try {
      const res = await templateMutation.mutateAsync(templateKey);
      setLocal(res.policy || res);
      setStatus({
        type: "ok",
        message: `Applied template “${templateKey}”. Review and save if needed.`,
      });
    } catch (err) {
      setStatus({
        type: "err",
        message:
          err instanceof ApiError
            ? err.message
            : "Could not apply template.",
      });
    }
  };

  const runAccrual = async () => {
    setStatus(null);
    const [year, month] = accrualMonth.split("-").map(Number);
    try {
      const result = await accrualMutation.mutateAsync({ year, month });
      setStatus({ type: "ok", message: accrualResultMessage(result) });
    } catch (err) {
      setStatus({
        type: "err",
        message:
          err instanceof ApiError ? err.message : "Accrual run failed.",
      });
    }
  };

  return (
    <div className="space-y-wz-5">
      <div className="flex flex-wrap items-center gap-3">
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={() => navigate(`${base}/leave`)}
        >
          <ChevronLeft size={16} className="mr-1" />
          Back
        </Button>
        <div>
          <h1 className="m-0 text-xl font-semibold text-wz-text-primary">
            Leave Policy
          </h1>
          <p className="m-0 mt-1 text-sm text-wz-text-secondary">
            Configure leave types, accruals, and year-start settings.
          </p>
        </div>
      </div>

      {status ? (
        <p
          className={
            status.type === "ok"
              ? "m-0 rounded-wz-md bg-[#ecfdf3] px-3 py-2 text-sm text-[#027a48]"
              : "m-0 rounded-wz-md bg-[#fef3f2] px-3 py-2 text-sm text-[#b42318]"
          }
          role="status"
        >
          {status.message}
        </p>
      ) : null}

      {policyQuery.isLoading || !local ? (
        <p className="m-0 text-sm text-wz-text-secondary">Loading policy…</p>
      ) : (
        <>
          <section className="rounded-wz-xl border border-wz-border bg-white p-wz-5">
            <h2 className="m-0 mb-wz-4 text-base font-semibold text-wz-text-primary">
              Leave year
            </h2>
            <div className="grid grid-cols-1 gap-wz-4 sm:grid-cols-3">
              <Field label="Year starts in">
                <Select
                  value={String(local.yearStartMonth ?? 1)}
                  onChange={(e) =>
                    setLocal((p) =>
                      p
                        ? {
                            ...p,
                            yearStartMonth: Number(e.target.value),
                          }
                        : p,
                    )
                  }
                >
                  {MONTHS.map((label, i) => (
                    <option key={label} value={i + 1}>
                      {label}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Day of month">
                <Input
                  type="number"
                  min={1}
                  max={28}
                  value={String(local.yearStartDay ?? 1)}
                  onChange={(e) =>
                    setLocal((p) =>
                      p
                        ? {
                            ...p,
                            yearStartDay: Number(e.target.value) || 1,
                          }
                        : p,
                    )
                  }
                />
              </Field>
              <div className="flex items-end gap-2">
                <Button
                  type="button"
                  variant="primary"
                  disabled={updateMutation.isPending}
                  onClick={() => void save()}
                >
                  {updateMutation.isPending ? "Saving…" : "Save policy"}
                </Button>
              </div>
            </div>
          </section>

          <section className="rounded-wz-xl border border-wz-border bg-white p-wz-5">
            <h2 className="m-0 mb-wz-3 text-base font-semibold text-wz-text-primary">
              Templates & accrual
            </h2>
            <label className="mb-wz-4 flex cursor-pointer items-start gap-2.5 text-sm text-wz-heading">
              <input
                type="checkbox"
                className="mt-0.5 size-4 accent-wz-primary"
                checked={local?.accruePaidLeaveDuringProbation === true}
                onChange={(e) =>
                  setLocal((p) =>
                    p
                      ? {
                          ...p,
                          accruePaidLeaveDuringProbation: e.target.checked,
                        }
                      : p,
                  )
                }
              />
              <span>
                <span className="font-semibold">
                  Allow taking paid leave during probation
                </span>
                <span className="mt-0.5 block text-xs font-normal text-wz-text-muted">
                  Off: CL, SL, and EL still collect each month, but employees
                  cannot apply them until probation ends. On: they may apply
                  while still on probation.
                </span>
              </span>
            </label>
            <div className="flex flex-wrap items-end gap-3">
              <Field label="Apply template" className="min-w-[220px]">
                <Select
                  value={templateKey}
                  onChange={(e) => setTemplateKey(e.target.value)}
                >
                  {TEMPLATES.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.label}
                    </option>
                  ))}
                </Select>
              </Field>
              <Button
                type="button"
                variant="secondary"
                disabled={templateMutation.isPending}
                onClick={() => void applyTemplate()}
              >
                {templateMutation.isPending ? "Applying…" : "Apply template"}
              </Button>
              <Field label="Accrual month" className="min-w-[180px]">
                <Select value={accrualMonth} onChange={(e) => setAccrualMonth(e.target.value)}>
                  {accrualMonthOptions().map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </Select>
              </Field>
              <Button
                type="button"
                variant="secondary"
                disabled={accrualMutation.isPending}
                onClick={() => void runAccrual()}
              >
                {accrualMutation.isPending ? "Running…" : "Run accrual now"}
              </Button>
            </div>
          </section>

          <section className="space-y-3">
            <h2 className="m-0 text-base font-semibold text-wz-text-primary">
              Leave types
            </h2>
            {types.map((t) => (
              <div
                key={t.code}
                className="rounded-wz-xl border border-wz-border bg-white p-wz-4"
              >
                <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="m-0 font-semibold text-wz-text-primary">
                      {t.label || t.code}
                      <span className="ml-2 text-xs font-normal text-wz-text-secondary">
                        ({t.code})
                      </span>
                    </p>
                  </div>
                  <label className="inline-flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={t.enabled !== false}
                      onChange={(e) =>
                        updateType(t.code, { enabled: e.target.checked })
                      }
                    />
                    Enabled
                  </label>
                </div>
                {["CL", "SL", "EL"].includes(t.code) ? (
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                    <Field label="Days each month">
                      <Input
                        type="number"
                        min={0}
                        step="0.5"
                        value={String(t.accrual?.monthlyCredit ?? "")}
                        onChange={(e) =>
                          updateAccrual(t.code, {
                            monthlyCredit:
                              e.target.value === ""
                                ? null
                                : Number(e.target.value),
                          })
                        }
                      />
                    </Field>
                    <Field label="Maximum per year">
                      <Input
                        type="number"
                        min={0}
                        step="0.5"
                        value={String(t.accrual?.yearlyCap ?? "")}
                        onChange={(e) =>
                          updateAccrual(t.code, {
                            yearlyCap:
                              e.target.value === ""
                                ? null
                                : Number(e.target.value),
                          })
                        }
                      />
                    </Field>
                    <Field label="Has balance">
                      <Select
                        value={t.hasBalance === false ? "no" : "yes"}
                        onChange={(e) =>
                          updateType(t.code, {
                            hasBalance: e.target.value === "yes",
                          })
                        }
                      >
                        <option value="yes">Yes</option>
                        <option value="no">No</option>
                      </Select>
                    </Field>
                  </div>
                ) : t.code === "WFH" ? (
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                    <Field label="Monthly limit">
                      <Input
                        type="number"
                        min={0}
                        value={String(t.monthlyLimit ?? "")}
                        onChange={(e) =>
                          updateType(t.code, {
                            monthlyLimit:
                              e.target.value === ""
                                ? null
                                : Number(e.target.value),
                          })
                        }
                      />
                    </Field>
                    <Field label="Annual limit">
                      <Input
                        type="number"
                        min={0}
                        value={String(t.annualLimit ?? "")}
                        onChange={(e) =>
                          updateType(t.code, {
                            annualLimit:
                              e.target.value === ""
                                ? null
                                : Number(e.target.value),
                          })
                        }
                      />
                    </Field>
                    <Field label="Unused WFH at month end">
                      <Select
                        value={t.monthEnd?.lapseUnused === false ? "carry" : "lapse"}
                        onChange={(e) =>
                          updateType(t.code, {
                            monthEnd: {
                              ...(t.monthEnd || {}),
                              lapseUnused: e.target.value !== "carry",
                            },
                          })
                        }
                      >
                        <option value="lapse">Lapses</option>
                        <option value="carry">Carries forward</option>
                      </Select>
                    </Field>
                  </div>
                ) : t.code === "CO" ? (
                  <Field label="Yearly CO credit cap">
                    <Input
                      type="number"
                      min={0}
                      value={String(t.accrual?.yearlyCap ?? "")}
                      onChange={(e) =>
                        updateAccrual(t.code, {
                          yearlyCap:
                            e.target.value === ""
                              ? null
                              : Number(e.target.value),
                        })
                      }
                    />
                  </Field>
                ) : (
                  <p className="m-0 text-sm text-wz-text-secondary">
                    {t.enabled === false
                      ? "Turned off — employees cannot apply."
                      : "Employees can apply for this type."}
                  </p>
                )}
              </div>
            ))}
          </section>
        </>
      )}
    </div>
  );
}
