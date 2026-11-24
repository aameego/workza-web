import { useState } from "react";
import { Card, showSuccessToast } from "../../../design-system";
import { ApiError } from "../../../lib/apiClient";
import {
  useAiSettings,
  useAttendanceSettings,
  useUpdateAiSettings,
  useUpdateAttendanceSettings,
} from "../../../hooks/useConfiguration";
import { Toggle } from "./Toggle";

const usd = (value: number) => `$${Number(value || 0).toFixed(2)}`;

const HELP = {
  autoMark:
    "Runs every day at 11:30 PM (India time). Only employees with no attendance for that day are marked present. Days already marked — checked in, absent, leave, WFH or half day — are never changed. Week-offs, holidays and approved leave are skipped, as are employees who have not joined yet or have left.",
  personalData:
    "Turns on Import from Word and Fill answers from a note. These send a letter's text or a pasted note, which can include names and salaries, to the AI provider. Drafting, rewriting and checking templates never send employee details and work with this off.",
};

export function ConfigurationTab() {
  const attendance = useAttendanceSettings();
  const updateAttendance = useUpdateAttendanceSettings();
  const ai = useAiSettings();
  const updateAi = useUpdateAiSettings();

  // Optimistic overrides while a mutation is in flight.
  const [attendanceOverride, setAttendanceOverride] = useState<boolean | null>(null);
  const [aiOverride, setAiOverride] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);

  const errorText = (err: unknown, fallback: string) =>
    err instanceof ApiError ? err.message : fallback;

  const handleAttendanceChange = async (checked: boolean) => {
    setError(null);
    setAttendanceOverride(checked);
    try {
      await updateAttendance.mutateAsync({ autoMarkAttendance: checked });
    } catch (err) {
      setError(errorText(err, "Could not save attendance settings."));
      showSuccessToast("Could not save attendance settings.");
    } finally {
      setAttendanceOverride(null);
    }
  };

  const handleAiChange = async (checked: boolean) => {
    setError(null);
    setAiOverride(checked);
    try {
      await updateAi.mutateAsync(checked);
    } catch (err) {
      setError(errorText(err, "Could not save AI settings."));
      showSuccessToast("Could not save AI settings.");
    } finally {
      setAiOverride(null);
    }
  };

  const isLoading =
    attendance.isLoading || attendance.isFetching || ai.isLoading || ai.isFetching;

  return (
    <div className="flex flex-col gap-wz-6">
      {error ? (
        <p className="m-0 rounded-wz-md bg-[#fef3f2] px-3 py-2 text-sm text-[#b42318]" role="alert">
          {error}
        </p>
      ) : null}

      {/* Attendance */}
      <Card className="space-y-wz-5">
        <div>
          <h2 className="m-0 text-base font-semibold text-wz-heading">Attendance</h2>
          <p className="m-0 mt-0.5 text-sm text-wz-text-muted">
            Organisation-wide attendance automation.
          </p>
        </div>

        {attendance.isError ? (
          <p className="m-0 text-sm text-wz-error">
            Could not load attendance settings. Refresh the page to try again.
          </p>
        ) : isLoading && !attendance.data ? (
          <p className="m-0 text-sm text-wz-text-muted">
            Loading attendance settings…
          </p>
        ) : (
          <div className="rounded-wz-lg bg-wz-hover p-wz-4">
            <Toggle
              label="Mark employees present automatically every day"
              checked={
                attendanceOverride ?? attendance.data?.autoMarkAttendance ?? false
              }
              onChange={handleAttendanceChange}
              disabled={updateAttendance.isPending || attendanceOverride !== null}
              helpId="auto-mark-help"
            />
            <div id="auto-mark-help" className="mt-2 flex flex-col gap-1 pl-[52px] text-xs text-wz-text-muted">
              <p className="m-0">Runs every day at 11:30 PM (India time).</p>
              <p className="m-0">{HELP.autoMark}</p>
            </div>
          </div>
        )}
      </Card>

      {/* AI help */}
      <Card className="space-y-wz-5">
        <div>
          <h2 className="m-0 text-base font-semibold text-wz-heading">AI help</h2>
          <p className="m-0 mt-0.5 text-sm text-wz-text-muted">
            AI drafts and checks letters for HR to review. Nothing is saved or
            issued without a person.
          </p>
        </div>

        {ai.isError ? (
          <p className="m-0 text-sm text-wz-error">
            Could not load AI settings. Refresh the page to try again.
          </p>
        ) : isLoading && !ai.data ? (
          <p className="m-0 text-sm text-wz-text-muted">Loading AI settings…</p>
        ) : ai.data?.enabled === false ? (
          <p className="m-0 text-sm text-wz-text-muted">
            AI help is not switched on for your organization. Contact Workza
            support to turn it on.
          </p>
        ) : (
          <>
            <div className="rounded-wz-lg bg-wz-hover p-wz-4">
              <div className="flex items-center justify-between gap-wz-4">
                <span className="text-sm font-semibold text-wz-heading">
                  Used this month
                </span>
                <strong className="text-sm text-wz-heading">
                  {usd(ai.data?.usedThisMonthUsd ?? 0)} of{" "}
                  {usd(ai.data?.monthlyBudgetUsd ?? 20)}
                </strong>
              </div>
              <p className="m-0 mt-1 text-xs text-wz-text-muted">
                The allowance resets on the 1st of each month.
              </p>
            </div>

            <div className="rounded-wz-lg bg-wz-hover p-wz-4">
              <Toggle
                label="Allow AI features that use personal details"
                checked={aiOverride ?? ai.data?.personalData ?? false}
                onChange={handleAiChange}
                disabled={updateAi.isPending || aiOverride !== null}
                helpId="ai-personal-data-help"
              />
              <div
                id="ai-personal-data-help"
                className="mt-2 flex flex-col gap-1 pl-[52px] text-xs text-wz-text-muted"
              >
                <p className="m-0">{HELP.personalData}</p>
              </div>
            </div>
          </>
        )}
      </Card>
    </div>
  );
}
