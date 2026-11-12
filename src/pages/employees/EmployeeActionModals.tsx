import { useState, type ReactNode } from "react";
import { Info } from "lucide-react";
import { Badge, Button, Field, Input, Modal, TextArea } from "../../design-system";
import { ApiError } from "../../lib/apiClient";
import { convertToConsultant, extendProbation } from "../../services/employeeService";
import type { EmployeeListItem } from "../../services/employeeTypes";
import {
  employmentActiveBadge,
  employmentActiveLabel,
  employmentTypeBadge,
  employmentTypeLabel,
} from "./employeeListHelpers";
import { initialsFromName } from "./employeeViewFormat";

/** Figma Left-Profile: 45px avatar, 20px name + md badges, 13px code • designation. */
export function EmployeeModalCard({
  employee,
  detailed = true,
  aside,
}: {
  employee: EmployeeListItem;
  /** false: Edit Attendance variant — active badge + code only. */
  detailed?: boolean;
  aside?: ReactNode;
}) {
  const typeLabel = detailed ? employmentTypeLabel(employee) : null;
  return (
    <div className="flex items-center gap-3">
      <span className="inline-flex size-[45px] shrink-0 items-center justify-center rounded-wz-full bg-wz-primary text-base font-semibold text-white">
        {initialsFromName(employee.name)}
      </span>
      <div className="flex min-w-0 flex-col gap-1">
        <div className="flex flex-wrap items-center gap-3">
          <span className="truncate text-xl leading-[25px] font-bold text-wz-heading">
            {employee.name || "Employee"}
          </span>
          <Badge status={employmentActiveBadge(employee)} size="md">
            {employmentActiveLabel(employee)}
          </Badge>
          {typeLabel ? (
            <Badge status={employmentTypeBadge(employee)} size="md">
              {typeLabel}
              {typeLabel === "Probation" ? <Info size={10} aria-hidden /> : null}
            </Badge>
          ) : null}
        </div>
        <div className="flex items-center gap-2 text-[13px] leading-4 font-semibold text-wz-text-muted">
          <span>{employee.employeeCode || "-"}</span>
          {detailed && employee.designation ? (
            <>
              <span aria-hidden>•</span>
              <span className="truncate">{employee.designation}</span>
            </>
          ) : null}
        </div>
      </div>
      {aside ? <div className="ml-auto text-right">{aside}</div> : null}
    </div>
  );
}

const ddmmyyyy = (d: Date) =>
  `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-xs leading-[15px] font-semibold text-wz-text-muted uppercase">
        {label}
      </span>
      <span className="text-sm leading-[18px] font-bold text-wz-heading">{value}</span>
    </div>
  );
}

type ActionModalProps = {
  open: boolean;
  employee: EmployeeListItem;
  onClose: () => void;
  onDone: () => void;
};

const errorText = (err: unknown) =>
  err instanceof ApiError ? err.message : "Action failed. Try again.";

/** Figma Extend Probation (1:23433). */
export function ExtendProbationModal({ open, employee, onClose, onDone }: ActionModalProps) {
  const [months, setMonths] = useState("");
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const n = Number(months);
  const validMonths = Number.isInteger(n) && n >= 1 && n <= 12;
  const end = employee.probationEndDate ? new Date(employee.probationEndDate) : null;
  const hasEnd = end && !Number.isNaN(end.getTime());
  const updated = hasEnd && validMonths ? new Date(end) : null;
  if (updated) updated.setMonth(updated.getMonth() + n);

  const close = () => {
    if (busy) return;
    setMonths("");
    setReason("");
    setError(null);
    onClose();
  };

  const submit = async () => {
    if (!validMonths) return setError("Enter between 1 and 12 months.");
    if (!reason.trim()) return setError("Reason for extension is required.");
    setBusy(true);
    setError(null);
    try {
      await extendProbation(employee._id, n, reason.trim());
      onDone();
      setBusy(false);
      setMonths("");
      setReason("");
      onClose();
    } catch (err) {
      setError(errorText(err));
      setBusy(false);
    }
  };

  return (
    <Modal
      open={open}
      title="Extend Probation"
      onClose={close}
      footer={
        <>
          <Button type="button" variant="secondary" disabled={busy} onClick={close}>
            Cancel
          </Button>
          <Button type="button" disabled={busy} onClick={() => void submit()}>
            {busy ? "Working…" : "Extend Probation"}
          </Button>
        </>
      }
    >
      <div className="-mt-2 flex flex-col gap-wz-6">
        <div className="flex flex-col gap-1">
          <h3 className="m-0 text-base leading-5 font-semibold text-wz-heading">
            Employee Details
          </h3>
          <p className="m-0 text-xs leading-[15px] text-wz-text-muted">
            Auto captured from the selected employee
          </p>
        </div>
        <EmployeeModalCard employee={employee} />
        <Field label="Addition Months (1 - 12)" required htmlFor="extend-months">
          <Input
            id="extend-months"
            type="number"
            inputMode="numeric"
            min={1}
            max={12}
            placeholder="Enter months"
            value={months}
            onChange={(e) => setMonths(e.target.value)}
          />
        </Field>
        <Field label="Reason for Extension" required htmlFor="extend-reason">
          <TextArea
            id="extend-reason"
            rows={2}
            style={{ minHeight: 66 }}
            placeholder="Enter here"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          />
        </Field>
        <InfoRow label="Current End Date" value={hasEnd ? ddmmyyyy(end) : "-"} />
        <InfoRow label="Updated End Date" value={updated ? ddmmyyyy(updated) : "-"} />
        {error ? (
          <p className="m-0 text-sm text-wz-error" role="alert">
            {error}
          </p>
        ) : null}
      </div>
    </Modal>
  );
}

const rupees = (v: number) => `₹${v.toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;

/** Figma Make it Consultant (1:22810): pay + TDS, live net payable. */
export function MakeConsultantModal({ open, employee, onClose, onDone }: ActionModalProps) {
  const [pay, setPay] = useState("");
  const [tds, setTds] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const gross = Math.max(0, Number(pay) || 0);
  const tdsPct = Math.min(100, Math.max(0, Number(tds) || 0));
  const tdsAmt = Math.round(gross * tdsPct) / 100;

  const close = () => {
    if (busy) return;
    setPay("");
    setTds("");
    setError(null);
    onClose();
  };

  const submit = async () => {
    if (!(gross > 0)) return setError("Monthly Consultancy Pay must be greater than ₹0");
    setBusy(true);
    setError(null);
    try {
      await convertToConsultant(employee._id, {
        monthlyConsultancyPay: gross,
        tdsPercent: tds === "" ? 0 : tdsPct,
      });
      onDone();
      setBusy(false);
      setPay("");
      setTds("");
      onClose();
    } catch (err) {
      setError(errorText(err));
      setBusy(false);
    }
  };

  return (
    <Modal
      open={open}
      title="Make it Consultant"
      onClose={close}
      footer={
        <>
          <Button type="button" variant="secondary" disabled={busy} onClick={close}>
            Cancel
          </Button>
          <Button
            type="button"
            disabled={busy}
            style={{ flex: "0 0 200px" }}
            onClick={() => void submit()}
          >
            {busy ? "Working…" : "Convert to Consultant"}
          </Button>
        </>
      }
    >
      <div className="-mt-2 flex flex-col gap-wz-6">
        <p className="m-0 text-xs leading-[15px] text-wz-text-muted">
          This employee will move to the consultancy list and become payroll-excluded.
        </p>
        <EmployeeModalCard employee={employee} />
        <Field label="Monthly Consultancy Pay" required htmlFor="consult-pay">
          <Input
            id="consult-pay"
            type="number"
            inputMode="decimal"
            min={0}
            placeholder="Enter amount"
            value={pay}
            onChange={(e) => setPay(e.target.value)}
          />
        </Field>
        <Field label="TDS %" htmlFor="consult-tds">
          <Input
            id="consult-tds"
            type="number"
            inputMode="decimal"
            min={0}
            max={100}
            placeholder="Enter here"
            value={tds}
            onChange={(e) => setTds(e.target.value)}
          />
        </Field>
        <div className="flex min-h-[50px] items-center justify-between gap-4 rounded-wz-md border border-wz-border bg-wz-neutral-50 px-4">
          <span className="text-xs leading-[15px] font-semibold text-wz-text-muted uppercase">
            Gross: {rupees(gross)}
            <span className="mx-2">|</span>
            TDS({tdsPct}%): -{rupees(tdsAmt)}
          </span>
          <span className="text-sm leading-[18px] font-bold text-wz-heading">
            Net Payable: {rupees(gross - tdsAmt)}
          </span>
        </div>
        {error ? (
          <p className="m-0 text-sm text-wz-error" role="alert">
            {error}
          </p>
        ) : null}
      </div>
    </Modal>
  );
}
