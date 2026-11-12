import { useEffect, useState, type FormEvent } from "react";
import { Button, Field, Input, Modal, SegmentedToggle, Select, TextArea } from "../../design-system";
import { useMarkAttendance, useMarkMonthAttendance } from "../../hooks/useAttendance";
import { ApiError } from "../../lib/apiClient";
import {
  formatTimeForApi,
  toLocalDateString,
} from "../../services/attendanceService";
import { ATTENDANCE_STATUSES } from "./attendanceEditHelpers";
import { MONTH_NAMES } from "./attendanceMonthOptions";
import SearchableEmployeeSelect from "./SearchableEmployeeSelect";

export type AttendanceMarkModalProps = {
  open: boolean;
  onClose: () => void;
  defaultDate?: string;
};

type Mode = "day" | "month";

const toMin = (t: string) => {
  const [h, m] = t.split(":").map(Number);
  return (h || 0) * 60 + (m || 0);
};

/**
 * Figma Mark Attendance (day level / month level toggle). Month level posts
 * the backend's monthly totals (/attendance/markMonth), so its fields are
 * month + working days rather than Figma's default check-in/out.
 * ponytail: no break config exists, so paid hours = check-out − check-in.
 */
export default function AttendanceMarkModal({
  open,
  onClose,
  defaultDate,
}: AttendanceMarkModalProps) {
  const today = defaultDate || toLocalDateString();
  const now = new Date();
  const [mode, setMode] = useState<Mode>("day");
  const [employeeId, setEmployeeId] = useState("");
  const [date, setDate] = useState(today);
  const [status, setStatus] = useState("");
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [monthValue, setMonthValue] = useState("");
  const [workingDays, setWorkingDays] = useState("");
  const [incentiveDays, setIncentiveDays] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);
  const dayMutation = useMarkAttendance();
  const monthMutation = useMarkMonthAttendance();
  const pending = dayMutation.isPending || monthMutation.isPending;

  useEffect(() => {
    if (!open) return;
    setMode("day");
    setEmployeeId("");
    setDate(today);
    setStatus("");
    setCheckIn("");
    setCheckOut("");
    setMonthValue(`${now.getFullYear()}-${now.getMonth() + 1}`);
    setWorkingDays("");
    setIncentiveDays("");
    setNotes("");
    setError(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, today]);

  const paid =
    checkIn && checkOut && toMin(checkOut) > toMin(checkIn)
      ? toMin(checkOut) - toMin(checkIn)
      : 0;

  // Current month and the 12 before it, newest first.
  const months = Array.from({ length: 13 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    return {
      value: `${d.getFullYear()}-${d.getMonth() + 1}`,
      label: `${MONTH_NAMES[d.getMonth()]} ${d.getFullYear()}`,
    };
  });

  const fail = (err: unknown) =>
    setError(
      err instanceof ApiError ? err.message : "Unable to save attendance. Please try again.",
    );

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!employeeId) return setError("Please select an employee.");
    if (mode === "day") {
      if (!status) return setError("Please select an attendance status.");
      if (checkIn && checkOut && toMin(checkOut) <= toMin(checkIn)) {
        return setError("Check-out time must be later than check-in time.");
      }
      try {
        await dayMutation.mutateAsync({
          employeeId,
          status,
          notes,
          date: date || today,
          checkIn: checkIn ? formatTimeForApi(checkIn) : "",
          checkOut: checkOut ? formatTimeForApi(checkOut) : "",
        });
        onClose();
      } catch (err) {
        fail(err);
      }
      return;
    }
    if (!workingDays.trim()) return setError("Total Working Days is required.");
    const [y, m] = monthValue.split("-").map(Number);
    try {
      await monthMutation.mutateAsync({
        employeeId,
        month: MONTH_NAMES[(m || 1) - 1]!,
        year: y || now.getFullYear(),
        totalWorkingDays: workingDays.trim(),
        incentiveDays: incentiveDays.trim() || "0",
        notes: notes.trim(),
      });
      onClose();
    } catch (err) {
      fail(err);
    }
  };

  return (
    <Modal
      open={open}
      title="Mark Attendance"
      onClose={() => {
        if (!pending) onClose();
      }}
      footer={
        <>
          <Button type="button" variant="secondary" onClick={onClose} disabled={pending}>
            Cancel
          </Button>
          <Button type="submit" form="attendance-mark-form" disabled={pending}>
            {pending ? "Saving…" : "Mark Attendance"}
          </Button>
        </>
      }
    >
      <form
        id="attendance-mark-form"
        className="grid grid-cols-1 gap-x-wz-6 gap-y-wz-6 sm:grid-cols-2"
        onSubmit={(e) => void handleSubmit(e)}
      >
        <Field label="Employee/ Consultant Name" required>
          <SearchableEmployeeSelect
            value={employeeId}
            onChange={(id) => {
              setEmployeeId(id);
              setError(null);
            }}
            disabled={pending}
            hasError={Boolean(error && !employeeId)}
          />
        </Field>

        <SegmentedToggle
          label="Select Mark Attendance Type"
          value={mode}
          options={[
            ["day", "Day level"],
            ["month", "Month level"],
          ]}
          onChange={(v) => {
            setMode(v);
            setError(null);
          }}
        />

        {mode === "day" ? (
          <>
            <Field label="Attendance Date" required>
              <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
            </Field>
            <Field label="Attendance Status" required>
              <Select value={status} onChange={(e) => setStatus(e.target.value)}>
                <option value="" disabled>
                  Select Status
                </option>
                {ATTENDANCE_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Check In" required>
              <Input type="time" value={checkIn} onChange={(e) => setCheckIn(e.target.value)} />
            </Field>
            <Field label="Check Out" required>
              <Input type="time" value={checkOut} onChange={(e) => setCheckOut(e.target.value)} />
            </Field>
            <p className="m-0 -mt-4 flex min-h-7 items-center justify-between gap-3 rounded-wz-sm bg-[#eef8f6] px-3 text-[11px] text-wz-text-muted sm:col-span-2">
              <span>Calculated duration between check-in and check-out.</span>
              <span className="font-semibold whitespace-nowrap text-[#0f766e]">
                Paid hours: {Math.floor(paid / 60)}h {String(paid % 60).padStart(2, "0")}m
              </span>
            </p>
          </>
        ) : (
          <>
            <Field label="Attendance Month" required>
              <Select value={monthValue} onChange={(e) => setMonthValue(e.target.value)}>
                {months.map((m) => (
                  <option key={m.value} value={m.value}>
                    {m.label}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Total Working Days" required>
              <Input
                type="number"
                step="0.5"
                min={0}
                max={31}
                placeholder="e.g., 26"
                value={workingDays}
                onChange={(e) => setWorkingDays(e.target.value)}
              />
            </Field>
            <Field label="Incentive Days">
              <Input
                type="number"
                step="0.5"
                min={0}
                max={31}
                placeholder="0"
                value={incentiveDays}
                onChange={(e) => setIncentiveDays(e.target.value)}
              />
            </Field>
            <div className="hidden sm:block" />
            <p className="m-0 -mt-4 flex min-h-7 items-center rounded-wz-sm bg-[#fff7e8] px-3 text-[11px] text-[#93370d] sm:col-span-2">
              An existing monthly record for this month is replaced. Months that already have daily attendance can't be marked here.
            </p>
          </>
        )}

        <Field label="Notes / correction reason" className="mt-2 sm:col-span-2">
          <TextArea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Add a note for this attendance record"
            maxLength={500}
          />
        </Field>

        {error ? (
          <p className="m-0 text-sm text-wz-error sm:col-span-2" role="alert">
            {error}
          </p>
        ) : null}
      </form>
    </Modal>
  );
}
