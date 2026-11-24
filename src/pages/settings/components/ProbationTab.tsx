import { useState } from "react";
import { Button, Card, Input } from "../../../design-system";
import { ApiError } from "../../../lib/apiClient";
import {
  useProbationPolicy,
  useRunProbationAutoConfirm,
  useUpdateProbationPolicy,
} from "../../../hooks/useProbation";
import type { ProbationPolicy } from "../../../services/probationService";
import { Toggle } from "./Toggle";

const DEFAULT_POLICY: ProbationPolicy = {
  probationMonths: 3,
  noticeDaysProbation: 15,
  noticeDaysConfirmed: 30,
  autoConfirmEnabled: true,
};

const validateMonths = (raw: string): string => {
  if (raw.trim() === "") return "Enter a valid value between 1 and 12.";
  const n = Number(raw);
  if (!Number.isInteger(n) || n < 1 || n > 12) {
    return "Enter a valid value between 1 and 12.";
  }
  return "";
};

export function ProbationTab() {
  const policyQuery = useProbationPolicy();
  const updateMutation = useUpdateProbationPolicy();
  const runMutation = useRunProbationAutoConfirm();

  // Derive from the query result; local overrides hold unsaved edits only.
  const [formOverride, setFormOverride] = useState<ProbationPolicy | null>(null);
  const [monthOverride, setMonthOverride] = useState<string | null>(null);
  const form = formOverride ?? policyQuery.data ?? DEFAULT_POLICY;
  const monthInput = monthOverride ?? String(form.probationMonths ?? 3);
  const [error, setError] = useState("");
  const [runMessage, setRunMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const monthError = validateMonths(monthInput);
  const isValid = monthError === "";

  const handleSave = async () => {
    if (!isValid) {
      setError("Fix the highlighted fields. Only valid values within the allowed ranges are accepted.");
      return;
    }
    setError("");
    try {
      await updateMutation.mutateAsync({
        probationMonths: Number(monthInput),
        noticeDaysProbation: form.noticeDaysProbation,
        noticeDaysConfirmed: form.noticeDaysConfirmed,
        autoConfirmEnabled: form.autoConfirmEnabled,
      });
      // Clear overrides so the saved values come from the refetched query.
      setFormOverride(null);
      setMonthOverride(null);
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "Could not save probation policy",
      );
    }
  };

  const handleRun = async () => {
    setRunMessage(null);
    try {
      const result = await runMutation.mutateAsync();
      setRunMessage({
        type: "success",
        text: `Auto-confirm completed: ${result.confirmed ?? 0} confirmed, ${result.backfilled ?? 0} backfilled.`,
      });
    } catch (err) {
      setRunMessage({
        type: "error",
        text:
          err instanceof ApiError ? err.message : "Could not run auto-confirm",
      });
    }
  };

  if (policyQuery.isLoading) {
    return (
      <Card className="w-full">
        <p className="m-0 text-sm text-wz-text-secondary">
          Loading probation policy…
        </p>
      </Card>
    );
  }

  return (
    <Card className="w-full space-y-wz-6">
      {/* Header */}
      <div className="flex flex-col gap-wz-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h2 className="m-0 text-base font-semibold text-wz-heading">
            Probation policy
          </h2>
          <p className="m-0 mt-0.5 max-w-[720px] text-sm text-wz-text-muted">
            Control how long new employees stay on probation, what notice period
            applies during and after probation, and whether expired probations
            are confirmed automatically.
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-wz-3">
          <Button
            type="button"
            variant="secondary"
            disabled={runMutation.isPending}
            onClick={handleRun}
          >
            {runMutation.isPending ? "Running…" : "Run Auto-Confirm Now"}
          </Button>
          <Button
            type="button"
            variant="primary"
            disabled={updateMutation.isPending || !isValid}
            onClick={handleSave}
          >
            {updateMutation.isPending ? "Saving…" : "Save Policy"}
          </Button>
        </div>
      </div>

      {error ? (
        <p className="m-0 rounded-wz-md bg-[#fef3f2] px-3 py-2 text-sm text-[#b42318]" role="alert">
          {error}
        </p>
      ) : null}

      {/* Probation duration */}
      <div className="border-t border-wz-border pt-wz-5">
        <h3 className="m-0 text-sm font-semibold text-wz-heading">
          Probation duration
        </h3>
        <p className="m-0 mt-0.5 text-sm text-wz-text-muted">
          Default probation period for new joiners.
        </p>
        <div className="mt-wz-4 max-w-[640px]">
          <label className="flex flex-col gap-1">
            <span className="text-[13px] font-semibold text-wz-heading">
              Probation period (months, 1–12)
            </span>
            <Input
              type="number"
              min={1}
              max={12}
              step={1}
              value={monthInput}
              invalid={Boolean(monthError)}
              onChange={(e) => {
                setMonthOverride(e.target.value);
                if (error) setError("");
              }}
            />
            {monthError ? (
              <span className="text-xs text-wz-error" role="alert">
                {monthError}
              </span>
            ) : (
              <span className="text-xs text-wz-text-muted">
                Allowed range is 1–12 months. Probation ends this many months
                after the joining date. HR can extend or shorten it per employee.
              </span>
            )}
          </label>
        </div>
      </div>

      {/* Auto-confirm */}
      <div className="border-t border-wz-border pt-wz-5">
        <h3 className="m-0 text-sm font-semibold text-wz-heading">Auto-confirm</h3>
        <p className="m-0 mt-0.5 text-sm text-wz-text-muted">
          What happens when the probation end date passes.
        </p>
        <div className="mt-wz-4 rounded-wz-lg bg-wz-hover p-wz-4">
          <Toggle
            label="Auto-confirm to full-time on expiry"
            checked={form.autoConfirmEnabled}
            onChange={(checked) =>
              setFormOverride({ ...form, autoConfirmEnabled: checked })
            }
            helpId="probation-auto-confirm-help"
          />
          <p
            id="probation-auto-confirm-help"
            className="m-0 mt-2 pl-[52px] text-xs text-wz-text-muted"
          >
            When ON, the daily cron (1:30 AM) automatically marks expired
            probations as full-time. When OFF, the employee stays on probation
            until HR takes action.
          </p>
        </div>
      </div>

      {/* Run auto-confirm now status */}
      {runMessage ? (
        <p
          className={
            runMessage.type === "success"
              ? "m-0 rounded-wz-md bg-wz-success/10 px-3 py-2 text-sm text-wz-success"
              : "m-0 rounded-wz-md bg-[#fef3f2] px-3 py-2 text-sm text-[#b42318]"
          }
          role="status"
        >
          {runMessage.text}
        </p>
      ) : null}
    </Card>
  );
}
