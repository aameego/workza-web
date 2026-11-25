import { useRef, useState } from "react";
import { SquarePen, Trash2 } from "lucide-react";
import {
  Badge,
  Button,
  Card,
  ConfirmDialog,
  Field,
  Input,
  Select,
  cn,
  showSuccessToast,
} from "../../../design-system";
import { ApiError } from "../../../lib/apiClient";
import { readSessionUser } from "../../../layouts/sessionUser";
import {
  useCreateOvertimePolicy,
  useDeleteOvertimePolicy,
  useOvertimePolicies,
  useUpdateOvertimePolicy,
} from "../../../hooks/useOvertime";
import type {
  OvertimeAction,
  OvertimePolicy,
  OvertimePolicyPayload,
  OvertimeTriggerType,
  Weekday,
} from "../../../services/overtimeService";

const DAYS: { value: Weekday; short: string }[] = [
  { value: "Monday", short: "Mon" },
  { value: "Tuesday", short: "Tue" },
  { value: "Wednesday", short: "Wed" },
  { value: "Thursday", short: "Thu" },
  { value: "Friday", short: "Fri" },
  { value: "Saturday", short: "Sat" },
  { value: "Sunday", short: "Sun" },
];

const ACTIONS: { value: OvertimeAction; label: string; description: string }[] =
  [
    {
      value: "Incentive",
      label: "Incentive",
      description: "Provide direct operational financial payout Incentive.",
    },
    {
      value: "Add Leave",
      label: "Add Leave",
      description: "Convert excess hours into half-day or full-day leaves.",
    },
    {
      value: "None",
      label: "No Action",
      description:
        "Log overtime for metrics without adding leaves or pay tier variances.",
    },
  ];

type FormState = {
  policyName: string;
  OverTimeAction: OvertimeAction;
  triggerType: OvertimeTriggerType;
  minHours: string;
  perHourRate: string;
  halfDayThresholdHours: string;
  fullDayThresholdHours: string;
  applicableDays: Weekday[];
};

/** Defaults mirror the mock: General / Daily / Incentive / weekend days. */
const DEFAULT_FORM: FormState = {
  policyName: "General",
  OverTimeAction: "Incentive",
  triggerType: "Daily",
  minHours: "0",
  perHourRate: "0",
  halfDayThresholdHours: "4",
  fullDayThresholdHours: "8",
  applicableDays: ["Saturday", "Sunday"],
};

const thClass =
  "h-[54px] border-b border-wz-border bg-white px-4 text-left align-middle text-xs leading-[normal] font-semibold text-wz-heading";
const tdClass =
  "h-[60px] border-b border-wz-border px-4 py-0 align-middle text-xs leading-[normal] text-wz-heading";

const sectionLabelClass =
  "m-0 text-[11px] font-semibold uppercase tracking-wide text-wz-text-muted";

/** Hours (form) → minutes (API). Empty/garbage parses as 0. */
const toMinutes = (hours: string): number =>
  Math.round((Number(hours) || 0) * 60);

const parseHours = (raw: string): number => Number(raw) || 0;

export function OvertimeTab() {
  const vendorId = readSessionUser()?.vendorId ?? null;

  const policiesQuery = useOvertimePolicies(vendorId);
  const createMutation = useCreateOvertimePolicy();
  const updateMutation = useUpdateOvertimePolicy();
  const deleteMutation = useDeleteOvertimePolicy();

  const [form, setForm] = useState<FormState>(DEFAULT_FORM);
  const [editing, setEditing] = useState<OvertimePolicy | null>(null);
  const [formError, setFormError] = useState("");
  const [listError, setListError] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<OvertimePolicy | null>(null);

  const listRef = useRef<HTMLDivElement>(null);
  const formRef = useRef<HTMLDivElement>(null);

  const policies = policiesQuery.data ?? [];
  const isSaving = createMutation.isPending || updateMutation.isPending;

  const setField = <K extends keyof FormState>(
    key: K,
    value: FormState[K],
  ) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (formError) setFormError("");
  };

  const toggleDay = (day: Weekday) => {
    setForm((prev) => ({
      ...prev,
      applicableDays: prev.applicableDays.includes(day)
        ? prev.applicableDays.filter((d) => d !== day)
        : [...prev.applicableDays, day],
    }));
  };

  const handleEdit = (policy: OvertimePolicy) => {
    setEditing(policy);
    setForm({
      policyName: policy.policyName || "",
      OverTimeAction: policy.OverTimeAction || "Incentive",
      triggerType: policy.triggerType || "Daily",
      minHours: String(policy.minHours ? policy.minHours / 60 : 0),
      perHourRate: String(policy.perHourRate ?? 0),
      halfDayThresholdHours: String(
        policy.halfDayThreshold ? policy.halfDayThreshold / 60 : 0,
      ),
      fullDayThresholdHours: String(
        policy.fullDayThreshold ? policy.fullDayThreshold / 60 : 0,
      ),
      applicableDays: policy.applicableDays || [],
    });
    setFormError("");
    formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const handleCancel = () => {
    setEditing(null);
    setForm(DEFAULT_FORM);
    setFormError("");
    listRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const handleSave = async () => {
    if (isSaving) return;
    setFormError("");

    if (!form.policyName.trim()) {
      setFormError("Policy name is required.");
      return;
    }

    const minHours = parseHours(form.minHours);
    const perHourRate = parseHours(form.perHourRate);
    const halfDayHours = parseHours(form.halfDayThresholdHours);
    const fullDayHours = parseHours(form.fullDayThresholdHours);

    if (form.OverTimeAction === "Add Leave") {
      if (halfDayHours <= 0 || fullDayHours <= 0) {
        setFormError("Threshold hours must be greater than zero.");
        return;
      }
      if (halfDayHours >= fullDayHours) {
        setFormError(
          "Full-day threshold must be greater than the half-day threshold.",
        );
        return;
      }
    }

    if (form.OverTimeAction === "Incentive" && (minHours < 0 || perHourRate < 0)) {
      setFormError(
        "Minimum hours and per hour rate values cannot be negative.",
      );
      return;
    }

    if (!vendorId) {
      setFormError(
        "Could not identify your organization. Please log in again.",
      );
      return;
    }

    const payload: OvertimePolicyPayload = {
      vendorId,
      policyName: form.policyName.trim(),
      OverTimeAction: form.OverTimeAction,
      triggerType: form.triggerType,
      halfDayThreshold: halfDayHours * 60,
      fullDayThreshold: fullDayHours * 60,
      minHours: minHours * 60,
      perHourRate,
      applicableDays: form.applicableDays,
    };

    try {
      if (editing) {
        await updateMutation.mutateAsync({
          policyId: editing._id,
          data: payload,
        });
        showSuccessToast("Overtime policy updated.");
      } else {
        await createMutation.mutateAsync(payload);
        showSuccessToast("Overtime policy saved.");
      }
      setEditing(null);
      setForm(DEFAULT_FORM);
      listRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    } catch (err) {
      setFormError(
        err instanceof ApiError
          ? err.message
          : "Could not save overtime policy.",
      );
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteMutation.mutateAsync(deleteTarget._id);
      showSuccessToast("Overtime policy deleted.");
      if (editing?._id === deleteTarget._id) {
        setEditing(null);
        setForm(DEFAULT_FORM);
      }
      setDeleteTarget(null);
    } catch (err) {
      setListError(
        err instanceof ApiError
          ? err.message
          : "Could not delete overtime policy.",
      );
      setDeleteTarget(null);
    }
  };

  const detailsText = (policy: OvertimePolicy): string => {
    if (policy.OverTimeAction === "Incentive") {
      return `Min ${policy.minHours / 60}h · ${policy.perHourRate ?? 0}/hr`;
    }
    if (policy.OverTimeAction === "Add Leave") {
      return `Half: ${policy.halfDayThreshold / 60}h | Full: ${
        policy.fullDayThreshold / 60
      }h`;
    }
    return "Logging Only";
  };

  const actionBadge = (action: OvertimeAction) => {
    if (action === "Incentive") return "info";
    if (action === "Add Leave") return "success";
    return "neutral";
  };

  return (
    <div className="flex flex-col gap-wz-6">
      {/* ── Configured policies ─────────────────────────────── */}
      <div ref={listRef}>
        <Card className="w-full">
          <div>
            <h2 className="m-0 text-lg font-semibold text-wz-heading">
              Configured Overtime Policies
            </h2>
            <p className="m-0 mt-1 text-sm text-wz-text-muted">
              Review and manage overtime rules for your organization.
            </p>
          </div>

          {listError ? (
            <p
              className="m-0 rounded-wz-md bg-[#fef3f2] px-3 py-2 text-sm text-[#b42318]"
              role="alert"
            >
              {listError}
            </p>
          ) : null}

          {policiesQuery.isLoading ? (
            <p className="m-0 text-sm text-wz-text-muted">
              Loading overtime policies…
            </p>
          ) : policiesQuery.isError ? (
            <p
              className="m-0 rounded-wz-md bg-[#fef3f2] px-3 py-2 text-sm text-[#b42318]"
              role="alert"
            >
              {policiesQuery.error instanceof ApiError
                ? policiesQuery.error.message
                : "Could not load overtime policies."}
            </p>
          ) : policies.length === 0 ? (
            <div className="rounded-wz-md border border-wz-border bg-wz-neutral-50 px-4 py-6 text-center text-sm text-wz-text-muted">
              No overtime policies configured yet.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px] border-collapse">
                <thead>
                  <tr>
                    {[
                      "Policy Name",
                      "Interval",
                      "Action Rule",
                      "Details",
                      "Applicable Days",
                      "Actions",
                    ].map((label) => (
                      <th key={label} className={thClass}>
                        {label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {policies.map((policy) => (
                    <tr key={policy._id} className="hover:bg-wz-hover/40">
                      <td className={tdClass}>
                        <span className="font-semibold">
                          {policy.policyName}
                        </span>
                      </td>
                      <td className={tdClass}>
                        <Badge status="neutral">{policy.triggerType}</Badge>
                      </td>
                      <td className={tdClass}>
                        <Badge status={actionBadge(policy.OverTimeAction)}>
                          {policy.OverTimeAction === "None"
                            ? "No Action"
                            : policy.OverTimeAction}
                        </Badge>
                      </td>
                      <td className={tdClass}>{detailsText(policy)}</td>
                      <td className={tdClass}>
                        <div className="flex flex-wrap gap-1">
                          {policy.applicableDays?.map((day) => (
                            <Badge key={day} status="neutral" size="sm">
                              {day.slice(0, 3)}
                            </Badge>
                          ))}
                        </div>
                      </td>
                      <td className={tdClass}>
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            className="inline-flex size-8 cursor-pointer items-center justify-center rounded-wz-sm border border-wz-border bg-white text-wz-heading hover:bg-wz-hover"
                            aria-label={`Edit ${policy.policyName}`}
                            onClick={() => handleEdit(policy)}
                          >
                            <SquarePen size={14} />
                          </button>
                          <button
                            type="button"
                            className="inline-flex size-8 cursor-pointer items-center justify-center rounded-wz-sm border border-wz-border bg-white text-wz-danger hover:bg-wz-hover"
                            aria-label={`Delete ${policy.policyName}`}
                            onClick={() => setDeleteTarget(policy)}
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>

      {/* ── Policy configuration form ───────────────────────── */}
      <div ref={formRef}>
        <Card className="w-full">
          <div className="flex flex-col gap-wz-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="m-0 text-lg font-semibold text-wz-heading">
                  Overtime Policy Configuration
                </h2>
                {editing ? <Badge status="info">Editing</Badge> : null}
              </div>
              <p className="m-0 mt-1 text-sm text-wz-text-muted">
                Define triggers and compensation actions for overtime hours.
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-wz-3">
              <Button variant="secondary" onClick={handleCancel}>
                Cancel
              </Button>
              <Button
                variant="primary"
                disabled={isSaving}
                onClick={handleSave}
              >
                {isSaving ? "Saving…" : "Save Changes"}
              </Button>
            </div>
          </div>

          {formError ? (
            <p
              className="m-0 rounded-wz-md bg-[#fef3f2] px-3 py-2 text-sm text-[#b42318]"
              role="alert"
            >
              {formError}
            </p>
          ) : null}

          {/* 1. Tracking metrics */}
          <div className="flex flex-col gap-wz-4">
            <p className={sectionLabelClass}>1. Tracking Metrics</p>
            <div className="grid grid-cols-1 gap-wz-4 md:grid-cols-2">
              <Field label="Policy Name" htmlFor="ot-policy-name">
                <Input
                  id="ot-policy-name"
                  value={form.policyName}
                  onChange={(e) => setField("policyName", e.target.value)}
                  required
                />
              </Field>
              <Field
                label="Trigger Interval"
                htmlFor="ot-trigger"
                hint="Determines the window over which cumulative overtime thresholds will execute."
              >
                <Select
                  id="ot-trigger"
                  value={form.triggerType}
                  onChange={(e) =>
                    setField(
                      "triggerType",
                      e.target.value as OvertimeTriggerType,
                    )
                  }
                >
                  <option value="Daily">Daily</option>
                  <option value="Weekly">Weekly</option>
                  <option value="Monthly">Monthly</option>
                </Select>
              </Field>
            </div>
          </div>

          <div className="border-t border-wz-border" />

          {/* 2. Overtime action rules */}
          <div className="flex flex-col gap-wz-4">
            <p className={sectionLabelClass}>2. Overtime Action Rules</p>
            <div
              className="grid grid-cols-1 gap-wz-3 md:grid-cols-3"
              role="radiogroup"
              aria-label="Overtime action rules"
            >
              {ACTIONS.map((action) => {
                const selected = form.OverTimeAction === action.value;
                return (
                  <label
                    key={action.value}
                    className={cn(
                      "flex cursor-pointer flex-col gap-1.5 rounded-wz-lg border p-4 transition-colors",
                      selected
                        ? "border-wz-primary bg-wz-hover"
                        : "border-wz-border bg-white hover:bg-wz-neutral-50",
                    )}
                  >
                    <span className="flex items-center justify-between gap-2">
                      <span className="text-sm font-semibold text-wz-heading">
                        {action.label}
                      </span>
                      <input
                        type="radio"
                        name="ot-action"
                        value={action.value}
                        checked={selected}
                        onChange={() => setField("OverTimeAction", action.value)}
                        className="size-4 accent-wz-primary"
                      />
                    </span>
                    <span className="text-xs leading-5 text-wz-text-muted">
                      {action.description}
                    </span>
                  </label>
                );
              })}
            </div>

            {form.OverTimeAction === "Incentive" ? (
              <div className="grid grid-cols-1 gap-wz-4 md:grid-cols-2">
                <Field
                  label={`Minimum overtime hours (hours (${toMinutes(
                    form.minHours,
                  )}m))`}
                  htmlFor="ot-min-hours"
                >
                  <Input
                    id="ot-min-hours"
                    type="number"
                    min={0}
                    step={0.5}
                    value={form.minHours}
                    onChange={(e) => setField("minHours", e.target.value)}
                  />
                </Field>
                <Field label="Per hour rate (per hour)" htmlFor="ot-rate">
                  <Input
                    id="ot-rate"
                    type="number"
                    min={0}
                    step={1}
                    value={form.perHourRate}
                    onChange={(e) => setField("perHourRate", e.target.value)}
                  />
                </Field>
              </div>
            ) : null}

            {form.OverTimeAction === "Add Leave" ? (
              <div className="grid grid-cols-1 gap-wz-4 md:grid-cols-2">
                <Field
                  label={`Half-Day Leave Trigger (hours (${toMinutes(
                    form.halfDayThresholdHours,
                  )}m))`}
                  htmlFor="ot-half-day"
                >
                  <Input
                    id="ot-half-day"
                    type="number"
                    min={0}
                    step={0.5}
                    value={form.halfDayThresholdHours}
                    onChange={(e) =>
                      setField("halfDayThresholdHours", e.target.value)
                    }
                  />
                </Field>
                <Field
                  label={`Full-Day Leave Trigger (hours (${toMinutes(
                    form.fullDayThresholdHours,
                  )}m))`}
                  htmlFor="ot-full-day"
                >
                  <Input
                    id="ot-full-day"
                    type="number"
                    min={0}
                    step={0.5}
                    value={form.fullDayThresholdHours}
                    onChange={(e) =>
                      setField("fullDayThresholdHours", e.target.value)
                    }
                  />
                </Field>
              </div>
            ) : null}
          </div>

          <div className="border-t border-wz-border" />

          {/* 3. Applicable days */}
          <div className="flex flex-col gap-wz-4">
            <p className={sectionLabelClass}>3. Applicable Days</p>
            <div className="flex flex-wrap gap-4">
              {DAYS.map((day) => {
                const selected = form.applicableDays.includes(day.value);
                return (
                  <button
                    key={day.value}
                    type="button"
                    aria-pressed={selected}
                    onClick={() => toggleDay(day.value)}
                    className={cn(
                      "cursor-pointer rounded-wz-md border px-4 py-2.5 text-sm font-semibold transition-colors",
                      selected
                        ? "border-wz-primary bg-wz-primary text-white"
                        : "border-wz-border bg-white text-wz-heading hover:bg-wz-neutral-50",
                    )}
                  >
                    {day.short}
                  </button>
                );
              })}
            </div>
          </div>
        </Card>
      </div>

      <ConfirmDialog
        open={deleteTarget !== null}
        title="Delete overtime policy?"
        message={`“${deleteTarget?.policyName ?? ""}” will be permanently removed. This cannot be undone.`}
        tone="destructive"
        confirmLabel="Delete"
        loading={deleteMutation.isPending}
        onConfirm={handleDelete}
        onClose={() => setDeleteTarget(null)}
      />
    </div>
  );
}
