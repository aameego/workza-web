import { useEffect, useState } from "react";
import { Info, X } from "lucide-react";
import {
  Button,
  Field,
  Select,
  showSuccessToast,
} from "../../../design-system";
import { ApiError } from "../../../lib/apiClient";
import { useRunLeaveAccrual } from "../../../hooks/useLeave";
import { accrualResultMessage } from "../../leave/leaveAccrual";
import { MONTHS } from "../leavePolicyForm";

export type LeaveAccrualModalProps = {
  open: boolean;
  onClose: () => void;
};

/**
 * "Monthly leave accrual" popup (Figma: floating card top-right) — manual
 * trigger for the month-end accrual cron. POST /leave/accrual/run is
 * ledger-guarded, so re-running a month is safe.
 */
export function LeaveAccrualModal({ open, onClose }: LeaveAccrualModalProps) {
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [error, setError] = useState<string | null>(null);
  const accrualMutation = useRunLeaveAccrual();
  const running = accrualMutation.isPending;

  const yearOptions = [
    now.getFullYear() - 1,
    now.getFullYear(),
    now.getFullYear() + 1,
  ];

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !running) onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, running, onClose]);

  if (!open) return null;

  const handleRun = async () => {
    if (running) return;
    setError(null);
    try {
      const result = await accrualMutation.mutateAsync({ year, month });
      showSuccessToast(accrualResultMessage(result));
      onClose();
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : "Could not run leave accrual.",
      );
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Monthly leave accrual"
      className="fixed top-4 right-4 z-80 w-[370px] max-w-[calc(100vw-2rem)] rounded-wz-xl border border-wz-border bg-white p-5 shadow-[0_20px_50px_rgba(15,23,42,0.18)]"
    >
      <button
        type="button"
        aria-label="Close"
        disabled={running}
        onClick={onClose}
        className="absolute top-3 right-3 inline-flex size-6 cursor-pointer items-center justify-center rounded-wz-sm border border-wz-border bg-white text-wz-heading hover:bg-wz-neutral-50 disabled:cursor-not-allowed"
      >
        <X size={12} strokeWidth={2.5} />
      </button>

      <div className="flex gap-3 pr-6">
        <span className="inline-flex size-9 shrink-0 items-center justify-center rounded-wz-full bg-[#e8eef8] text-wz-primary">
          <Info size={18} aria-hidden />
        </span>
        <div className="flex min-w-0 flex-col gap-1">
          <h3 className="m-0 text-base leading-5 font-bold text-wz-heading">
            Monthly leave accrual
          </h3>
          <p className="m-0 text-xs leading-4 text-wz-text-muted">
            Manually credit a month&apos;s leave to every eligible employee
            (CL + SL + EL). EL only after probation completes. Employees in
            different statuses are skipped — safe to re-run.
          </p>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <Field label="Month" htmlFor="accrual-month">
          <Select
            id="accrual-month"
            value={String(month)}
            disabled={running}
            onChange={(e) => setMonth(Number(e.target.value))}
          >
            {MONTHS.map((label, i) => (
              <option key={label} value={i + 1}>
                {label}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Year" htmlFor="accrual-year">
          <Select
            id="accrual-year"
            value={String(year)}
            disabled={running}
            onChange={(e) => setYear(Number(e.target.value))}
          >
            {yearOptions.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </Select>
        </Field>
      </div>

      {error ? (
        <p
          className="m-0 mt-3 rounded-wz-md border border-wz-error/35 bg-wz-error/8 px-3 py-2 text-xs text-wz-error"
          role="alert"
        >
          {error}
        </p>
      ) : null}

      <div className="mt-4 flex justify-end gap-3">
        <Button
          variant="secondary"
          type="button"
          disabled={running}
          onClick={onClose}
        >
          Cancel
        </Button>
        <Button
          variant="primary"
          type="button"
          disabled={running}
          onClick={() => void handleRun()}
        >
          {running ? "Running…" : "Run Accrual"}
        </Button>
      </div>
    </div>
  );
}

export default LeaveAccrualModal;
