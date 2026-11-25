import { useRef, useState } from "react";
import {
  Button,
  Field,
  Input,
  Modal,
  Select,
  TextArea,
  showSuccessToast,
} from "../../../design-system";
import { ApiError } from "../../../lib/apiClient";
import {
  useCreateHoliday,
  useUpdateHoliday,
} from "../../../hooks/useHolidays";
import { useDepartments } from "../../../hooks/useDepartments";
import {
  HOLIDAY_TYPES,
  INDIAN_STATES,
  holidayTypeLabel,
  type Holiday,
  type HolidayPayload,
  type HolidayType,
} from "../../../services/holidayService";

export type HolidayFormModalProps = {
  open: boolean;
  mode: "create" | "edit";
  holiday: Holiday | null;
  vendorId: string;
  onClose: () => void;
};

type HolidayFormValues = {
  name: string;
  /** YYYY-MM-DD */
  date: string;
  type: HolidayType;
  /** "" = all departments */
  department: string;
  /** "" = all states */
  state: string;
  description: string;
};

type HolidayFieldErrors = {
  name?: string;
  date?: string;
  type?: string;
};

const emptyForm = (): HolidayFormValues => ({
  name: "",
  date: "",
  type: "National",
  department: "",
  state: "",
  description: "",
});

/** ISO (or date-only) → local YYYY-MM-DD without timezone day-shift. */
const toInputDate = (value?: string | null): string => {
  if (!value) return "";
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(value);
  if (m) return `${m[1]}-${m[2]}-${m[3]}`;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${month}-${day}`;
};

const holidayToForm = (holiday: Holiday): HolidayFormValues => ({
  name: holiday.name || "",
  date: toInputDate(holiday.date),
  type: holiday.type || "National",
  department: holiday.department || "",
  state: holiday.state || "",
  description: holiday.description || "",
});

const validate = (
  form: HolidayFormValues,
  mode: "create" | "edit",
): HolidayFieldErrors => {
  const errors: HolidayFieldErrors = {};
  if (!form.name.trim()) errors.name = "Holiday name is required.";
  if (!form.date) {
    errors.date = "Date is required.";
  } else if (mode === "create") {
    // Backend rejects holidays dated before the current year.
    const year = Number(form.date.slice(0, 4));
    if (year < new Date().getFullYear()) {
      errors.date = `Holidays cannot be created for past years. Please select ${new Date().getFullYear()} or later.`;
    }
  }
  if (!form.type) errors.type = "Type is required.";
  return errors;
};

const hasErrors = (errors: HolidayFieldErrors): boolean =>
  Boolean(errors.name || errors.date || errors.type);

export function HolidayFormModal({
  open,
  mode,
  holiday,
  vendorId,
  onClose,
}: HolidayFormModalProps) {
  // The parent keys this component per open-target, so it remounts on every
  // open and these initializers always see the current mode/holiday.
  const [form, setForm] = useState<HolidayFormValues>(() =>
    mode === "edit" && holiday ? holidayToForm(holiday) : emptyForm(),
  );
  const [errors, setErrors] = useState<HolidayFieldErrors>({});
  const [submitError, setSubmitError] = useState<string | null>(null);

  const { data: departments = [] } = useDepartments(vendorId, open);
  const createMutation = useCreateHoliday();
  const updateMutation = useUpdateHoliday();
  const saving = createMutation.isPending || updateMutation.isPending;
  // isPending only flips after a re-render; the ref stops a fast double click.
  const submittingRef = useRef(false);

  const setField = <K extends keyof HolidayFormValues>(
    key: K,
    value: HolidayFormValues[K],
  ) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => {
      if (!(key in prev)) return prev;
      const next = { ...prev };
      delete next[key as keyof HolidayFieldErrors];
      return next;
    });
    if (submitError) setSubmitError(null);
  };

  const handleSubmit = async () => {
    if (submittingRef.current) return;
    const nextErrors = validate(form, mode);
    if (hasErrors(nextErrors)) {
      setErrors(nextErrors);
      return;
    }
    setErrors({});
    setSubmitError(null);

    const payload: HolidayPayload = {
      vendorId,
      name: form.name.trim(),
      date: form.date,
      department: form.department || null,
      state: form.state || null,
      type: form.type,
      description: form.description.trim(),
    };

    submittingRef.current = true;
    try {
      if (mode === "edit" && holiday?._id) {
        await updateMutation.mutateAsync({
          holidayId: holiday._id,
          data: payload,
        });
        showSuccessToast("Holiday updated successfully.");
      } else {
        await createMutation.mutateAsync(payload);
        showSuccessToast("Holiday created successfully.");
      }
      onClose();
    } catch (err) {
      setSubmitError(
        err instanceof ApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : "Could not save holiday.",
      );
    } finally {
      submittingRef.current = false;
    }
  };

  const title = mode === "edit" ? "Edit Holiday" : "Add Holidays";
  const primaryLabel =
    mode === "edit"
      ? saving
        ? "Saving…"
        : "Save Changes"
      : saving
        ? "Adding…"
        : "Add Holiday";

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

        <div className="grid grid-cols-1 gap-wz-4 sm:grid-cols-2">
          <Field
            label="Holiday Name"
            htmlFor="hol-name"
            required
            error={errors.name}
            className="sm:col-span-2"
          >
            <Input
              id="hol-name"
              value={form.name}
              onChange={(e) => setField("name", e.target.value)}
              placeholder="Enter here"
              maxLength={50}
              aria-invalid={Boolean(errors.name)}
            />
          </Field>

          <Field
            label="Date"
            htmlFor="hol-date"
            required
            error={errors.date}
          >
            <Input
              id="hol-date"
              type="date"
              value={form.date}
              onChange={(e) => setField("date", e.target.value)}
              aria-invalid={Boolean(errors.date)}
            />
          </Field>

          <Field label="Type" htmlFor="hol-type" required error={errors.type}>
            <Select
              id="hol-type"
              value={form.type}
              onChange={(e) => setField("type", e.target.value as HolidayType)}
              aria-invalid={Boolean(errors.type)}
            >
              {HOLIDAY_TYPES.map((type) => (
                <option key={type} value={type}>
                  {holidayTypeLabel(type)}
                </option>
              ))}
            </Select>
          </Field>

          <Field label="Department" htmlFor="hol-department" required>
            <Select
              id="hol-department"
              value={form.department}
              onChange={(e) => setField("department", e.target.value)}
            >
              <option value="">All</option>
              {departments.map((dept) => (
                <option key={dept._id || dept.name} value={dept.name}>
                  {dept.name}
                </option>
              ))}
            </Select>
          </Field>

          <Field label="States" htmlFor="hol-state" required>
            <Select
              id="hol-state"
              value={form.state}
              onChange={(e) => setField("state", e.target.value)}
            >
              <option value="">All</option>
              {INDIAN_STATES.map((state) => (
                <option key={state} value={state}>
                  {state}
                </option>
              ))}
            </Select>
          </Field>

          <Field
            label="Description"
            htmlFor="hol-description"
            className="sm:col-span-2"
          >
            <TextArea
              id="hol-description"
              rows={3}
              value={form.description}
              onChange={(e) => setField("description", e.target.value)}
              placeholder="Enter reason here"
            />
          </Field>
        </div>
      </div>
    </Modal>
  );
}

export default HolidayFormModal;
