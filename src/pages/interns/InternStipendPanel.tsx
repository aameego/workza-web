import { useEffect, useState, type FormEvent } from "react";
import { Button, Field, Input, Select, showSuccessToast } from "../../design-system";
import { useConfigureInternStipend } from "../../hooks/useInterns";
import { ApiError } from "../../lib/apiClient";
import { validateStipendDraft, hasStipendData } from "../../services/internService";
import type { InternDetail } from "../../services/internTypes";
import { EmployeeSectionHeader } from "../employees/EmployeeInfoField";
import { STIPEND_FREQUENCY_OPTIONS } from "./internConstants";
import { formatInternStipend } from "./internViewFormat";

export type InternStipendPanelProps = {
  intern: InternDetail;
  canManage: boolean;
};

export default function InternStipendPanel({
  intern,
  canManage,
}: InternStipendPanelProps) {
  const [amount, setAmount] = useState(
    intern.stipendAmount === null || intern.stipendAmount === undefined
      ? ""
      : String(intern.stipendAmount),
  );
  const [frequency, setFrequency] = useState(
    intern.stipendFrequency || "monthly",
  );
  const [error, setError] = useState<string | null>(null);
  const mutation = useConfigureInternStipend();
  // Converted / completed internships are closed: stipend is read-only.
  const editable =
    canManage && !["converted", "completed"].includes(String(intern.internStatus || ""));

  useEffect(() => {
    setAmount(
      intern.stipendAmount === null || intern.stipendAmount === undefined
        ? ""
        : String(intern.stipendAmount),
    );
    setFrequency(intern.stipendFrequency || "monthly");
  }, [intern._id, intern.stipendAmount, intern.stipendFrequency]);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!editable || mutation.isPending) return;
    const stipendErr = validateStipendDraft({
      monthlyStipend: amount,
      stipendFrequency: frequency,
    });
    if (hasStipendData({ monthlyStipend: amount }) && stipendErr) {
      setError(stipendErr);
      return;
    }
    setError(null);
    try {
      await mutation.mutateAsync({
        id: intern._id,
        stipendAmount: hasStipendData({ monthlyStipend: amount })
          ? Number(amount)
          : 0,
        stipendFrequency: frequency,
      });
      showSuccessToast("Stipend saved.");
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "Could not update stipend",
      );
    }
  };

  return (
    <section className="rounded-wz-xl border border-wz-border bg-white p-wz-6">
      <EmployeeSectionHeader title="Stipend" />
      <p className="m-0 mt-wz-4 text-sm text-wz-heading">
        Current:{" "}
        <strong>{formatInternStipend(intern.stipendAmount, intern.stipendFrequency)}</strong>
      </p>
      {editable ? (
        // noValidate: our own messages instead of the browser silently blocking min/max.
        <form noValidate className="mt-wz-4 flex max-w-xl flex-col gap-wz-4" onSubmit={onSubmit}>
          <div className="grid grid-cols-1 gap-wz-4 md:grid-cols-2">
            <Field label="Stipend amount (₹)" htmlFor="intern-stipend-edit">
              <Input
                id="intern-stipend-edit"
                type="number"
                min={0}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </Field>
            <Field label="Frequency" htmlFor="intern-stipend-freq">
              <Select
                id="intern-stipend-freq"
                value={frequency}
                onChange={(e) => setFrequency(e.target.value)}
              >
                {STIPEND_FREQUENCY_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </Select>
            </Field>
          </div>
          {error ? (
            <p className="m-0 text-sm text-wz-error" role="alert">
              {error}
            </p>
          ) : null}
          <Button type="submit" variant="primary" disabled={mutation.isPending}>
            {mutation.isPending ? "Saving…" : "Save Stipend"}
          </Button>
        </form>
      ) : (
        <p className="m-0 mt-wz-4 text-sm text-wz-text-secondary">
          {canManage
            ? "Stipend can't be changed after the internship is converted or completed."
            : "You do not have permission to change stipend settings."}
        </p>
      )}
    </section>
  );
}