import { useRef, useState } from "react";
import {
  Button,
  Field,
  Input,
  Modal,
  Select,
  showSuccessToast,
} from "../../../design-system";
import { ApiError } from "../../../lib/apiClient";
import {
  useCreateShift,
  useUpdateShift,
} from "../../../hooks/useShiftWeekOff";
import {
  LATE_MARK_POLICIES,
  type LateMarkPolicy,
  type Shift,
} from "../../../services/shiftService";

export type CreateShiftModalProps = {
  open: boolean;
  mode: "create" | "edit";
  shift: Shift | null;
  vendorId: string;
  onClose: () => void;
};

type ShiftFormValues = {
  shiftName: string;
  /** HH:MM */
  startTime: string;
  /** HH:MM */
  endTime: string;
  /** minutes (string for the number input) */
  graceTime: string;
  status: LateMarkPolicy | "";
};

type ShiftFieldErrors = Partial<Record<keyof ShiftFormValues, string>>;

const emptyForm = (): ShiftFormValues => ({
  shiftName: "",
  startTime: "",
  endTime: "",
  graceTime: "",
  status: "",
});

const shiftToForm = (shift: Shift): ShiftFormValues => ({
  shiftName: shift.shiftName || "",
  startTime: shift.startTime || "",
  endTime: shift.endTime || "",
  graceTime: String(shift.graceTime ?? 0),
  status: shift.status || "",
});

const TIME_RE = /^([01]\d|2[0-3]):([0-5]\d)$/;

const validate = (form: ShiftFormValues): ShiftFieldErrors => {
  const errors: ShiftFieldErrors = {};
  if (!form.shiftName.trim()) errors.shiftName = "Shift name is required.";
  if (!form.startTime) {
    errors.startTime = "Start time is required.";
  } else if (!TIME_RE.test(form.startTime)) {
    errors.startTime = "Use a valid time.";
  }
  if (!form.endTime) {
    errors.endTime = "End time is required.";
  } else if (!TIME_RE.test(form.endTime)) {
    errors.endTime = "Use a valid time.";
  }
  if (!form.graceTime.trim()) {
    errors.graceTime = "Grace time is required.";
  } else if (Number(form.graceTime) < 0 || Number.isNaN(Number(form.graceTime))) {
    errors.graceTime = "Enter 0 or more minutes.";
  }
  if (!form.status) errors.status = "Late mark policy is required.";
  return errors;
};

const hasErrors = (errors: ShiftFieldErrors): boolean =>
  Object.keys(errors).length > 0;

/**
 * Figma "Create Shift" overlay. The parent keys this component per open-target,
 * so it remounts on every open and the initializers see the current mode/shift.
 */
export function CreateShiftModal({
  open,
  mode,
  shift,
  vendorId,
  onClose,
}: CreateShiftModalProps) {
  const [form, setForm] = useState<ShiftFormValues>(() =>
    mode === "edit" && shift ? shiftToForm(shift) : emptyForm(),
  );
  const [errors, setErrors] = useState<ShiftFieldErrors>({});
  const [submitError, setSubmitError] = useState<string | null>(null);

  const createMutation = useCreateShift();
  const updateMutation = useUpdateShift();
  const saving = createMutation.isPending || updateMutation.isPending;
  // isPending only flips after a re-render; the ref stops a fast double click.
  const submittingRef = useRef(false);

  const setField = <K extends keyof ShiftFormValues>(
    key: K,
    value: ShiftFormValues[K],
  ) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => {
      if (!prev[key]) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
    if (submitError) setSubmitError(null);
  };

  const handleSubmit = async () => {
    if (submittingRef.current) return;
    const nextErrors = validate(form);
    if (hasErrors(nextErrors)) {
      setErrors(nextErrors);
      return;
    }
    setErrors({});
    setSubmitError(null);

    const payload = {
      vendorId,
      shiftName: form.shiftName.trim(),
      startTime: form.startTime,
      endTime: form.endTime,
      graceTime: Number(form.graceTime),
      status: form.status as LateMarkPolicy,
    };

    submittingRef.current = true;
    try {
      if (mode === "edit" && shift) {
        await updateMutation.mutateAsync({ shiftId: shift._id, data: payload });
        showSuccessToast("Shift updated successfully.");
      } else {
        await createMutation.mutateAsync(payload);
        showSuccessToast("Shift created successfully.");
      }
      onClose();
    } catch (err) {
      setSubmitError(
        err instanceof ApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : "Could not save shift.",
      );
    } finally {
      submittingRef.current = false;
    }
  };

  const title = mode === "edit" ? "Edit Shift" : "Create Shift";
  const primaryLabel =
    mode === "edit"
      ? saving
        ? "Saving…"
        : "Save Changes"
      : saving
        ? "Creating…"
        : "Create Shift";

  return (
    <Modal
      open={open}
      title={title}
      onClose={onClose}
      footer={
        <>
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
            disabled={saving}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="primary"
            onClick={() => void handleSubmit()}
            disabled={saving}
          >
            {primaryLabel}
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-wz-4">
        {submitError ? (
          <div
            className="rounded-wz-md border border-wz-error/35 bg-wz-error/8 px-3.5 py-2.5 text-xs text-wz-error"
            role="alert"
          >
            {submitError}
          </div>
        ) : null}

        <Field
          label="Shift Name"
          htmlFor="shift-name"
          required
          error={errors.shiftName}
        >
          <Input
            id="shift-name"
            value={form.shiftName}
            onChange={(e) => setField("shiftName", e.target.value)}
            placeholder="Enter here"
            aria-invalid={Boolean(errors.shiftName)}
          />
        </Field>

        <div className="grid grid-cols-1 gap-wz-4 sm:grid-cols-2">
          <Field
            label="Start Time"
            htmlFor="shift-start"
            required
            error={errors.startTime}
          >
            <Input
              id="shift-start"
              type="time"
              value={form.startTime}
              onChange={(e) => setField("startTime", e.target.value)}
              aria-invalid={Boolean(errors.startTime)}
            />
          </Field>
          <Field
            label="End Time"
            htmlFor="shift-end"
            required
            error={errors.endTime}
          >
            <Input
              id="shift-end"
              type="time"
              value={form.endTime}
              onChange={(e) => setField("endTime", e.target.value)}
              aria-invalid={Boolean(errors.endTime)}
            />
          </Field>
        </div>

        <div className="grid grid-cols-1 gap-wz-4 sm:grid-cols-2">
          <Field
            label="Grace Time (Minutes)"
            htmlFor="shift-grace"
            required
            error={errors.graceTime}
          >
            <Input
              id="shift-grace"
              type="number"
              min={0}
              step={1}
              inputMode="numeric"
              value={form.graceTime}
              onChange={(e) => setField("graceTime", e.target.value)}
              placeholder="Enter here"
              aria-invalid={Boolean(errors.graceTime)}
            />
          </Field>
          <Field
            label="Late Mark Policy"
            htmlFor="shift-status"
            required
            error={errors.status}
          >
            <Select
              id="shift-status"
              value={form.status}
              onChange={(e) =>
                setField("status", e.target.value as LateMarkPolicy | "")
              }
              aria-invalid={Boolean(errors.status)}
            >
              <option value="">Select</option>
              {LATE_MARK_POLICIES.map((policy) => (
                <option key={policy} value={policy}>
                  {policy}
                </option>
              ))}
            </Select>
          </Field>
        </div>
      </div>
    </Modal>
  );
}

export default CreateShiftModal;
