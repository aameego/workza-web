import { useEffect, useState, type FormEvent } from "react";
import { Button, Field, Input, Modal, Select, TextArea } from "../../design-system";
import { useDirectEditAttendance } from "../../hooks/useAttendance";
import { ApiError } from "../../lib/apiClient";
import type { NormalizedAttendanceRow } from "./attendanceViewModel";
import {
  ATTENDANCE_STATUSES,
  employeeIdFromRow,
  stripsTimesForStatus,
  toDateInputValue,
  toTimeInputValue,
  validateDirectEditAttendance,
} from "./attendanceEditHelpers";

export type AttendanceEditModalProps = {
  open: boolean;
  record: NormalizedAttendanceRow | null;
  onClose: () => void;
};

export default function AttendanceEditModal({
  open,
  record,
  onClose,
}: AttendanceEditModalProps) {
  const [status, setStatus] = useState("Present");
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [auditNote, setAuditNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const editMutation = useDirectEditAttendance();

  useEffect(() => {
    if (!open || !record) return;
    setStatus(record.status || "Present");
    setCheckIn(toTimeInputValue(record.checkIn));
    setCheckOut(
      toTimeInputValue(record.isCheckedIn ? "" : record.checkOut),
    );
    setAuditNote("");
    setError(null);
  }, [open, record]);

  if (!open || !record) return null;

  const stripsTimes = stripsTimesForStatus(status);
  const employeeId = employeeIdFromRow(record);
  const date = toDateInputValue(record.date);

  const handleSave = async (e: FormEvent) => {
    e.preventDefault();
    const validationError = validateDirectEditAttendance({
      employeeId,
      date,
      status,
      checkIn: stripsTimes ? "" : checkIn,
      checkOut: stripsTimes ? "" : checkOut,
      auditNote,
    });
    if (validationError) {
      setError(validationError);
      return;
    }

    setError(null);
    try {
      await editMutation.mutateAsync({
        employeeId,
        date,
        status,
        checkIn: stripsTimes ? null : checkIn,
        checkOut: stripsTimes ? null : checkOut,
        auditNote: auditNote.trim(),
      });
      onClose();
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : "Failed to update attendance. Please try again.",
      );
    }
  };

  return (
    <Modal
      open={open}
      title={`Edit attendance — ${record.name}`}
      onClose={() => {
        if (editMutation.isPending) return;
        onClose();
      }}
      footer={
        <>
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
            disabled={editMutation.isPending}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            form="attendance-edit-form"
            variant="primary"
            disabled={editMutation.isPending}
          >
            {editMutation.isPending ? "Saving…" : "Save changes"}
          </Button>
        </>
      }
    >
      <form
        id="attendance-edit-form"
        className="space-y-wz-4"
        onSubmit={(e) => void handleSave(e)}
      >
        <p className="m-0 text-sm text-wz-text-secondary">
          {date || "—"} · {record.employeeCode}
        </p>

        {error ? (
          <p className="m-0 text-sm text-wz-error" role="alert">
            {error}
          </p>
        ) : null}

        <Field label="Status" required>
          <Select
            value={status}
            onChange={(e) => {
              setStatus(e.target.value);
              setError(null);
            }}
            disabled={editMutation.isPending}
          >
            {ATTENDANCE_STATUSES.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </Select>
        </Field>

        <div className="grid grid-cols-1 gap-wz-4 sm:grid-cols-2">
          <Field label="Check in">
            <Input
              type="time"
              value={stripsTimes ? "" : checkIn}
              onChange={(e) => {
                setCheckIn(e.target.value);
                setError(null);
              }}
              disabled={editMutation.isPending || stripsTimes}
            />
          </Field>
          <Field label="Check out">
            <Input
              type="time"
              value={stripsTimes ? "" : checkOut}
              onChange={(e) => {
                setCheckOut(e.target.value);
                setError(null);
              }}
              disabled={editMutation.isPending || stripsTimes}
            />
          </Field>
        </div>

        <Field label="Audit note" required>
          <TextArea
            rows={3}
            value={auditNote}
            onChange={(e) => {
              setAuditNote(e.target.value);
              setError(null);
            }}
            placeholder="Why is this attendance being corrected?"
            disabled={editMutation.isPending}
            required
          />
        </Field>
      </form>
    </Modal>
  );
}
