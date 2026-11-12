import { useEffect, useState, type FormEvent } from "react";
import { Button, Field, Input, Modal, Select, TextArea } from "../../design-system";
import { useDirectEditAttendance } from "../../hooks/useAttendance";
import { useEmployee } from "../../hooks/useEmployees";
import { EmployeeModalCard } from "../employees/EmployeeActionModals";
import { managerDisplayName } from "../employees/employeeViewFormat";
import { ApiError } from "../../lib/apiClient";
import type { NormalizedAttendanceRow } from "./attendanceViewModel";
import { formatDayLabel } from "./attendanceHistory";
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
  const recordEmployeeId = record ? employeeIdFromRow(record) : undefined;
  const { data: employeeDetail } = useEmployee(recordEmployeeId, open && Boolean(recordEmployeeId));

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
  const employee = employeeDetail;
  const manager = employee ? managerDisplayName(employee.managerId).replace("—", "-") : "-";
  const dateLabel = date
    ? formatDayLabel(new Date(`${date}T00:00:00`))
    : "-";

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
      title="Edit Attendance"
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
            {editMutation.isPending ? "Saving…" : "Update Attendance"}
          </Button>
        </>
      }
    >
      <form
        id="attendance-edit-form"
        className="-mt-2 grid grid-cols-1 gap-x-wz-6 gap-y-wz-6 sm:grid-cols-2"
        onSubmit={(e) => void handleSave(e)}
      >
        <p className="m-0 text-xs leading-[15px] font-semibold text-wz-text-muted sm:col-span-2">
          Attendance Date: {dateLabel}
        </p>

        <div className="sm:col-span-2">
          <EmployeeModalCard
            employee={{
              _id: employeeId,
              isActive: true,
              ...employee,
              name: employee?.name || record.name,
              employeeCode: employee?.employeeCode || record.employeeCode,
            }}
            detailed={false}
            aside={
              <>
                <p className="m-0 text-[13px] leading-4 font-semibold tracking-[0.04em] text-wz-text-muted uppercase">
                  Reporting Manager
                </p>
                <p className="m-0 mt-1 text-sm leading-[18px] font-bold text-wz-heading">
                  {manager}
                </p>
              </>
            }
          />
        </div>

        <Field
          label="Modify Attendance Status"
          required
          className="sm:col-span-2"
        >
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

        <Field label="Check In" required={!stripsTimes}>
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
        <Field label="Check Out" required={!stripsTimes}>
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

        <Field label="Note" required className="sm:col-span-2">
          <TextArea
            rows={2}
            style={{ minHeight: 66 }}
            value={auditNote}
            onChange={(e) => {
              setAuditNote(e.target.value);
              setError(null);
            }}
            placeholder="Enter here"
            disabled={editMutation.isPending}
            required
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
