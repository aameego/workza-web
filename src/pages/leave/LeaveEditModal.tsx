import { useEffect, useState } from "react";
import {
  Button,
  Field,
  Input,
  Modal,
  SegmentedToggle,
  Select,
  TextArea,
} from "../../design-system";
import { ApiError } from "../../lib/apiClient";
import { useDirectEditLeave } from "../../hooks/useLeave";
import { useEmployee } from "../../hooks/useEmployees";
import { EmployeeModalCard } from "../employees/EmployeeActionModals";
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
  const recordEmpId = record ? employeeFromRequest(record).id : "";
  const { data: employeeDetail } = useEmployee(recordEmpId || undefined, open && Boolean(recordEmpId));

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
      title="Edit Request"
      onClose={saving ? () => undefined : onClose}
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
            {saving ? "Saving…" : "Update Request"}
          </Button>
        </>
      }
    >
      <div className="grid grid-cols-1 gap-x-wz-6 gap-y-wz-6 sm:grid-cols-2">
        <div className="self-center">
          <EmployeeModalCard
            employee={{
              _id: emp.id,
              isActive: true,
              ...employeeDetail,
              name: employeeDetail?.name || emp.name,
              employeeCode: employeeDetail?.employeeCode || emp.employeeCode,
            }}
            detailed={false}
          />
        </div>
        <SegmentedToggle
          label="Select Request Type"
          value={leaveType === "WFH" ? "WFH" : "Leave"}
          options={[
            ["Leave", "Leave"],
            ["WFH", "WFH"],
          ]}
          onChange={(next) => setLeaveType(next === "WFH" ? "WFH" : "")}
        />
        <Field label="Leave Type" required>
          <Select
            value={leaveType}
            disabled={leaveType === "WFH"}
            onChange={(e) => setLeaveType(e.target.value)}
          >
            <option value="" disabled>
              Select
            </option>
            {LEAVE_TYPE_OPTIONS.filter((o) =>
              leaveType === "WFH" ? o.value === "WFH" : o.value !== "WFH",
            ).map((o) => (
              <option key={o.value} value={o.value}>
                {o.value === "WFH" ? "Work From Home (WFH)" : o.label}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Day Type" required>
          <Select value={dayPart} onChange={(e) => setDayPart(e.target.value)}>
            <option value="full">Full Day</option>
            <option value="first-half" disabled={!isSingleDay}>
              First Half
            </option>
            <option value="second-half" disabled={!isSingleDay}>
              Second Half
            </option>
          </Select>
        </Field>
        <Field label="Start Date" required>
          <Input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
        </Field>
        <Field label="End Date" required>
          <Input
            type="date"
            value={endDate}
            min={startDate || undefined}
            onChange={(e) => setEndDate(e.target.value)}
          />
        </Field>
        <Field label="Reason" required className="sm:col-span-2">
          <TextArea
            rows={2}
            style={{ minHeight: 70 }}
            value={reason}
            placeholder="Enter reason here"
            onChange={(e) => setReason(e.target.value)}
          />
        </Field>
        <Field label="Audit Note" required className="sm:col-span-2">
          <TextArea
            rows={2}
            style={{ minHeight: 70 }}
            value={auditNote}
            placeholder="Enter here"
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
