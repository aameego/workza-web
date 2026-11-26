import { useState } from "react";
import { Button, Field, Input, Modal, Select } from "../../../design-system";
import {
  CALC_LABELS,
  FORMULA_TYPES,
  calculationTypeLabel,
  type CalculationType,
  type SalaryComponent,
} from "../../../services/salaryComponentService";
import type { StructureItem } from "../../../services/salaryStructureService";
import { evaluateFormula, validateFormula } from "../salaryFormula";
import FormulaExpressionField from "./FormulaExpressionField";

type OverrideForm = {
  calculationType: CalculationType;
  /** Percentage as typed — 12 means 12%. */
  ratePct: number | "";
  baseComponent: string;
  cap: number | "";
  threshold: number | "";
  fixedAmount: number;
  formulaExpression: string;
};

export type AdjustComponentOverrideModalProps = {
  open: boolean;
  /** Global component definition (rates/caps the override compares against). */
  component: SalaryComponent;
  /** Current structure entry — may already carry overrides. */
  entry: StructureItem;
  /** Org library, for the base-component picker. */
  components: SalaryComponent[];
  onSave: (entry: StructureItem) => void;
  onReset: () => void;
  onClose: () => void;
};

const normalizeType = (type?: string): CalculationType =>
  type === "Formula"
    ? "CustomFormula"
    : ((type || "FixedMonthly") as CalculationType);

const isPercentType = (type: CalculationType) =>
  type === "PercentOfComponent" ||
  type === "PercentOfGross" ||
  type === "PercentOfCTC";

const isFixedType = (type: CalculationType) =>
  type === "FixedMonthly" || type === "Manual";

/** Effective values: structure override when set, otherwise the global def. */
const effectiveValues = (
  component: SalaryComponent,
  entry: StructureItem,
): OverrideForm => ({
  calculationType: normalizeType(
    entry.calculationTypeOverride || component.calculationType,
  ),
  ratePct:
    entry.rateOverride != null
      ? Number((entry.rateOverride * 100).toFixed(4))
      : Number(((component.rate || 0) * 100).toFixed(4)),
  baseComponent: entry.baseComponentOverride || component.baseComponent || "",
  cap: entry.capOverride != null ? entry.capOverride : (component.cap ?? ""),
  threshold:
    entry.thresholdOverride != null
      ? entry.thresholdOverride
      : (component.threshold ?? ""),
  fixedAmount:
    entry.fixedAmountOverride != null
      ? entry.fixedAmountOverride
      : (component.defaultValue || 0),
  formulaExpression:
    entry.formulaOverride != null
      ? entry.formulaOverride
      : (component.formulaExpression || ""),
});

/**
 * "Adjust Basic Salary" (or any component) — per-structure override of the
 * global component definition. Writes into the open structure form; the
 * structure must still be saved for it to persist.
 */
export function AdjustComponentOverrideModal({
  open,
  component,
  entry,
  components,
  onSave,
  onReset,
  onClose,
}: AdjustComponentOverrideModalProps) {
  const [form, setForm] = useState<OverrideForm>(() =>
    effectiveValues(component, entry),
  );
  const [error, setError] = useState<string | null>(null);

  const setField = <K extends keyof OverrideForm>(
    key: K,
    value: OverrideForm[K],
  ) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (error) setError(null);
  };

  const globalRatePct = Number(((component.rate || 0) * 100).toFixed(2));

  const handleSave = () => {
    const type = form.calculationType;

    if (type === "PercentOfComponent" && !form.baseComponent) {
      setError("Please select a Base Component for this calculation type.");
      return;
    }
    if (isPercentType(type) && !(Number(form.ratePct) > 0)) {
      setError("Percentage rate must be greater than 0.");
      return;
    }
    if (FORMULA_TYPES.has(type)) {
      const fErr = validateFormula(
        form.formulaExpression,
        component.code,
        components.filter((c) => c._id !== component._id),
      );
      if (fErr) {
        setError(fErr);
        return;
      }
      const evalRes = evaluateFormula(form.formulaExpression, {
        BASIC: 30000,
        HRA: 15000,
        GROSS: 50000,
        CTC: 60000,
      });
      if (!evalRes.ok) {
        setError(`Formula error: ${evalRes.error}`);
        return;
      }
    }
    if (form.cap !== "" && Number(form.cap) < 0) {
      setError("Maximum Cap cannot be negative.");
      return;
    }
    if (form.threshold !== "" && Number(form.threshold) < 0) {
      setError("Threshold cannot be negative.");
      return;
    }

    // An override is only stored when it differs from the global value.
    const next: StructureItem = { componentId: component._id };

    const globalType = normalizeType(component.calculationType);
    if (type !== globalType) next.calculationTypeOverride = type;

    if (isPercentType(type)) {
      const rate = Number(form.ratePct) / 100;
      if (rate !== (component.rate || 0)) next.rateOverride = rate;
      if (type === "PercentOfComponent") {
        const base = String(form.baseComponent || "").toUpperCase();
        if (base && base !== (component.baseComponent || "")) {
          next.baseComponentOverride = base;
        }
      }
    }

    if (isFixedType(type)) {
      const amount = Number(form.fixedAmount) || 0;
      if (amount !== (component.defaultValue || 0)) {
        next.fixedAmountOverride = amount;
      }
    }

    if (FORMULA_TYPES.has(type)) {
      const expr = form.formulaExpression.trim();
      if (expr !== (component.formulaExpression || "").trim()) {
        next.formulaOverride = expr;
      }
    }

    const cap = form.cap === "" ? null : Number(form.cap);
    if (cap !== (component.cap ?? null)) next.capOverride = cap;

    const threshold = form.threshold === "" ? null : Number(form.threshold);
    if (threshold !== (component.threshold ?? null)) {
      next.thresholdOverride = threshold;
    }

    onSave(next);
  };

  const type = form.calculationType;
  const showFixed = isFixedType(type);
  const showPercent = isPercentType(type);
  const showFormula = FORMULA_TYPES.has(type);

  const calcOptions = Object.entries(CALC_LABELS).map(([value, label]) => ({
    value,
    label,
  }));
  if (!calcOptions.some((o) => o.value === type)) {
    calcOptions.push({ value: type, label: calculationTypeLabel(type) });
  }

  const baseOptions = components.filter((c) => c.code !== component.code);

  return (
    <Modal
      open={open}
      title={`Adjust ${component.name}`}
      onClose={onClose}
      footer={
        <>
          <button
            type="button"
            onClick={onReset}
            className="inline-flex min-h-[43px] cursor-pointer items-center justify-center gap-wz-2 rounded-wz-md border-[1.5px] border-wz-success bg-white px-5 py-2.5 text-sm font-semibold text-wz-success transition-colors hover:bg-wz-badge-success-bg disabled:cursor-not-allowed disabled:opacity-60"
          >
            Reset to Global
          </button>
          <div className="flex flex-1 gap-wz-4 [&>*]:flex-1">
            <Button variant="secondary" type="button" onClick={onClose}>
              Cancel
            </Button>
            <Button variant="primary" type="button" onClick={handleSave}>
              Save Override
            </Button>
          </div>
        </>
      }
    >
      <div className="flex flex-col gap-wz-4">
        {error ? (
          <div
            className="rounded-wz-md border border-wz-error/35 bg-wz-error/8 px-3.5 py-2.5 text-xs text-wz-error"
            role="alert"
          >
            {error}
          </div>
        ) : null}

        <Field
          label="Calculation type for this structure"
          htmlFor="override-calc-type"
        >
          <Select
            id="override-calc-type"
            value={type}
            onChange={(e) =>
              setField("calculationType", e.target.value as CalculationType)
            }
          >
            {calcOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </Select>
          <p className="m-0 text-xs leading-4 text-wz-text-muted">
            Global is <b>{calculationTypeLabel(component.calculationType)}</b>.
            Changing here affects only this structure’s split &amp; payroll.
          </p>
        </Field>

        {showFixed ? (
          <Field
            label="Fixed monthly amount (₹)"
            htmlFor="override-fixed"
            hint={`Overrides global ₹${component.defaultValue ?? 0}`}
          >
            <Input
              id="override-fixed"
              type="number"
              min={0}
              step="any"
              inputMode="decimal"
              value={form.fixedAmount}
              onChange={(e) =>
                setField(
                  "fixedAmount",
                  e.target.value === "" ? 0 : Number(e.target.value),
                )
              }
            />
          </Field>
        ) : null}

        {showPercent && type === "PercentOfComponent" ? (
          <div className="grid grid-cols-1 gap-wz-4 sm:grid-cols-2">
            <Field
              label="Base component"
              htmlFor="override-base"
              required
              hint={`Global: ${component.baseComponent || "—"}`}
            >
              <Select
                id="override-base"
                value={form.baseComponent}
                onChange={(e) => setField("baseComponent", e.target.value)}
              >
                <option value="">Select base…</option>
                {baseOptions.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.name} ({c.code})
                  </option>
                ))}
              </Select>
            </Field>
            <Field
              label="Rate % (12 = 12%)"
              htmlFor="override-rate"
              required
              hint={`Global: ${globalRatePct.toFixed(2)}%`}
            >
              <Input
                id="override-rate"
                type="number"
                min={0}
                step="any"
                inputMode="decimal"
                value={form.ratePct}
                onChange={(e) =>
                  setField(
                    "ratePct",
                    e.target.value === "" ? "" : Number(e.target.value),
                  )
                }
              />
            </Field>
          </div>
        ) : null}

        {showPercent && type !== "PercentOfComponent" ? (
          <Field
            label="Rate % (12 = 12%)"
            htmlFor="override-rate"
            required
            hint={`Global: ${globalRatePct.toFixed(2)}%`}
          >
            <Input
              id="override-rate"
              type="number"
              min={0}
              step="any"
              inputMode="decimal"
              value={form.ratePct}
              onChange={(e) =>
                setField(
                  "ratePct",
                  e.target.value === "" ? "" : Number(e.target.value),
                )
              }
            />
          </Field>
        ) : null}

        {showFormula ? (
          <FormulaExpressionField
            id="override-formula"
            value={form.formulaExpression}
            onChange={(v) => setField("formulaExpression", v)}
            components={components}
            selfCode={component.code}
            hint={
              component.formulaExpression
                ? `Global: ${component.formulaExpression}`
                : undefined
            }
          />
        ) : null}

        <div className="grid grid-cols-1 gap-wz-4 sm:grid-cols-2">
          <Field
            label="Maximum Cap (₹)"
            htmlFor="override-cap"
            required
            hint={`Leave blank to use global ${
              component.cap != null ? component.cap : "no cap"
            }`}
          >
            <Input
              id="override-cap"
              type="number"
              min={0}
              step="any"
              inputMode="decimal"
              placeholder={
                component.cap != null ? `Global ${component.cap}` : "No limit"
              }
              value={form.cap}
              onChange={(e) =>
                setField(
                  "cap",
                  e.target.value === "" ? "" : Number(e.target.value),
                )
              }
            />
          </Field>
          <Field
            label="Threshold (₹)"
            htmlFor="override-threshold"
            required
            hint="Leave blank to use global"
          >
            <Input
              id="override-threshold"
              type="number"
              min={0}
              step="any"
              inputMode="decimal"
              placeholder={
                component.threshold != null
                  ? `Global ${component.threshold}`
                  : "No threshold"
              }
              value={form.threshold}
              onChange={(e) =>
                setField(
                  "threshold",
                  e.target.value === "" ? "" : Number(e.target.value),
                )
              }
            />
          </Field>
        </div>
      </div>
    </Modal>
  );
}

export default AdjustComponentOverrideModal;
