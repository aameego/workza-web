import { useEffect, useState } from "react";
import { Button, Field, Input, Modal } from "../../design-system";
import { ApiError } from "../../lib/apiClient";
import {
  saveConsultancyPayment,
  type ConsultancyPayment,
} from "../../services/consultancyPaymentService";
import type { EmployeeListItem } from "../../services/employeeTypes";
import { EmployeeModalCard } from "./EmployeeActionModals";

const rupees = (v: number) => `₹${v.toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;

/** Edit one consultant's pay and TDS for the selected month (stays Pending until marked Paid). */
export default function ConsultancyPaymentModal({
  employee,
  payment,
  month,
  year,
  periodLabel,
  onClose,
  onSaved,
}: {
  employee: EmployeeListItem | null;
  payment?: ConsultancyPayment;
  month: number;
  year: number;
  periodLabel: string;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [amount, setAmount] = useState("");
  const [tds, setTds] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!employee) return;
    setAmount(String(payment?.amount ?? employee.monthlyConsultancyPay ?? ""));
    setTds(String(payment?.tdsPercent ?? employee.tdsPercent ?? ""));
    setError(null);
  }, [employee, payment]);

  if (!employee) return null;
  const gross = Math.max(0, Number(amount) || 0);
  const pct = Math.min(100, Math.max(0, Number(tds) || 0));
  const tdsAmt = Math.round((gross * pct) / 100);

  const submit = async () => {
    if (!(gross > 0)) return setError("Amount must be greater than ₹0");
    setBusy(true);
    setError(null);
    try {
      await saveConsultancyPayment({
        employeeId: employee._id,
        month,
        year,
        amount: gross,
        tdsPercent: pct,
        status: "Pending",
      });
      onSaved();
      onClose();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Unable to save the payment");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal
      open
      title={`Edit Payment - ${periodLabel}`}
      onClose={() => {
        if (!busy) onClose();
      }}
      footer={
        <>
          <Button type="button" variant="secondary" disabled={busy} onClick={onClose}>
            Cancel
          </Button>
          <Button type="button" disabled={busy} onClick={() => void submit()}>
            {busy ? "Saving…" : "Save Payment"}
          </Button>
        </>
      }
    >
      <div className="-mt-2 flex flex-col gap-wz-6">
        <EmployeeModalCard employee={employee} />
        <div className="grid grid-cols-1 gap-wz-6 sm:grid-cols-2">
          <Field label="Monthly Consultancy Pay" required htmlFor="pay-amount">
            <Input id="pay-amount" type="number" min={0} placeholder="Enter amount" value={amount} onChange={(e) => setAmount(e.target.value)} />
          </Field>
          <Field label="TDS %" htmlFor="pay-tds">
            <Input id="pay-tds" type="number" min={0} max={100} placeholder="Enter here" value={tds} onChange={(e) => setTds(e.target.value)} />
          </Field>
        </div>
        <div className="flex min-h-[50px] items-center justify-between gap-4 rounded-wz-md border border-wz-border bg-wz-neutral-50 px-4">
          <span className="text-xs leading-[15px] font-semibold text-wz-text-muted uppercase">
            Gross: {rupees(gross)}
            <span className="mx-2">|</span>
            TDS({pct}%): -{rupees(tdsAmt)}
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
