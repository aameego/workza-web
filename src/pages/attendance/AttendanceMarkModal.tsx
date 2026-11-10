import { useEffect, useState, type FormEvent } from "react";
import { Button, Field, Input, Modal, Select } from "../../design-system";
import { useMarkAttendance } from "../../hooks/useAttendance";
import { ApiError } from "../../lib/apiClient";
import {
  formatTimeForApi,
  toLocalDateString,
} from "../../services/attendanceService";
import { ATTENDANCE_STATUSES } from "./attendanceEditHelpers";
import SearchableEmployeeSelect from "./SearchableEmployeeSelect";

export type AttendanceMarkModalProps = {
  open: boolean;
  onClose: () => void;
  defaultDate?: string;
};

type MarkForm = {
  employeeId: string;
  status: string;
  checkIn: string;
  checkOut: string;
  notes: string;
  date: string;
};

const emptyForm = (date: string): MarkForm => ({
  employeeId: "",
  status: "Present",
  checkIn: "",
  checkOut: "",
  notes: "",
  date,
});

export default function AttendanceMarkModal({
  open,
  onClose,
  defaultDate,
}: AttendanceMarkModalProps) {
  const today = defaultDate || toLocalDateString();
  const [form, setForm] = useState<MarkForm>(() => emptyForm(today));
  const [error, setError] = useState<string | null>(null);
  const markMutation = useMarkAttendance();

  useEffect(() => {
    if (!open) return;
    setForm(emptyForm(today));
    setError(null);
  }, [open, today]);

  const setField = <K extends keyof MarkForm>(key: K, value: MarkForm[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setError(null);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!form.employeeId) {
      setError("Please select an employee.");
      return;
    }
    if (form.checkIn && form.checkOut) {
      const toMin = (t: string) => {
        const [h, m] = t.split(":").map(Number);
        return (h || 0) * 60 + (m || 0);
      };
      if (toMin(form.checkOut) <= toMin(form.checkIn)) {
        setError("Check-out time must be later than check-in time.");
        return;
      }
    }

    try {
      await markMutation.mutateAsync({
        employeeId: form.employeeId,
        status: form.status,
        notes: form.notes,
        date: form.date || today,
        checkIn: form.checkIn ? formatTimeForApi(form.checkIn) : "",
        checkOut: form.checkOut ? formatTimeForApi(form.checkOut) : "",
      });
      onClose();
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : "Unable to save attendance. Please try again.",
      );
    }
  };

  return (
    <Modal
      open={open}
      title="Mark Attendance"
      onClose={() => {
        if (markMutation.isPending) return;
        onClose();
      }}
      footer={
        <>
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
            disabled={markMutation.isPending}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            form="attendance-mark-form"
            variant="primary"
            disabled={markMutation.isPending}
          >
            {markMutation.isPending ? "Saving…" : "Save"}
          </Button>
        </>
      }
    >
      <form
        id="attendance-mark-form"
        className="space-y-wz-4"
        onSubmit={(e) => void handleSubmit(e)}
      >
        {error ? (
          <p className="m-0 text-sm text-wz-error" role="alert">
            {error}
          </p>
        ) : null}

        <Field label="Employee" required>
          <SearchableEmployeeSelect
            value={form.employeeId}
            onChange={(id) => setField("employeeId", id)}
            disabled={markMutation.isPending}
            hasError={Boolean(error && !form.employeeId)}
          />
        </Field>

        <Field label="Date" required>
          <Input
            type="date"
            value={form.date}
            onChange={(e) => setField("date", e.target.value)}
            required
          />
        </Field>

        <Field label="Status" required>
          <Select
            value={form.status}
            onChange={(e) => setField("status", e.target.value)}
          >
            {ATTENDANCE_STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </Select>
        </Field>

        <div className="grid grid-cols-1 gap-wz-4 sm:grid-cols-2">
          <Field label="Check In">
            <Input
              type="time"
              value={form.checkIn}
              onChange={(e) => setField("checkIn", e.target.value)}
            />
          </Field>
          <Field label="Check Out">
            <Input
              type="time"
              value={form.checkOut}
              onChange={(e) => setField("checkOut", e.target.value)}
            />
          </Field>
        </div>

        <Field label="Notes">
          <Input
            value={form.notes}
            onChange={(e) => setField("notes", e.target.value)}
            placeholder="Optional notes"
            maxLength={500}
          />
        </Field>
      </form>
    </Modal>
  );
}
