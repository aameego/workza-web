import type { ReactNode } from "react";
import { Field, Select, TextArea } from "../../../design-system";

const OPERATORS = [
  { label: "+", token: " + ", title: "Add" },
  { label: "−", token: " - ", title: "Subtract" },
  { label: "×", token: " * ", title: "Multiply" },
  { label: "÷", token: " / ", title: "Divide" },
  { label: "(", token: "(", title: "Open bracket" },
  { label: ")", token: ")", title: "Close bracket" },
];

type ComponentOption = { code: string; name: string };

export type FormulaExpressionFieldProps = {
  id: string;
  value: string;
  onChange: (value: string) => void;
  /** Validation message rendered under the textarea. */
  error?: string;
  /** Extra helper line (e.g. the global expression) rendered under the hint. */
  hint?: ReactNode;
  components: ComponentOption[];
  /** Component being edited — excluded from the insert list (no self reference). */
  selfCode?: string | null;
  disabled?: boolean;
};

/** Formula expression textarea + insert-component picker + operator keypad. */
export function FormulaExpressionField({
  id,
  value,
  onChange,
  error,
  hint,
  components,
  selfCode,
  disabled = false,
}: FormulaExpressionFieldProps) {
  const options = [
    ...components.filter((c) => c.code !== selfCode),
    { code: "GROSS", name: "Total earnings" },
    { code: "CTC", name: "Monthly CTC" },
  ];

  const append = (token: string) => {
    if (disabled) return;
    onChange(`${value}${token}`);
  };

  return (
    <Field
      label="Formula Expression"
      htmlFor={id}
      required
      error={error}
    >
      <TextArea
        id={id}
        rows={2}
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        placeholder="e.g. BASIC * 0.12  or  (BASIC + HRA) * 0.10"
        invalid={Boolean(error)}
      />
      <p className="m-0 text-xs leading-4 text-wz-text-muted">
        Use codes like BASIC, HRA, GROSS, CTC with + - * / ( ) . Supports
        MIN(a,b) and MAX(a,b).
      </p>
      {hint ? (
        <p className="m-0 text-xs leading-4 text-wz-text-muted">{hint}</p>
      ) : null}

      <div className="mt-1 flex flex-wrap items-end gap-2">
        <div className="flex min-w-[200px] flex-1 flex-col gap-1.5">
          <label
            htmlFor={`${id}-insert`}
            className="text-[13px] font-semibold leading-[18px] text-wz-heading"
          >
            Insert component
          </label>
          <Select
            id={`${id}-insert`}
            value=""
            disabled={disabled}
            onChange={(e) => {
              const token = e.target.value;
              if (token) append(token);
            }}
          >
            <option value="">Select component…</option>
            {options.map((c) => (
              <option key={c.code} value={c.code}>
                {c.code} — {c.name}
              </option>
            ))}
          </Select>
        </div>
        <div className="flex gap-1.5">
          {OPERATORS.map((op) => (
            <button
              key={op.label}
              type="button"
              title={op.title}
              disabled={disabled}
              onClick={() => append(op.token)}
              className="inline-flex size-8 cursor-pointer items-center justify-center rounded-wz-sm border border-wz-border bg-white text-sm font-semibold text-wz-heading hover:bg-wz-hover disabled:cursor-not-allowed disabled:text-wz-text-muted"
            >
              {op.label}
            </button>
          ))}
        </div>
      </div>
    </Field>
  );
}

export default FormulaExpressionField;
