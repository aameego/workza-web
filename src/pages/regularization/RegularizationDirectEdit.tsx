import { useState } from "react";
import {
  Button,
  ConfirmDialog,
  Field,
  Input,
  Select,
  TextArea,
  showSuccessToast,
} from "../../design-system";
import { ApiError } from "../../lib/apiClient";
import { useDirectEditAttendance } from "../../hooks/useAttendance";
import { useDirectEditLeave, useLeaveRequests, useLeaveTypeOptions } from "../../hooks/useLeave";
import { useInvalidateRegularization } from "../../hooks/useRegularization";
import SearchableEmployeeSelect from "../attendance/SearchableEmployeeSelect";
import {
  ATTENDANCE_STATUSES,
  stripsTimesForStatus,
  validateDirectEditAttendance,
} from "../attendance/attendanceEditHelpers";
import { getLeaveTypeLabel, toDateInputValue } from "../leave/leaveViewModel";
import type { LeaveRequest } from "../../services/leaveService";
import { RegPanel } from "./RegularizationRequests";
import { formatRegDate } from "./regularizationViewModel";

const NOTE_MAX = 500;
const todayIso = () => toDateInputValue(new Date().toISOString());

/** Figma 288:158177 / 288:158225: Attendance | Leave as two 44px buttons, filled when active. */
export function RegularizationDirectEdit() {
  const [mode, setMode] = useState<"attendance" | "leave">("attendance");
  return (
    <RegPanel title="Edit an employee record" sub="Changes apply immediately and the audit note is saved with the correction.">
      <div role="radiogroup" aria-label="Record type" className="grid grid-cols-2 gap-3">
        {(["attendance", "leave"] as const).map((m) => (
          <Button
            key={m}
            role="radio"
            aria-checked={mode === m}
            size="lg"
            variant={mode === m ? "primary" : "secondary"}
            onClick={() => setMode(m)}
          >
            {m === "attendance" ? "Attendance" : "Leave"}
          </Button>
        ))}
      </div>
      {/* Keyed so switching type starts a clean form. */}
      {mode === "attendance" ? <AttendanceForm key="a" /> : <LeaveForm key="l" />}
    </RegPanel>
  );
}

function AuditNote({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <Field label="Audit note" required hint={`${value.length}/${NOTE_MAX} characters · Stored in the audit trail`} htmlFor="reg-audit-note">
      <TextArea id="reg-audit-note"
        rows={4}
        maxLength={NOTE_MAX}
        value={value}
        placeholder="Explain why this direct correction is required"
        onChange={(e) => onChange(e.target.value)}
      />
    </Field>
  );
}

function SubmitRow({ error, onReview }: { error: string; onReview: () => void }) {
  return (
    <div className="flex flex-col items-start gap-3">
      {error ? (
        <p className="m-0 text-sm text-wz-error" role="alert">
          {error}
        </p>
      ) : null}
      <p className="m-0 text-[11px] leading-[17px] text-wz-text-secondary">This change applies immediately after confirmation.</p>
      <Button size="lg" className="max-md:w-full" onClick={onReview}>
        Review change
      </Button>
    </div>
  );
}

const apiMessage = (err: unknown, fallback: string) => (err instanceof ApiError ? err.message : fallback);

function AttendanceForm() {
  const [employeeId, setEmployeeId] = useState("");
  const [date, setDate] = useState("");
  const [status, setStatus] = useState("Present");
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [auditNote, setAuditNote] = useState("");
  const [error, setError] = useState("");
  const [confirming, setConfirming] = useState(false);
  const mutation = useDirectEditAttendance();
  const invalidate = useInvalidateRegularization();
  const noTimes = stripsTimesForStatus(status);

  const review = () => {
    const message = !employeeId
      ? "Select an employee."
      : !date
        ? "Select the attendance date."
        : validateDirectEditAttendance({ employeeId, date, status, checkIn, checkOut, auditNote });
    setError(message);
    if (!message) setConfirming(true);
  };

  const save = async () => {
    try {
      await mutation.mutateAsync({
        employeeId,
        date,
        status,
        checkIn: noTimes ? null : checkIn,
        checkOut: noTimes ? null : checkOut,
        auditNote: auditNote.trim(),
      });
      invalidate();
      showSuccessToast("Attendance record updated");
      setConfirming(false);
      setDate("");
      setCheckIn("");
      setCheckOut("");
      setAuditNote("");
    } catch (err) {
      setConfirming(false);
      setError(apiMessage(err, "Could not update the attendance record."));
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <Field label="Employee" required>
        <SearchableEmployeeSelect value={employeeId} onChange={setEmployeeId} placeholder="Search employee by name or code" />
      </Field>
      <div className="grid grid-cols-2 gap-4 max-md:grid-cols-1">
        <Field label="Attendance date" required htmlFor="reg-att-date">
          <Input id="reg-att-date" type="date" max={todayIso()} value={date} onChange={(e) => setDate(e.target.value)} />
        </Field>
        <Field label="Status" required htmlFor="reg-att-status">
          <Select id="reg-att-status" value={status} onChange={(e) => setStatus(e.target.value)}>
            {ATTENDANCE_STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Check-in" required={!noTimes} htmlFor="reg-att-in">
          <Input id="reg-att-in" type="time" disabled={noTimes} value={noTimes ? "" : checkIn} onChange={(e) => setCheckIn(e.target.value)} />
        </Field>
        <Field label="Check-out" required={!noTimes} htmlFor="reg-att-out">
          <Input id="reg-att-out" type="time" disabled={noTimes} value={noTimes ? "" : checkOut} onChange={(e) => setCheckOut(e.target.value)} />
        </Field>
      </div>
      <AuditNote value={auditNote} onChange={setAuditNote} />
      <SubmitRow error={error} onReview={review} />
      <ConfirmDialog
        open={confirming}
        title="Apply this correction?"
        message={`${status}${noTimes ? "" : ` · ${checkIn} / ${checkOut}`} on ${formatRegDate(date)}. The change applies immediately.`}
        confirmLabel="Apply"
        loading={mutation.isPending}
        onConfirm={() => void save()}
        onClose={() => setConfirming(false)}
      />
    </div>
  );
}

const leaveOptionLabel = (r: LeaveRequest) => {
  const range = r.startDate === r.endDate ? formatRegDate(r.startDate) : `${formatRegDate(r.startDate)} – ${formatRegDate(r.endDate)}`;
  return `${getLeaveTypeLabel(r.leaveType)} · ${range} · ${r.status || ""}`;
};

function LeaveForm() {
  const [employeeId, setEmployeeId] = useState("");
  const [requestId, setRequestId] = useState("");
  const [leaveType, setLeaveType] = useState("");
  const [reason, setReason] = useState("");
  const [auditNote, setAuditNote] = useState("");
  const [error, setError] = useState("");
  const [confirming, setConfirming] = useState(false);
  const typeOptions = useLeaveTypeOptions();
  const requests = useLeaveRequests({ employeeId, limit: 50 }, Boolean(employeeId));
  const mutation = useDirectEditLeave();
  const invalidate = useInvalidateRegularization();
  const editable = (requests.data?.requests || []).filter((r) => r.status === "Pending" || r.status === "Approved");
  const selected = editable.find((r) => r._id === requestId) || null;
  const isWfh = leaveType === "WFH";

  const pickEmployee = (id: string) => {
    setEmployeeId(id);
    setRequestId("");
    setLeaveType("");
    setReason("");
  };

  const pickRequest = (id: string) => {
    const r = editable.find((x) => x._id === id);
    setRequestId(id);
    setLeaveType(String(r?.leaveType || ""));
    setReason(r?.reason || "");
  };

  const review = () => {
    const message = !employeeId
      ? "Select an employee."
      : !selected
        ? "Select the leave request to correct."
        : !leaveType
          ? "Select a leave type."
          : reason.trim().length < 3
            ? "Please provide a leave reason (at least 3 characters)."
            : auditNote.trim().length < 3
              ? "Please enter an audit note (at least 3 characters)."
              : "";
    setError(message);
    if (!message) setConfirming(true);
  };

  const save = async () => {
    if (!selected) return;
    try {
      await mutation.mutateAsync({
        leaveRequestId: selected._id,
        payload: {
          leaveType,
          requestType: isWfh ? "WFH" : "Leave",
          // Dates stay locked to the original request (Figma copy).
          startDate: toDateInputValue(selected.startDate),
          endDate: toDateInputValue(selected.endDate),
          dayPart: selected.dayPart || "full",
          reason: reason.trim(),
          auditNote: auditNote.trim(),
        },
      });
      invalidate();
      showSuccessToast("Leave record updated");
      setConfirming(false);
      setAuditNote("");
    } catch (err) {
      setConfirming(false);
      setError(apiMessage(err, "Could not update the leave record."));
    }
  };

  const dates = selected
    ? selected.startDate === selected.endDate
      ? formatRegDate(selected.startDate)
      : `${formatRegDate(selected.startDate)} – ${formatRegDate(selected.endDate)}`
    : "";

  return (
    <div className="flex flex-col gap-4">
      <Field label="Employee" required>
        <SearchableEmployeeSelect value={employeeId} onChange={pickEmployee} placeholder="Search employee by name or code" />
      </Field>
      <Field label="Leave request" required htmlFor="reg-leave-request">
        <Select id="reg-leave-request" value={requestId} disabled={!employeeId || requests.isLoading} onChange={(e) => pickRequest(e.target.value)}>
          <option value="" disabled>
            {!employeeId
              ? "Select an employee first"
              : requests.isLoading
                ? "Loading leave requests…"
                : editable.length
                  ? "Select a leave request"
                  : "No pending or approved leave requests"}
          </option>
          {editable.map((r) => (
            <option key={r._id} value={r._id}>
              {leaveOptionLabel(r)}
            </option>
          ))}
        </Select>
      </Field>
      <div className="grid grid-cols-2 gap-4 max-md:grid-cols-1">
        <Field label="Leave type" required htmlFor="reg-leave-type">
          <Select id="reg-leave-type" value={leaveType} disabled={!selected} onChange={(e) => setLeaveType(e.target.value)}>
            <option value="" disabled>
              Select
            </option>
            {typeOptions.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Request mode" htmlFor="reg-leave-mode">
          <Input id="reg-leave-mode" readOnly value={selected ? (isWfh ? "WFH" : "Leave") : ""} placeholder="Leave" />
        </Field>
      </div>
      <Field label="Leave dates (locked to original request)" hint="Dates cannot be changed in a direct correction — they stay within the applied leave." htmlFor="reg-leave-dates">
        <Input id="reg-leave-dates" readOnly value={dates} placeholder="Select a leave request to load its dates" />
      </Field>
      <Field label="Leave reason" required htmlFor="reg-leave-reason">
        <TextArea id="reg-leave-reason"
          rows={3}
          maxLength={NOTE_MAX}
          disabled={!selected}
          value={reason}
          placeholder="Enter leave reason"
          onChange={(e) => setReason(e.target.value)}
        />
      </Field>
      <AuditNote value={auditNote} onChange={setAuditNote} />
      <SubmitRow error={error} onReview={review} />
      <ConfirmDialog
        open={confirming}
        title="Apply this correction?"
        message={`${getLeaveTypeLabel(leaveType)} for ${dates}. The change applies immediately.`}
        confirmLabel="Apply"
        loading={mutation.isPending}
        onConfirm={() => void save()}
        onClose={() => setConfirming(false)}
      />
    </div>
  );
}
