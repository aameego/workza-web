import { useState } from "react";
import { Button, Field, Input, showSuccessToast } from "../../design-system";
import { ApiError } from "../../lib/apiClient";
import { useRegularizationConfig, useSaveRegularizationConfig } from "../../hooks/useRegularization";
import type { RegularizationConfig as Config } from "../../services/regularizationService";
import { RegPanel } from "./RegularizationRequests";
import {
  configFromDraft,
  daysInMonth,
  draftFromConfig,
  limitSummary,
  validateConfigDraft,
  type ConfigDraft,
} from "./regularizationViewModel";

/** Figma 288:158277 Configuration tab. Admin/HR only (route-gated on the backend too). */
export function RegularizationConfig() {
  const query = useRegularizationConfig();
  if (query.isLoading) return <p className="m-0 text-sm text-wz-text-secondary">Loading configuration…</p>;
  if (query.isError) return <p className="m-0 text-sm text-wz-error">Could not load the configuration.</p>;
  // Keyed on the saved values so a refetch after save resets the draft.
  return <ConfigForm key={JSON.stringify(query.data)} saved={query.data} />;
}

function ConfigForm({ saved }: { saved?: Config }) {
  const [draft, setDraft] = useState<ConfigDraft>(() => draftFromConfig(saved));
  const [errors, setErrors] = useState<Partial<ConfigDraft>>({});
  const [apiError, setApiError] = useState("");
  const mutation = useSaveRegularizationConfig();
  const dirty = JSON.stringify(draft) !== JSON.stringify(draftFromConfig(saved));
  const now = new Date();
  const month = now.toLocaleDateString("en-GB", { month: "long" });
  const maxLimit = daysInMonth(now);

  const set = (key: keyof ConfigDraft) => (value: string) => {
    setDraft((d) => ({ ...d, [key]: value }));
    setErrors((e) => ({ ...e, [key]: undefined }));
  };

  const save = async () => {
    const next = validateConfigDraft(draft, now);
    setErrors(next);
    if (Object.keys(next).length) return;
    setApiError("");
    try {
      await mutation.mutateAsync(configFromDraft(draft));
      showSuccessToast("Regularization configuration saved");
    } catch (err) {
      setApiError(err instanceof ApiError ? err.message : "Could not save the configuration.");
    }
  };

  const card = (title: string, limitKey: "monthlyLimit" | "monthlyLeaveLimit", windowKey: "attendanceWindowDays" | "leaveWindowDays") => (
    <div className="flex flex-col gap-3 rounded-[8px] border border-[#dde3eb] p-3 md:p-4">
      <h3 className="m-0 text-[13px] leading-5 font-semibold text-wz-heading">{title}</h3>
      <p className="m-0 text-[11px] leading-[17px] font-semibold text-wz-primary">{limitSummary(draft[limitKey], draft[windowKey])}</p>
      <Field label="Monthly request limit (optional)" htmlFor={`reg-${limitKey}`} error={errors[limitKey]}>
        <Input id={`reg-${limitKey}`} inputMode="numeric" value={draft[limitKey]} placeholder="Unlimited" onChange={(e) => set(limitKey)(e.target.value)} />
      </Field>
      <Field label="Submission window (required)" htmlFor={`reg-${windowKey}`} error={errors[windowKey]}>
        <Input id={`reg-${windowKey}`} inputMode="numeric" value={draft[windowKey]} placeholder="Days" onChange={(e) => set(windowKey)(e.target.value)} />
      </Field>
      <p className="m-0 text-[11px] leading-[17px] text-wz-text-secondary">
        Monthly limit can be left blank for unlimited (up to {maxLimit} requests).
      </p>
    </div>
  );

  return (
    <RegPanel
      title="Regularization configuration"
      sub="Set monthly request limits and required submission windows for attendance and leave regularization."
    >
      <div className="flex flex-col gap-2 rounded-[8px] border border-[#c9daf0] bg-[#eaf1fa] p-3 text-wz-primary">
        <p className="m-0 text-[13px] leading-5 font-semibold">How limits and windows work</p>
        <p className="m-0 text-[11px] leading-[17px]">
          Monthly limits count active (Pending and Approved) requests within the current month. The submission window strictly
          defines how many past calendar days an employee is permitted to regularize.
        </p>
      </div>
      <div className="grid grid-cols-2 gap-4 max-md:grid-cols-1">
        {card("Attendance regularization", "monthlyLimit", "attendanceWindowDays")}
        {card("Leave regularization", "monthlyLeaveLimit", "leaveWindowDays")}
      </div>
      <p className="m-0 text-[11px] leading-[17px] text-wz-text-secondary">
        Monthly limits reset on the 1st of every month. {month} allows up to {maxLimit}.
      </p>
      {apiError ? (
        <p className="m-0 text-sm text-wz-error" role="alert">
          {apiError}
        </p>
      ) : null}
      <Button size="lg" className="self-start max-md:w-full" disabled={!dirty || mutation.isPending} onClick={() => void save()}>
        {mutation.isPending ? "Saving…" : "Save configuration"}
      </Button>
    </RegPanel>
  );
}
