import { useEffect, useState } from "react";
import { Button, Field, Input } from "../../design-system";
import type { LeaveBalanceRow } from "../../services/leaveService";
import { getLeaveTypeLabel } from "./leaveViewModel";
import SearchableEmployeeSelect from "../attendance/SearchableEmployeeSelect";

export type LeaveBalancePanelProps = {
  mode: "self" | "manage";
  title?: string;
  rows: LeaveBalanceRow[];
  employeeId?: string;
  onEmployeeChange?: (id: string) => void;
  onSave?: (
    payload: Partial<
      Record<"CL" | "SL" | "EL" | "CO" | "WFH", { total: number; used: number }>
    >,
  ) => Promise<void> | void;
  saving?: boolean;
  error?: string | null;
};

export default function LeaveBalancePanel({
  mode,
  title,
  rows,
  employeeId = "",
  onEmployeeChange,
  onSave,
  saving,
  error,
}: LeaveBalancePanelProps) {
  const [draft, setDraft] = useState<
    Array<{ type: string; total: string; used: string; remaining: number }>
  >([]);

  useEffect(() => {
    setDraft(
      (rows || []).map((r) => ({
        type: r.type,
        total: String(r.total ?? 0),
        used: String(r.used ?? 0),
        remaining: Number(r.remaining ?? Math.max(0, (r.total || 0) - (r.used || 0))),
      })),
    );
  }, [rows]);

  const heading =
    title ||
    (mode === "manage" ? "Manage Leave Balances" : "My Leave Balance");

  return (
    <section className="rounded-wz-xl border border-wz-border bg-white p-wz-5">
      <div className="mb-wz-3 flex flex-wrap items-center justify-between gap-2">
        <h2 className="m-0 text-base font-semibold text-wz-text-primary">
          {heading}
        </h2>
        {mode === "manage" ? (
          <Button
            type="button"
            variant="primary"
            size="sm"
            disabled={saving || !employeeId}
            onClick={() => {
              const payload: Partial<
                Record<
                  "CL" | "SL" | "EL" | "CO" | "WFH",
                  { total: number; used: number }
                >
              > = {};
              draft.forEach((d) => {
                const code = String(d.type || "").toUpperCase();
                if (!["CL", "SL", "EL", "CO", "WFH"].includes(code)) return;
                payload[code as "CL" | "SL" | "EL" | "CO" | "WFH"] = {
                  total: Number(d.total) || 0,
                  used: Number(d.used) || 0,
                };
              });
              void onSave?.(payload);
            }}
          >
            {saving ? "Saving…" : "Save Balance"}
          </Button>
        ) : null}
      </div>

      {mode === "manage" ? (
        <Field label="Employee Name" className="mb-wz-4">
          <SearchableEmployeeSelect
            value={employeeId}
            onChange={(id) => onEmployeeChange?.(id)}
            placeholder="Select employee"
          />
        </Field>
      ) : null}

      {error ? (
        <p className="m-0 mb-wz-3 text-sm text-wz-error" role="alert">
          {error}
        </p>
      ) : null}

      {draft.length === 0 ? (
        <p className="m-0 text-sm text-wz-text-secondary">
          {mode === "manage"
            ? "Select an employee to view balances."
            : "No leave balances available."}
        </p>
      ) : mode === "self" ? (
        <ul className="m-0 list-none space-y-2 p-0">
          {draft.map((row) => (
            <li
              key={row.type}
              className="flex items-center justify-between gap-3 border-b border-wz-border py-2 text-sm last:border-0"
            >
              <span className="font-medium text-wz-text-primary">
                {getLeaveTypeLabel(row.type)}
              </span>
              <span className="font-semibold text-wz-text-secondary">
                {row.remaining}/{row.total}
              </span>
            </li>
          ))}
        </ul>
      ) : (
        <div className="space-y-3">
          {draft.map((row, idx) => (
            <div
              key={row.type}
              className="grid grid-cols-1 gap-2 rounded-wz-md border border-wz-border p-3 sm:grid-cols-4"
            >
              <p className="m-0 self-center text-sm font-semibold text-wz-text-primary sm:col-span-1">
                {getLeaveTypeLabel(row.type)}
              </p>
              <Field label="Total">
                <Input
                  type="number"
                  min={0}
                  step="0.5"
                  value={row.total}
                  onChange={(e) => {
                    const total = e.target.value;
                    setDraft((prev) =>
                      prev.map((p, i) =>
                        i === idx
                          ? {
                              ...p,
                              total,
                              remaining: Math.max(
                                0,
                                (Number(total) || 0) - (Number(p.used) || 0),
                              ),
                            }
                          : p,
                      ),
                    );
                  }}
                />
              </Field>
              <Field label="Used">
                <Input
                  type="number"
                  min={0}
                  step="0.5"
                  value={row.used}
                  onChange={(e) => {
                    const used = e.target.value;
                    setDraft((prev) =>
                      prev.map((p, i) =>
                        i === idx
                          ? {
                              ...p,
                              used,
                              remaining: Math.max(
                                0,
                                (Number(p.total) || 0) - (Number(used) || 0),
                              ),
                            }
                          : p,
                      ),
                    );
                  }}
                />
              </Field>
              <Field label="Remaining">
                <Input type="number" value={String(row.remaining)} disabled />
              </Field>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
