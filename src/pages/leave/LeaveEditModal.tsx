import { useEffect, useState } from "react";
import {
  Button,
  Field,
  Input,
  Modal,
  Select,
  TextArea,
} from "../../design-system";
import { ApiError } from "../../lib/apiClient";
import { useDirectEditLeave } from "../../hooks/useLeave";
import type { LeaveRequest } from "../../services/leaveService";
import {
  LEAVE_TYPE_OPTIONS,
  employeeFromRequest,
  toDateInputValue,
  validateLeaveRequestForm,
} from "./leaveViewModel";

export type LeaveEditModalProps = {
  open: boolean;
  record: LeaveRequest | null;
  onClose: () => void;
};

export default function LeaveEditModal({
  open,
  record,
  onClose,
}: LeaveEditModalProps) {
  const [leaveType, setLeaveType] = useState("CL");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [dayPart, setDayPart] = useState("full");
  const [reason, setReason] = useState("");
  const [auditNote, setAuditNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const editMutation = useDirectEditLeave();

  useEffect(() => {
    if (!open || !record) return;
    setLeaveType(String(record.leaveType || "CL"));
    setStartDate(toDateInputValue(record.startDate));
    setEndDate(toDateInputValue(record.endDate));
    setDayPart(String(record.dayPart || "full"));
    setReason(record.reason || "");
    setAuditNote("");
    setError(null);
  }, [open, record]);

  if (!record) return null;

  const emp = employeeFromRequest(record);
  const isSingleDay = Boolean(startDate && endDate && startDate === endDate);
  const saving = editMutation.isPending;

  const handleSave = async () => {
    const validation = validateLeaveRequestForm({
      leaveType,
      startDate,
      endDate,
      dayPart: isSingleDay ? dayPart : "full",
      reason,
    });
    if (validation) {
      setError(validation);
      return;
    }
    if (!auditNote.trim() || auditNote.trim().length < 3) {
      setError("Please enter an audit note (at least 3 characters).");
      return;
    }
    setError(null);
    try {
      await editMutation.mutateAsync({
        leaveRequestId: record._id,
        payload: {
          leaveType,
          requestType: leaveType === "WFH" ? "WFH" : "Leave",
          startDate,
          endDate,
          reason: reason.trim(),
          auditNote: auditNote.trim(),
          dayPart: isSingleDay ? dayPart : "full",
        },
      });
      onClose();
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : "Failed to update leave request.",
      );
    }
  };

  return (
    <Modal
      open={open}
      title={`Edit leave · ${emp.name}`}
      onClose={saving ? () => undefined : onClose}
      size="lg"
      footer={
        <>
          <Button
            type="button"
            variant="secondary"
            disabled={saving}
            onClick={onClose}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="primary"
            disabled={saving}
            onClick={() => void handleSave()}
          >
            {saving ? "Saving…" : "Save changes"}
          </Button>
        </>
      }
    >
      <div className="grid grid-cols-1 gap-wz-4 sm:grid-cols-2">
        <Field label="Leave type">
          <Select
            value={leaveType}
            onChange={(e) => setLeaveType(e.target.value)}
          >
            {LEAVE_TYPE_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </Select>
        </Field>
        <div />
        <Field label="Start date *">
          <Input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
        </Field>
        <Field label="End date *">
          <Input
            type="date"
            value={endDate}
            min={startDate || undefined}
            onChange={(e) => setEndDate(e.target.value)}
          />
        </Field>
        {isSingleDay ? (
          <Field label="Day type">
            <Select
              value={dayPart}
              onChange={(e) => setDayPart(e.target.value)}
            >
              <option value="full">Full Day</option>
              <option value="first-half">First Half</option>
              <option value="second-half">Second Half</option>
            </Select>
          </Field>
        ) : null}
        <Field label="Reason *" className="sm:col-span-2">
          <TextArea
            rows={3}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          />
        </Field>
        <Field label="Audit note *" className="sm:col-span-2">
          <TextArea
            rows={2}
            value={auditNote}
            placeholder="Why is this leave being edited?"
            onChange={(e) => setAuditNote(e.target.value)}
          />
        </Field>
        {error ? (
          <p className="m-0 sm:col-span-2 text-sm text-wz-error" role="alert">
            {error}
          </p>
        ) : null}
      </div>
    </Modal>
  );
}
