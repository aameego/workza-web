import { useEffect, useMemo, useState } from "react";
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
import {
  useCreateLeaveRequest,
  useCreateLeaveRequestMultipart,
  useLeavePolicy,
} from "../../hooks/useLeave";
import SearchableEmployeeSelect from "../attendance/SearchableEmployeeSelect";
import {
  LEAVE_TYPE_OPTIONS,
  validateLeaveRequestForm,
} from "./leaveViewModel";

export type LeaveRequestModalProps = {
  open: boolean;
  onClose: () => void;
  /** When true, hide employee select and submit for self. */
  forSelf?: boolean;
  title?: string;
};

type FormState = {
  employeeId: string;
  requestType: string;
  leaveType: string;
  startDate: string;
  endDate: string;
  dayPart: string;
  reason: string;
  coPurpose: "leave" | "credit";
};

const emptyForm = (): FormState => ({
  employeeId: "",
  requestType: "Leave",
  leaveType: "",
  startDate: "",
  endDate: "",
  dayPart: "",
  reason: "",
  coPurpose: "leave",
});

export default function LeaveRequestModal({
  open,
  onClose,
  forSelf = false,
  title,
}: LeaveRequestModalProps) {
  const [form, setForm] = useState<FormState>(emptyForm);
  const [medicalFile, setMedicalFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);

  const policyQuery = useLeavePolicy(open);
  const createMutation = useCreateLeaveRequest();
  const createMultipart = useCreateLeaveRequestMultipart();

  useEffect(() => {
    if (!open) return;
    setForm(emptyForm());
    setMedicalFile(null);
    setError(null);
  }, [open]);

  const typeOptions = useMemo(() => {
    const types = policyQuery.data?.policy?.types;
    if (!Array.isArray(types) || types.length === 0) {
      return LEAVE_TYPE_OPTIONS.map((o) => ({
        code: o.value,
        label: o.label,
      }));
    }
    return types
      .filter((t) => t.enabled !== false)
      .map((t) => ({
        code: t.code,
        label: t.label || t.code,
      }));
  }, [policyQuery.data]);

  const wfhEnabled = typeOptions.some((t) => t.code === "WFH");
  const isSingleDay =
    Boolean(form.startDate) &&
    Boolean(form.endDate) &&
    form.startDate === form.endDate;

  const daySpan = useMemo(() => {
    if (!form.startDate || !form.endDate || form.endDate < form.startDate) {
      return null;
    }
    const start = new Date(`${form.startDate}T00:00:00`);
    const end = new Date(`${form.endDate}T00:00:00`);
    const days =
      Math.round((end.getTime() - start.getTime()) / 86_400_000) + 1;
    if (
      days === 1 &&
      (form.dayPart === "first-half" || form.dayPart === "second-half")
    ) {
      return 0.5;
    }
    return days;
  }, [form.startDate, form.endDate, form.dayPart]);

  const slRequiredWhenDaysGt = useMemo(() => {
    const sl = policyQuery.data?.policy?.types?.find((t) => t.code === "SL") as
      | { documents?: { requiredWhenDaysGt?: number } }
      | undefined;
    return sl?.documents?.requiredWhenDaysGt ?? 2;
  }, [policyQuery.data]);

  const needsMedical =
    form.leaveType === "SL" &&
    daySpan != null &&
    daySpan > slRequiredWhenDaysGt;

  const saving = createMutation.isPending || createMultipart.isPending;

  const handleSubmit = async () => {
    setError(null);
    const validation = validateLeaveRequestForm({
      leaveType: form.leaveType,
      startDate: form.startDate,
      endDate: form.endDate,
      dayPart: form.dayPart,
      reason: form.reason,
      employeeId: form.employeeId,
      requireEmployee: !forSelf,
    });
    if (validation) {
      setError(validation);
      return;
    }
    if (!form.dayPart) {
      setError("Please select a day type.");
      return;
    }
    if (needsMedical && !medicalFile) {
      setError(
        `Medical document is required for SL when days exceed ${slRequiredWhenDaysGt}.`,
      );
      return;
    }

    const leaveType =
      form.requestType === "WFH" ? "WFH" : form.leaveType;
    const requestType = leaveType === "WFH" ? "WFH" : "Leave";
    const isCoCredit =
      leaveType === "CO" &&
      requestType !== "WFH" &&
      form.coPurpose === "credit";

    const payload = {
      ...(forSelf ? {} : { employeeId: form.employeeId }),
      leaveType,
      requestType,
      startDate: form.startDate,
      endDate: form.endDate,
      dayPart: isSingleDay ? form.dayPart : "full",
      reason: form.reason.trim(),
      ...(isCoCredit ? { isCoCredit: true } : {}),
    };

    try {
      if (leaveType === "SL" && medicalFile) {
        const fd = new FormData();
        Object.entries(payload).forEach(([k, v]) => {
          if (v !== undefined && v !== null) fd.append(k, String(v));
        });
        fd.append("file", medicalFile);
        await createMultipart.mutateAsync(fd);
      } else {
        await createMutation.mutateAsync(payload);
      }
      onClose();
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : "Failed to submit leave request.",
      );
    }
  };

  return (
    <Modal
      open={open}
      title={title || (forSelf ? "Submit Request" : "Create Request")}
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
            onClick={() => void handleSubmit()}
          >
            {saving ? "Submitting…" : forSelf ? "Submit Request" : "Create Request"}
          </Button>
        </>
      }
    >
      <div className="grid grid-cols-1 gap-x-wz-6 gap-y-wz-6 sm:grid-cols-2">
        {!forSelf ? (
          <Field label="Employee/ Consultant Name" required>
            <SearchableEmployeeSelect
              value={form.employeeId}
              onChange={(id) =>
                setForm((p) => ({ ...p, employeeId: id }))
              }
            />
          </Field>
        ) : null}

        <div className={forSelf ? "sm:col-span-2" : undefined}>
          <SegmentedToggle
            label="Select Request Type"
            value={form.requestType === "WFH" ? "WFH" : "Leave"}
            options={wfhEnabled ? [["Leave", "Leave"], ["WFH", "WFH"]] : [["Leave", "Leave"]]}
            onChange={(next) => {
              if (next === "WFH") {
                setForm((p) => ({ ...p, requestType: "WFH", leaveType: "WFH" }));
                setMedicalFile(null);
                return;
              }
              setForm((p) => ({
                ...p,
                requestType: "Leave",
                leaveType: p.leaveType === "WFH" ? "" : p.leaveType,
              }));
            }}
          />
        </div>

        <Field label="Leave Type" required>
          <Select
            value={form.requestType === "WFH" ? "WFH" : form.leaveType}
            disabled={form.requestType === "WFH"}
            onChange={(e) => {
              const next = e.target.value;
              setForm((p) => ({
                ...p,
                leaveType: next,
                requestType: next === "WFH" ? "WFH" : "Leave",
                coPurpose: next === "CO" ? p.coPurpose : "leave",
              }));
              if (next !== "SL") setMedicalFile(null);
            }}
          >
            <option value="" disabled>
              Select
            </option>
            {(form.requestType === "WFH"
              ? typeOptions.filter((o) => o.code === "WFH")
              : typeOptions.filter((o) => o.code !== "WFH")
            ).map((opt) => (
              <option key={opt.code} value={opt.code}>
                {opt.code === "WFH" ? "Work From Home (WFH)" : opt.label}
              </option>
            ))}
          </Select>
        </Field>

        <Field label="Day Type" required>
          <Select
            value={form.dayPart}
            onChange={(e) =>
              setForm((p) => ({ ...p, dayPart: e.target.value }))
            }
          >
            <option value="" disabled>
              Select
            </option>
            <option value="full">Full Day</option>
            <option value="first-half" disabled={!isSingleDay && Boolean(form.endDate)}>
              First Half
            </option>
            <option value="second-half" disabled={!isSingleDay && Boolean(form.endDate)}>
              Second Half
            </option>
          </Select>
        </Field>

        <Field label="Start Date" required>
          <Input
            type="date"
            value={form.startDate}
            onChange={(e) =>
              setForm((p) => ({ ...p, startDate: e.target.value }))
            }
          />
        </Field>
        <Field label="End Date" required>
          <Input
            type="date"
            value={form.endDate}
            min={form.startDate || undefined}
            onChange={(e) =>
              setForm((p) => ({ ...p, endDate: e.target.value }))
            }
          />
        </Field>

        {form.leaveType === "CO" && form.requestType !== "WFH" ? (
          <Field label="CO Purpose" className="sm:col-span-2">
            <div className="flex flex-wrap gap-4 text-sm">
              <label className="inline-flex items-center gap-2">
                <input
                  type="radio"
                  name="co-purpose"
                  checked={form.coPurpose === "leave"}
                  onChange={() =>
                    setForm((p) => ({ ...p, coPurpose: "leave" }))
                  }
                />
                Take leave
              </label>
              <label className="inline-flex items-center gap-2">
                <input
                  type="radio"
                  name="co-purpose"
                  checked={form.coPurpose === "credit"}
                  onChange={() =>
                    setForm((p) => ({ ...p, coPurpose: "credit" }))
                  }
                />
                Earn credit (worked on off-day)
              </label>
            </div>
          </Field>
        ) : null}

        {needsMedical ? (
          <Field
            label={`Medical Document (required when SL > ${slRequiredWhenDaysGt} days)`}
            required
            className="sm:col-span-2"
          >
            <Input
              type="file"
              accept=".pdf,.png,.jpg,.jpeg"
              onChange={(e) => {
                const file = e.target.files?.[0] || null;
                if (file && !/\.(pdf|png|jpe?g)$/i.test(file.name || "")) {
                  setError(
                    "Only PDF, PNG, JPG files are allowed for medical documents.",
                  );
                  e.target.value = "";
                  setMedicalFile(null);
                  return;
                }
                setMedicalFile(file);
              }}
            />
          </Field>
        ) : null}

        <Field label="Reason" required className="sm:col-span-2">
          <TextArea
            rows={2}
            style={{ minHeight: 70 }}
            value={form.reason}
            placeholder={
              form.leaveType === "CO" && form.coPurpose === "credit"
                ? "Which off-day did you work?"
                : "Enter reason here"
            }
            onChange={(e) =>
              setForm((p) => ({ ...p, reason: e.target.value }))
            }
          />
        </Field>

        {daySpan != null ? (
          <p className="m-0 sm:col-span-2 text-xs text-wz-text-secondary">
            Selected range: {daySpan} calendar day{daySpan === 1 ? "" : "s"}
            {form.leaveType === "CO" && form.coPurpose === "credit"
              ? ""
              : " (week-offs and holidays are excluded from the leave balance on submit)"}
          </p>
        ) : null}

        {error ? (
          <p className="m-0 sm:col-span-2 text-sm text-wz-error" role="alert">
            {error}
          </p>
        ) : null}
      </div>
    </Modal>
  );
}
