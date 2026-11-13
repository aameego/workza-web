import { useEffect, useState, type ReactNode } from "react";
import {
  Button,
  Field,
  Input,
  Modal,
  Select,
  TextArea,
} from "../../design-system";
import { ApiError } from "../../lib/apiClient";
import SearchableEmployeeSelect from "../attendance/SearchableEmployeeSelect";
import {
  useCreateDepartment,
  useOtPolicies,
  useShifts,
  useUpdateDepartment,
} from "../../hooks/useDepartments";
import type { Department } from "../../services/departmentService";
import {
  formHasErrors,
  validateDepartmentForm,
  type DepartmentFieldErrors,
} from "./departmentValidation";
import {
  PAYOUT_RULE_OPTIONS,
  STATE_OPTIONS,
  departmentToForm,
  emptyDepartmentForm,
  sanitizeGeoValue,
  toNullableNumber,
  type DepartmentFormValues,
} from "./departmentViewModel";

export type DepartmentFormModalProps = {
  open: boolean;
  mode: "create" | "edit";
  department: Department | null;
  vendorId: string;
  onClose: () => void;
  onDelete?: (department: Department) => void;
};

function FormSection({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-wz-md border border-wz-border p-wz-4">
      <div className="mb-wz-4">
        <h3 className="m-0 text-sm font-bold leading-5 text-wz-heading">
          {title}
        </h3>
        <p className="m-0 mt-1 text-xs leading-4 text-wz-text-muted">
          {description}
        </p>
      </div>
      <div className="grid grid-cols-1 gap-wz-4 sm:grid-cols-3">{children}</div>
    </section>
  );
}

export default function DepartmentFormModal({
  open,
  mode,
  department,
  vendorId,
  onClose,
  onDelete,
}: DepartmentFormModalProps) {
  const [form, setForm] = useState<DepartmentFormValues>(emptyDepartmentForm());
  const [errors, setErrors] = useState<DepartmentFieldErrors>({});
  const [submitError, setSubmitError] = useState<string | null>(null);

  const { data: shifts = [] } = useShifts(vendorId, open);
  const { data: otPolicies = [] } = useOtPolicies(vendorId, open);
  const createMutation = useCreateDepartment();
  const updateMutation = useUpdateDepartment();
  const saving = createMutation.isPending || updateMutation.isPending;

  useEffect(() => {
    if (!open) return;
    setForm(
      mode === "edit" && department
        ? departmentToForm(department)
        : emptyDepartmentForm(),
    );
    setErrors({});
    setSubmitError(null);
  }, [open, mode, department]);

  const setField = <K extends keyof DepartmentFormValues>(
    key: K,
    value: DepartmentFormValues[K],
  ) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => {
      if (!prev[key] && !prev.form) return prev;
      const next = { ...prev };
      delete next[key];
      delete next.form;
      return next;
    });
    if (submitError) setSubmitError(null);
  };

  const handleGeoChange = (
    key: "latitude" | "longitude" | "geofenceRadiusMeters",
    raw: string,
  ) => {
    setField(key, sanitizeGeoValue(key, raw));
  };

  const handleSubmit = async () => {
    const nextErrors = validateDepartmentForm(form);
    if (formHasErrors(nextErrors)) {
      setErrors(nextErrors);
      return;
    }
    setErrors({});
    setSubmitError(null);

    const payload = {
      vendorId,
      name: form.name.trim(),
      description: form.description.trim() || undefined,
      shift: form.shift || null,
      otPolicy: form.otPolicy || null,
      departmentHead: form.departmentHead || null,
      sitePayoutRule: form.sitePayoutRule || null,
      stateName: form.stateName || null,
      latitude: toNullableNumber(form.latitude),
      longitude: toNullableNumber(form.longitude),
      geofenceRadiusMeters: toNullableNumber(form.geofenceRadiusMeters),
      allowOutsideGeofence: form.allowOutsideGeofence !== false,
    };

    try {
      if (mode === "edit" && department) {
        await updateMutation.mutateAsync({ id: department._id, payload });
      } else {
        await createMutation.mutateAsync(payload);
      }
      onClose();
    } catch (err) {
      setSubmitError(
        err instanceof ApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : "Could not save department",
      );
    }
  };

  const title = mode === "edit" ? "Edit Department" : "Add Department";
  const primaryLabel =
    mode === "edit"
      ? saving
        ? "Saving…"
        : "Save Changes"
      : saving
        ? "Adding…"
        : "Add Department";

  return (
    <Modal
      open={open}
      title={title}
      onClose={onClose}
      size="lg"
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
        {submitError || errors.form ? (
          <div
            id="geofence-error-summary"
            className="rounded-wz-md border border-wz-error/35 bg-wz-error/8 px-3.5 py-2.5 text-xs text-wz-error"
            role="alert"
          >
            {submitError || errors.form}
          </div>
        ) : null}

        <FormSection
          title="Primary Details"
          description="Identify core naming scope values"
        >
          <Field
            label="Department Name"
            htmlFor="dep-name"
            required
            error={errors.name}
            className="sm:col-span-3"
          >
            <Input
              id="dep-name"
              value={form.name}
              onChange={(e) => setField("name", e.target.value)}
              placeholder="Enter here"
              aria-invalid={Boolean(errors.name)}
            />
          </Field>
          {/* Figma: Payout | State as two equal columns (not 1+2). */}
          <div className="sm:col-span-3 grid grid-cols-1 gap-wz-4 sm:grid-cols-2">
            <Field label="Payout Rule" htmlFor="dep-payout">
              <Select
                id="dep-payout"
                value={form.sitePayoutRule}
                onChange={(e) => setField("sitePayoutRule", e.target.value)}
              >
                <option value="">Select here</option>
                {PAYOUT_RULE_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="State Name" htmlFor="dep-state">
              <Select
                id="dep-state"
                value={form.stateName}
                onChange={(e) => setField("stateName", e.target.value)}
              >
                <option value="">Select here</option>
                {STATE_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </Select>
            </Field>
          </div>
          <Field
            label="Department Description"
            htmlFor="dep-desc"
            error={errors.description}
            className="sm:col-span-3"
          >
            <TextArea
              id="dep-desc"
              rows={3}
              value={form.description}
              onChange={(e) => setField("description", e.target.value)}
              placeholder="Enter here"
            />
          </Field>
        </FormSection>

        <FormSection
          title="Attendance Geofence"
          description="Site location and allowed radius in meters for attendance marking. Leave all three empty for no geofence."
        >
          <Field label="Latitude" htmlFor="dep-lat" error={errors.latitude}>
            <Input
              id="dep-lat"
              inputMode="decimal"
              value={form.latitude}
              onChange={(e) => handleGeoChange("latitude", e.target.value)}
              placeholder="Enter here"
              aria-invalid={Boolean(errors.latitude)}
            />
          </Field>
          <Field label="Longitude" htmlFor="dep-lng" error={errors.longitude}>
            <Input
              id="dep-lng"
              inputMode="decimal"
              value={form.longitude}
              onChange={(e) => handleGeoChange("longitude", e.target.value)}
              placeholder="Enter here"
              aria-invalid={Boolean(errors.longitude)}
            />
          </Field>
          <Field
            label="Geofence Radius (meters)"
            htmlFor="dep-radius"
            error={errors.geofenceRadiusMeters}
          >
            <Input
              id="dep-radius"
              inputMode="decimal"
              value={form.geofenceRadiusMeters}
              onChange={(e) =>
                handleGeoChange("geofenceRadiusMeters", e.target.value)
              }
              placeholder="Enter here"
              aria-invalid={Boolean(errors.geofenceRadiusMeters)}
            />
          </Field>
          <label className="sm:col-span-3 flex cursor-pointer items-center gap-2 text-[13px] font-medium text-wz-heading">
            <input
              type="checkbox"
              checked={form.allowOutsideGeofence}
              onChange={(e) =>
                setField("allowOutsideGeofence", e.target.checked)
              }
              className="size-4 accent-wz-primary"
            />
            Can mark attendance outside the geofence
          </label>
        </FormSection>

        <FormSection
          title="Operational Rules & Leadership"
          description="Link shifts, rules, and heads"
        >
          <Field
            label="Assigned Operational Shift"
            htmlFor="dep-shift"
            required
            error={errors.shift}
          >
            <Select
              id="dep-shift"
              value={form.shift}
              onChange={(e) => setField("shift", e.target.value)}
              aria-invalid={Boolean(errors.shift)}
            >
              <option value="">Select here</option>
              {shifts.map((s) => (
                <option key={s._id} value={s._id}>
                  {s.name || s.shiftName}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Overtime Policy Rule" htmlFor="dep-ot">
            <Select
              id="dep-ot"
              value={form.otPolicy}
              onChange={(e) => setField("otPolicy", e.target.value)}
            >
              <option value="">Select here</option>
              {otPolicies.map((p) => (
                <option key={p._id} value={p._id}>
                  {p.policyName || p.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field
            label="Department Head / Manager"
            htmlFor="dep-head"
            className="sm:col-span-1"
          >
            <SearchableEmployeeSelect
              value={form.departmentHead}
              onChange={(id) => setField("departmentHead", id)}
              placeholder="Select here"
            />
          </Field>
        </FormSection>

        {mode === "edit" && department && onDelete ? (
          <div className="flex justify-start">
            <Button
              type="button"
              variant="ghost"
              className="text-wz-error hover:bg-wz-error/8"
              onClick={() => onDelete(department)}
              disabled={saving}
            >
              Delete department
            </Button>
          </div>
        ) : null}
      </div>
    </Modal>
  );
}
