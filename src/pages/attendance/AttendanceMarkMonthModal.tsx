import { useEffect, useState, type FormEvent } from "react";
import { Button, Field, Input, Modal, Select } from "../../design-system";
import { useMarkMonthAttendance } from "../../hooks/useAttendance";
import { ApiError } from "../../lib/apiClient";
import SearchableEmployeeSelect from "./SearchableEmployeeSelect";
import { MONTH_NAMES } from "./attendanceMonthOptions";

export type AttendanceMarkMonthModalProps = {
  open: boolean;
  onClose: () => void;
  defaultMonth?: number;
  defaultYear?: number;
};

export default function AttendanceMarkMonthModal({
  open,
  onClose,
  defaultMonth,
  defaultYear,
}: AttendanceMarkMonthModalProps) {
  const now = new Date();
  const [employeeId, setEmployeeId] = useState("");
  const [month, setMonth] = useState(
    MONTH_NAMES[(defaultMonth ?? now.getMonth() + 1) - 1] || "January",
  );
  const [year, setYear] = useState(defaultYear ?? now.getFullYear());
  const [totalWorkingDays, setTotalWorkingDays] = useState("");
  const [incentiveDays, setIncentiveDays] = useState("0");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const mutation = useMarkMonthAttendance();

  useEffect(() => {
    if (!open) return;
    setEmployeeId("");
    setMonth(MONTH_NAMES[(defaultMonth ?? now.getMonth() + 1) - 1] || "January");
    setYear(defaultYear ?? now.getFullYear());
    setTotalWorkingDays("");
    setIncentiveDays("0");
    setNotes("");
    setError(null);
    setSuccess(null);
  }, [open, defaultMonth, defaultYear]);

  const availableMonths =
    year === now.getFullYear()
      ? MONTH_NAMES.slice(0, now.getMonth() + 1)
      : MONTH_NAMES;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!employeeId) {
      setError("Please select an employee.");
      return;
    }
    if (!totalWorkingDays.trim()) {
      setError("Total Working Days is required.");
      return;
    }
    setError(null);
    setSuccess(null);
    try {
      const result = await mutation.mutateAsync({
        employeeId,
        month,
        year,
        totalWorkingDays: totalWorkingDays.trim(),
        incentiveDays: incentiveDays.trim() || "0",
        notes: notes.trim(),
      });
      setSuccess(
        result.message ||
          "Monthly attendance saved successfully.",
      );
      setTotalWorkingDays("");
      setIncentiveDays("0");
      setNotes("");
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : "Failed to save monthly attendance.",
      );
    }
  };

  return (
    <Modal
      open={open}
      title="Mark Month Attendance"
      onClose={() => {
        if (mutation.isPending) return;
        onClose();
      }}
      footer={
        <>
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
            disabled={mutation.isPending}
          >
            Close
          </Button>
          <Button
            type="submit"
            form="attendance-mark-month-form"
            variant="primary"
            disabled={mutation.isPending}
          >
            {mutation.isPending ? "Saving…" : "Save month"}
          </Button>
        </>
      }
    >
      <form
        id="attendance-mark-month-form"
        className="space-y-wz-4"
        onSubmit={(e) => void handleSubmit(e)}
      >
        {error ? (
          <p className="m-0 text-sm text-wz-error" role="alert">
            {error}
          </p>
        ) : null}
        {success ? (
          <p className="m-0 text-sm text-wz-success" role="status">
            {success}
          </p>
        ) : null}

        <Field label="Employee" required>
          <SearchableEmployeeSelect
            value={employeeId}
            onChange={(id) => {
              setEmployeeId(id);
              setError(null);
              setSuccess(null);
            }}
            disabled={mutation.isPending}
            hasError={Boolean(error && !employeeId)}
          />
        </Field>

        <div className="grid grid-cols-1 gap-wz-4 sm:grid-cols-2">
          <Field label="Month" required>
            <Select
              value={month}
              onChange={(e) => setMonth(e.target.value)}
              disabled={mutation.isPending}
            >
              {availableMonths.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Year" required>
            <Select
              value={String(year)}
              onChange={(e) => {
                const next = Number(e.target.value);
                setYear(next);
                if (
                  next === now.getFullYear() &&
                  !MONTH_NAMES.slice(0, now.getMonth() + 1).includes(month)
                ) {
                  setMonth(MONTH_NAMES[now.getMonth()]!);
                }
              }}
              disabled={mutation.isPending}
            >
              {[now.getFullYear(), now.getFullYear() - 1].map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </Select>
          </Field>
        </div>

        <div className="grid grid-cols-1 gap-wz-4 sm:grid-cols-2">
          <Field label="Total Working Days" required>
            <Input
              type="number"
              step="0.5"
              min={0}
              max={31}
              value={totalWorkingDays}
              onChange={(e) => setTotalWorkingDays(e.target.value)}
              disabled={mutation.isPending}
              required
            />
          </Field>
          <Field label="Incentive Days">
            <Input
              type="number"
              step="0.5"
              min={0}
              max={31}
              value={incentiveDays}
              onChange={(e) => setIncentiveDays(e.target.value)}
              disabled={mutation.isPending}
            />
          </Field>
        </div>

        <Field label="Notes">
          <Input
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            maxLength={500}
            disabled={mutation.isPending}
            placeholder="Optional notes"
          />
        </Field>
      </form>
    </Modal>
  );
}
