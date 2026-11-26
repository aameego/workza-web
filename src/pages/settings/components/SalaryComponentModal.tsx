import { useRef, useState } from "react";
import { Calculator } from "lucide-react";
import {
  Button,
  Field,
  Input,
  Modal,
  Select,
  showSuccessToast,
} from "../../../design-system";
import { ApiError } from "../../../lib/apiClient";
import {
  useCreateSalaryComponent,
  useUpdateSalaryComponent,
} from "../../../hooks/useSalarySettings";
import {
  CALC_LABELS,
  COMPONENT_PRESETS,
  FORMULA_TYPES,
  calculationTypeLabel,
  type CalculationType,
  type SalaryComponent,
  type SalaryComponentCategory,
} from "../../../services/salaryComponentService";
import { evaluateFormula, validateFormula } from "../salaryFormula";
import FormulaExpressionField from "./FormulaExpressionField";

const OTHER = "OTHER";

type ComponentForm = {
  preset: string;
  name: string;
  code: string;
  category: SalaryComponentCategory;
  calculationType: CalculationType;
  defaultValue: number | "";
  /** Percentage as typed — 12 means 12%. */
  ratePct: number | "";
  baseComponent: string;
  threshold: number | "";
  cap: number | "";
  formulaExpression: string;
  isPartOfCTC: boolean;
  isStatutory: boolean;
  showOnPayslip: boolean;
  isEmployerContribution: boolean;
};

export type SalaryComponentModalProps = {
  open: boolean;
  mode: "create" | "edit";
  component: SalaryComponent | null;
  components: SalaryComponent[];
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

const emptyForm = (): ComponentForm => ({
  preset: "",
  name: "",
  code: "",
  category: "Earning",
  calculationType: "FixedMonthly",
  defaultValue: 0,
  ratePct: "",
  baseComponent: "",
  threshold: "",
  cap: "",
  formulaExpression: "",
  isPartOfCTC: true,
  isStatutory: false,
  showOnPayslip: true,
  isEmployerContribution: false,
});

const formFor = (comp: SalaryComponent): ComponentForm => {
  const preset =
    COMPONENT_PRESETS.find((p) => p.code === comp.code && p.code !== OTHER)
      ?.code ?? OTHER;
  return {
    preset,
    name: comp.name || "",
    code: comp.code || "",
    category: comp.category || "Earning",
    calculationType: normalizeType(comp.calculationType),
    defaultValue: comp.defaultValue ?? 0,
    ratePct: Number(((comp.rate || 0) * 100).toFixed(4)),
    baseComponent: comp.baseComponent || "",
    threshold: comp.threshold ?? "",
    cap: comp.cap ?? "",
    formulaExpression: comp.formulaExpression || "",
    isPartOfCTC: comp.isPartOfCTC !== false,
    isStatutory: Boolean(comp.isStatutory),
    showOnPayslip: comp.showOnPayslip !== false,
    isEmployerContribution: Boolean(comp.isEmployerContribution),
  };
};

/** Add / Edit Salary Component — org library CRUD for payroll line items. */
export function SalaryComponentModal({
  open,
  mode,
  component,
  components,
  onClose,
}: SalaryComponentModalProps) {
  const [form, setForm] = useState<ComponentForm>(() =>
    mode === "edit" && component ? formFor(component) : emptyForm(),
  );
  const [errors, setErrors] = useState<{ name?: string; code?: string }>({});
  const [submitError, setSubmitError] = useState<string | null>(null);

  const createMutation = useCreateSalaryComponent();
  const updateMutation = useUpdateSalaryComponent();
  const saving = createMutation.isPending || updateMutation.isPending;
  const submittingRef = useRef(false);

  const editing = mode === "edit" && component;
  const isFormula = FORMULA_TYPES.has(form.calculationType);
  const isCustom = form.preset === OTHER;

  const setField = <K extends keyof ComponentForm>(
    key: K,
    value: ComponentForm[K],
  ) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => {
      if (key === "name" && prev.name) return {};
      if (key === "code" && prev.code) return {};
      return prev;
    });
    if (submitError) setSubmitError(null);
  };

  const handlePresetChange = (value: string) => {
    if (submitError) setSubmitError(null);
    setErrors({});
    if (value === OTHER) {
      setForm((prev) => ({
        ...prev,
        preset: OTHER,
        name: "",
        code: "",
        category: "Earning",
        isEmployerContribution: false,
      }));
      return;
    }
    const preset = COMPONENT_PRESETS.find((p) => p.code === value);
    if (preset) {
      setForm((prev) => ({
        ...prev,
        preset: preset.code,
        name: preset.name,
        code: preset.code,
        category: preset.category,
        isEmployerContribution: Boolean(preset.isEmployerContribution),
      }));
    }
  };

  const handleCustomNameChange = (value: string) => {
    if (submitError) setSubmitError(null);
    if (!/^[a-zA-Z0-9\s]*$/.test(value)) return;
    const autoCode = value
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, "_")
      .replace(/_+/g, "_")
      .replace(/_$/, "");
    setForm((prev) => ({
      ...prev,
      name: value,
      code: editing ? prev.code : autoCode,
    }));
    if (errors.name || errors.code) setErrors({});
  };

  const handleSubmit = async () => {
    if (submittingRef.current || saving) return;

    const name = form.name.trim();
    const code = form.code.trim().toUpperCase();
    const nextErrors: { name?: string; code?: string } = {};

    if (!name) nextErrors.name = "Component name is required.";
    else if (name.length > 100)
      nextErrors.name = "Component name cannot exceed 100 characters.";
    if (!code) nextErrors.code = "Component code is required.";
    else if (!editing && components.some((c) => c.code === code))
      nextErrors.code = `A component with the code '${code}' already exists.`;

    if (Object.keys(nextErrors).length) {
      setErrors(nextErrors);
      return;
    }

    if (form.calculationType === "PercentOfComponent" && !form.baseComponent) {
      setSubmitError("Please select a Base Component for this calculation type.");
      return;
    }
    if (
      isPercentType(form.calculationType) &&
      !(Number(form.ratePct) > 0)
    ) {
      setSubmitError("Percentage rate must be greater than 0.");
      return;
    }
    if (isFormula) {
      const fErr = validateFormula(
        form.formulaExpression,
        code,
        components.filter((c) => c.code !== code),
      );
      if (fErr) {
        setSubmitError(fErr);
        return;
      }
      const evalRes = evaluateFormula(form.formulaExpression, {
        BASIC: 30000,
        HRA: 15000,
        GROSS: 50000,
        CTC: 60000,
      });
      if (!evalRes.ok) {
        setSubmitError(`Formula error: ${evalRes.error}`);
        return;
      }
    }
    if (form.threshold !== "" && Number(form.threshold) < 0) {
      setSubmitError("Threshold cannot be a negative number.");
      return;
    }
    if (form.cap !== "" && Number(form.cap) < 0) {
      setSubmitError("Maximum cap cannot be a negative number.");
      return;
    }

    setErrors({});
    setSubmitError(null);

    const payload = {
      name,
      code,
      category: form.category,
      calculationType: form.calculationType,
      formulaExpression: isFormula ? form.formulaExpression.trim() : "",
      defaultValue: Number(form.defaultValue) || 0,
      rate: Number(form.ratePct) / 100,
      baseComponent:
        form.calculationType === "PercentOfComponent"
          ? form.baseComponent.toUpperCase()
          : "",
      threshold: form.threshold === "" ? null : Number(form.threshold),
      cap: form.cap === "" ? null : Number(form.cap),
      isPartOfCTC: form.isPartOfCTC,
      isStatutory: form.isStatutory,
      showOnPayslip: form.showOnPayslip,
      isEmployerContribution: form.isEmployerContribution,
    };

    submittingRef.current = true;
    try {
      if (editing && component) {
        await updateMutation.mutateAsync({ code: component.code, data: payload });
        showSuccessToast("Component updated successfully.");
      } else {
        await createMutation.mutateAsync(payload);
        showSuccessToast("Component added successfully.");
      }
      onClose();
    } catch (err) {
      setSubmitError(
        err instanceof ApiError
          ? err.message
          : "Could not save component. Please try again.",
      );
    } finally {
      submittingRef.current = false;
    }
  };

  const calcOptions = Object.entries(CALC_LABELS).map(([value, label]) => ({
    value,
    label,
  }));
  if (!calcOptions.some((o) => o.value === form.calculationType)) {
    calcOptions.push({
      value: form.calculationType,
      label: calculationTypeLabel(form.calculationType),
    });
  }

  const shadedBox =
    "rounded-wz-md border border-wz-border bg-wz-neutral-50 p-4 flex flex-col gap-wz-4";

  return (
    <Modal
      open={open}
      title={editing ? "Edit Salary Component" : "Add Salary Component"}
      onClose={onClose}
      size="lg"
      footer={
        <>
          <Button
            variant="secondary"
            type="button"
            onClick={onClose}
            disabled={saving}
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            type="button"
            onClick={() => void handleSubmit()}
            disabled={saving || !form.preset}
          >
            {saving
              ? "Saving…"
              : editing
                ? "Update Component"
                : "Add Component"}
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-wz-4">
        {submitError ? (
          <div
            className="rounded-wz-md border border-wz-error/35 bg-wz-error/8 px-3.5 py-2.5 text-xs text-wz-error"
            role="alert"
          >
            {submitError}
          </div>
        ) : null}

        <div className="grid grid-cols-1 gap-wz-4 sm:grid-cols-2">
          <Field
            label="Component Type"
            htmlFor="component-preset"
            required
          >
            <Select
              id="component-preset"
              value={form.preset}
              disabled={Boolean(editing) || saving}
              onChange={(e) => handlePresetChange(e.target.value)}
            >
              <option value="" disabled>
                Select a component...
              </option>
              {COMPONENT_PRESETS.map((p) => (
                <option key={p.code} value={p.code}>
                  {p.name}
                </option>
              ))}
            </Select>
          </Field>

          <Field
            label="Category"
            htmlFor="component-category"
            required
          >
            <Select
              id="component-category"
              value={form.category}
              disabled={!isCustom || saving}
              onChange={(e) =>
                setField("category", e.target.value as SalaryComponentCategory)
              }
            >
              <option value="Earning">Earning</option>
              <option value="Deduction">Deduction</option>
            </Select>
          </Field>
        </div>

        {isCustom ? (
          <div className="grid grid-cols-1 gap-wz-4 sm:grid-cols-2">
            <Field
              label="Custom Name"
              htmlFor="component-name"
              required
              error={errors.name}
            >
              <Input
                id="component-name"
                maxLength={100}
                placeholder="e.g. Travel Allowance"
                value={form.name}
                disabled={saving}
                invalid={Boolean(errors.name)}
                onChange={(e) => handleCustomNameChange(e.target.value)}
              />
            </Field>
            <Field
              label="Code (Auto-generated)"
              htmlFor="component-code"
              error={errors.code}
            >
              <Input
                id="component-code"
                placeholder="e.g. TRAVEL_ALLOWANCE"
                value={form.code}
                disabled
                onChange={(e) => setField("code", e.target.value)}
              />
            </Field>
          </div>
        ) : null}

        <Field
          label="Calculation Type"
          htmlFor="component-calc-type"
          required
        >
          <Select
            id="component-calc-type"
            value={form.calculationType}
            disabled={saving}
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
        </Field>

        {form.calculationType === "FixedMonthly" ||
        form.calculationType === "Manual" ? (
          <Field
            label="Default monthly amount (₹)"
            htmlFor="component-default-value"
            required
            hint="Employees can override this in their salary structure"
          >
            <Input
              id="component-default-value"
              type="number"
              min={0}
              step="any"
              inputMode="decimal"
              value={form.defaultValue}
              disabled={saving}
              onChange={(e) =>
                setField(
                  "defaultValue",
                  e.target.value === "" ? "" : Number(e.target.value),
                )
              }
            />
          </Field>
        ) : null}

        {isPercentType(form.calculationType) ? (
          <div className={shadedBox}>
            {form.calculationType === "PercentOfComponent" ? (
              <div className="grid grid-cols-1 gap-wz-4 sm:grid-cols-2">
                <Field
                  label="Base Component"
                  htmlFor="component-base"
                  required
                >
                  <Select
                    id="component-base"
                    value={form.baseComponent}
                    disabled={saving}
                    onChange={(e) => setField("baseComponent", e.target.value)}
                  >
                    <option value="" disabled>
                      Select base component...
                    </option>
                    {components
                      .filter((c) => c.code !== form.code)
                      .map((c) => (
                        <option key={c.code} value={c.code}>
                          {c.name}
                        </option>
                      ))}
                  </Select>
                </Field>
                <Field label="Rate (12 = 12%)" htmlFor="component-rate" required>
                  <Input
                    id="component-rate"
                    type="number"
                    min={0}
                    step="any"
                    inputMode="decimal"
                    placeholder="e.g., 12"
                    value={form.ratePct}
                    disabled={saving}
                    onChange={(e) =>
                      setField(
                        "ratePct",
                        e.target.value === "" ? "" : Number(e.target.value),
                      )
                    }
                  />
                </Field>
              </div>
            ) : (
              <Field label="Rate (12 = 12%)" htmlFor="component-rate" required>
                <Input
                  id="component-rate"
                  type="number"
                  min={0}
                  step="any"
                  inputMode="decimal"
                  placeholder="e.g., 12"
                  value={form.ratePct}
                  disabled={saving}
                  onChange={(e) =>
                    setField(
                      "ratePct",
                      e.target.value === "" ? "" : Number(e.target.value),
                    )
                  }
                />
              </Field>
            )}

            <div className="grid grid-cols-1 gap-wz-4 sm:grid-cols-2">
              <Field
                label="Threshold (₹)"
                htmlFor="component-threshold"
                required
                hint="Applies only if base is ≤ threshold (e.g., ESIC)."
              >
                <Input
                  id="component-threshold"
                  type="number"
                  min={0}
                  step="any"
                  inputMode="decimal"
                  placeholder="e.g., 21000"
                  value={form.threshold}
                  disabled={saving}
                  onChange={(e) =>
                    setField(
                      "threshold",
                      e.target.value === "" ? "" : Number(e.target.value),
                    )
                  }
                />
              </Field>
              <Field
                label="Maximum Cap (₹)"
                htmlFor="component-cap"
                required
                hint="Limits max deduction. Leave blank for no limit."
              >
                <Input
                  id="component-cap"
                  type="number"
                  min={0}
                  step="any"
                  inputMode="decimal"
                  placeholder="e.g., 1800"
                  value={form.cap}
                  disabled={saving}
                  onChange={(e) =>
                    setField(
                      "cap",
                      e.target.value === "" ? "" : Number(e.target.value),
                    )
                  }
                />
              </Field>
            </div>
          </div>
        ) : null}

        {isFormula ? (
          <div className={shadedBox}>
            <div className="flex items-center gap-1.5 text-sm font-semibold text-wz-heading">
              <Calculator size={14} aria-hidden />
              Custom Formula
            </div>
            <FormulaExpressionField
              id="component-formula"
              value={form.formulaExpression}
              onChange={(v) => setField("formulaExpression", v)}
              components={components}
              selfCode={form.code}
              disabled={saving}
            />
            <div className="grid grid-cols-1 gap-wz-4 sm:grid-cols-2">
              <Field
                label="Maximum Cap (₹)"
                htmlFor="component-formula-cap"
                hint="Limits max amount after calculation. Leave blank for no limit."
              >
                <Input
                  id="component-formula-cap"
                  type="number"
                  min={0}
                  step="any"
                  inputMode="decimal"
                  placeholder="e.g., 1800"
                  value={form.cap}
                  disabled={saving}
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
                htmlFor="component-formula-threshold"
                hint="Applies only if base ≤ threshold (e.g., ESIC)."
              >
                <Input
                  id="component-formula-threshold"
                  type="number"
                  min={0}
                  step="any"
                  inputMode="decimal"
                  placeholder="e.g., 21000"
                  value={form.threshold}
                  disabled={saving}
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
        ) : null}

        <div className="flex flex-col gap-wz-3 rounded-wz-md border border-wz-border bg-wz-neutral-50 p-4">
          <p className="m-0 text-sm font-semibold text-wz-heading">Options</p>

          <label className="flex cursor-pointer items-center gap-2 text-sm text-wz-heading">
            <input
              type="checkbox"
              className="size-4 cursor-pointer accent-wz-primary"
              checked={form.isPartOfCTC}
              disabled={saving}
              onChange={(e) => setField("isPartOfCTC", e.target.checked)}
            />
            Part of CTC
          </label>

          {form.category === "Deduction" ? (
            <label
              className={`flex items-center gap-2 text-sm text-wz-heading ${
                isCustom ? "cursor-pointer" : "cursor-not-allowed opacity-60"
              }`}
            >
              <input
                type="checkbox"
                className="size-4 accent-wz-primary"
                checked={form.isEmployerContribution}
                disabled={!isCustom || saving}
                onChange={(e) =>
                  setField("isEmployerContribution", e.target.checked)
                }
              />
              Paid by company (employer contribution, not deducted from pay)
            </label>
          ) : null}

          <label className="flex cursor-pointer items-center gap-2 text-sm text-wz-heading">
            <input
              type="checkbox"
              className="size-4 cursor-pointer accent-wz-primary"
              checked={form.isStatutory}
              disabled={saving}
              onChange={(e) => setField("isStatutory", e.target.checked)}
            />
            Statutory component (PF, ESIC, PT, etc.)
          </label>

          <label className="flex cursor-pointer items-center gap-2 text-sm text-wz-heading">
            <input
              type="checkbox"
              className="size-4 cursor-pointer accent-wz-primary"
              checked={form.showOnPayslip}
              disabled={saving}
              onChange={(e) => setField("showOnPayslip", e.target.checked)}
            />
            Show on payslip
          </label>
        </div>
      </div>
    </Modal>
  );
}

export default SalaryComponentModal;
