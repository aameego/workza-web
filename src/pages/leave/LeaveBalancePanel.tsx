import { Check } from "lucide-react";
import { useEffect, useState } from "react";
import { Avatar, Badge, Input } from "../../design-system";
import type { LeaveBalanceRow } from "../../services/leaveService";
import SearchableEmployeeSelect from "../attendance/SearchableEmployeeSelect";
import { balanceDraftError, getLeaveTypeLabel } from "./leaveViewModel";

export type LeaveBalanceEmployeeMeta = {
  name?: string;
  employeeCode?: string;
  designation?: string;
  status?: string;
  employmentType?: string;
};

export type LeaveBalancePanelProps = {
  mode: "self" | "manage";
  title?: string;
  rows: LeaveBalanceRow[];
  employeeId?: string;
  employeeMeta?: LeaveBalanceEmployeeMeta | null;
  onEmployeeChange?: (id: string) => void;
  onSave?: (
    payload: Partial<
      Record<"CL" | "SL" | "EL" | "CO" | "WFH", { total: number; used: number }>
    >,
  ) => Promise<void> | void;
  saving?: boolean;
  /** Last save succeeded; the button reads "Saved" until the next edit. */
  saved?: boolean;
  error?: string | null;
};

const BALANCE_ORDER = ["CL", "SL", "EL", "CO", "WFH"] as const;

const initialsFrom = (name?: string) =>
  (name || "?")
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

const toDraftRows = (
  rows: LeaveBalanceRow[],
  mode: "self" | "manage",
): Array<{ type: string; total: string; used: string; remaining: number }> => {
  const byType = new Map(
    (rows || []).map((r) => [String(r.type || "").toUpperCase(), r]),
  );

  const source: LeaveBalanceRow[] =
    mode === "manage"
      ? BALANCE_ORDER.map(
          (code) =>
            byType.get(code) || {
              type: code,
              total: 0,
              used: 0,
              remaining: 0,
            },
        )
      : BALANCE_ORDER.map((code) => byType.get(code)).filter(
          (r): r is LeaveBalanceRow => Boolean(r),
        );

  return source.map((r) => ({
    type: String(r.type || "").toUpperCase(),
    total: String(r.total ?? 0),
    used: String(r.used ?? 0),
    remaining: Number(
      r.remaining ??
        Math.max(0, (Number(r.total) || 0) - (Number(r.used) || 0)),
    ),
  }));
};

export default function LeaveBalancePanel({
  mode,
  title,
  rows,
  employeeId = "",
  employeeMeta,
  onEmployeeChange,
  onSave,
  saving,
  saved,
  error,
}: LeaveBalancePanelProps) {
  const [dirty, setDirty] = useState(false);
  const [draft, setDraft] = useState(() => toDraftRows(rows, mode));

  useEffect(() => {
    setDraft(toDraftRows(rows, mode));
  }, [rows, mode]);

  const draftError = mode === "manage" && employeeId ? balanceDraftError(draft) : "";

  const heading =
    title || (mode === "manage" ? "Manage Leave Balances" : "My Leave Balance");

  const buildPayload = () => {
    const payload: Partial<
      Record<"CL" | "SL" | "EL" | "CO" | "WFH", { total: number; used: number }>
    > = {};
    draft.forEach((d) => {
      const code = String(d.type || "").toUpperCase();
      if (!["CL", "SL", "EL", "CO", "WFH"].includes(code)) return;
      payload[code as "CL" | "SL" | "EL" | "CO" | "WFH"] = {
        total: Number(d.total) || 0,
        used: Number(d.used) || 0,
      };
    });
    return payload;
  };

  return (
    <section className="rounded-xl border border-[#dee2e6] bg-white p-4 shadow-[0px_2px_8px_0px_rgba(0,0,0,0.03)] max-md:rounded-lg max-md:shadow-none">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2 max-md:mb-3 max-md:border-b max-md:border-[rgba(222,226,230,0.5)] max-md:pb-2">
        <h2 className="m-0 text-sm leading-5 font-bold text-[#0a1f4a]">
          {heading}
        </h2>
        {mode === "manage" ? (
          <button
            type="button"
            className="inline-flex cursor-pointer items-center gap-1.5 border-0 bg-transparent p-0 text-[13px] font-semibold max-md:text-xs max-md:leading-4 text-[#1f5da3] disabled:cursor-not-allowed disabled:opacity-45"
            disabled={saving || !employeeId || Boolean(draftError)}
            onClick={() => {
              setDirty(false);
              void onSave?.(buildPayload());
            }}
          >
            <Check size={12} aria-hidden />
            {saving ? "Saving…" : saved && !dirty ? "Saved" : "Save Balance"}
          </button>
        ) : null}
      </div>

      {mode === "manage" ? (
        <div className="mb-4 grid grid-cols-2 items-end gap-3 max-md:mb-3 max-md:flex max-md:items-center max-md:gap-6">
          {/* Figma: "Employee Name *" label above the picker */}
          <div className="flex min-w-0 flex-col gap-1.5 max-md:flex-1 max-md:gap-1">
            <span className="text-[13px] leading-[18px] font-semibold text-wz-heading max-md:text-[10px] max-md:leading-3">
              Employee Name
              <span className="ml-1 text-wz-error" aria-hidden>
                *
              </span>
            </span>
            <SearchableEmployeeSelect
              value={employeeId}
              onChange={(id) => onEmployeeChange?.(id)}
              placeholder="Select employee"
              className="max-md:[&>button]:min-h-[26px] max-md:[&>button]:rounded-[4px] max-md:[&>button]:px-2 max-md:[&>button]:py-1.5 max-md:[&>button]:text-[10px] max-md:[&>button]:leading-3 max-md:[&>button>span]:text-[10px] max-md:[&>button>span]:leading-3"
            />
          </div>
          {employeeId && employeeMeta?.name ? (
            <div className="flex min-w-0 items-center gap-2.5 max-md:shrink-0 max-md:gap-1.5">
              <Avatar
                initials={initialsFrom(employeeMeta.name)}
                size="md"
                className="size-[30px] bg-[#1f5da3] text-[12px] max-md:text-[10px]"
              />
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-1.5 max-md:gap-2">
                  <p className="m-0 truncate text-sm font-semibold text-[#0a1f4a] max-md:text-xs">
                    {employeeMeta.name}
                  </p>
                  {employeeMeta.status ? (
                    <Badge
                      status={
                        String(employeeMeta.status).toLowerCase() === "active"
                          ? "success"
                          : "neutral"
                      }
                      size="sm"
                    >
                      {employeeMeta.status}
                    </Badge>
                  ) : null}
                  {employeeMeta.employmentType ? (
                    <Badge status="info" size="sm" className="max-md:hidden">
                      {employeeMeta.employmentType}
                    </Badge>
                  ) : null}
                </div>
                <p className="m-0 truncate text-[10px] text-wz-text-secondary max-md:mt-1 max-md:text-[8px] max-md:leading-[normal]">
                  {/* Figma mobile shows the designation only */}
                  <span className="max-md:hidden">
                    {employeeMeta.employeeCode || "-"}
                    {employeeMeta.designation ? " · " : ""}
                  </span>
                  {employeeMeta.designation || ""}
                </p>
              </div>
            </div>
          ) : (
            <div className="flex items-center text-sm text-wz-text-secondary">
              Select an employee to edit balances
            </div>
          )}
        </div>
      ) : null}

      {error || draftError ? (
        <p className="m-0 mb-3 text-sm text-wz-error" role="alert">
          {draftError || error}
        </p>
      ) : null}

      {mode === "self" ? (
        draft.length === 0 ? (
          <p className="m-0 text-sm text-wz-text-secondary">
            No leave balances available.
          </p>
        ) : (
          <ul className="m-0 mt-[5px] flex list-none flex-col gap-[13px] p-0 max-md:mt-0 max-md:gap-4">
            {draft.map((row) => {
              const total = Number(row.total) || 0;
              const display =
                String(row.type).toUpperCase() === "CO" && total === 0
                  ? String(row.remaining)
                  : `${row.remaining}/${total}`;
              return (
                <li
                  key={row.type}
                  className="flex h-5 items-start justify-between gap-3 border-b border-[#f1f3f5] text-[10px] leading-[14px] font-semibold text-[#0a1f4a] last:border-b-0 max-md:h-auto max-md:border-b-0 max-md:text-xs"
                >
                  <span>{getLeaveTypeLabel(row.type)}</span>
                  <span className="max-md:w-[46px] max-md:shrink-0">
                    {display}
                  </span>
                </li>
              );
            })}
          </ul>
        )
      ) : !employeeId ? (
        <p className="m-0 text-sm text-wz-text-secondary">
          Select an employee to view balances.
        </p>
      ) : (
        <div className="space-y-3 max-md:[--bal-h:20px]">
          <div className="grid grid-cols-[1fr_50px_50px_50px] gap-4 text-[10px] font-semibold tracking-wide text-wz-text-secondary uppercase max-md:hidden">
            <span />
            <span className="text-center">Total</span>
            <span className="text-center">Used</span>
            <span className="text-center">Remaining</span>
          </div>
          {draft.map((row, idx) => (
            <div
              key={row.type}
              className="grid grid-cols-[1fr_50px_50px_50px] items-center gap-4 max-md:border-t-[0.67px] max-md:border-[#f2f5fa] max-md:pt-1.5"
            >
              <p className="m-0 text-[11px] leading-[14px] font-semibold text-[#0a1f4a] max-md:text-[10px]">
                {getLeaveTypeLabel(row.type)}
              </p>
              <label className="flex flex-col gap-0.5">
                <span className="hidden text-[6px] leading-2 font-semibold text-[#0a1f4a] uppercase max-md:block">
                  Total
                </span>
                <Input
                  type="number"
                  min={0}
                  step="0.5"
                  aria-label={`${row.type} total`}
                  className="text-center text-xs max-md:rounded-[4px] max-md:text-[8px] [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                  style={{
                    height: "var(--bal-h, 30px)",
                    minHeight: "var(--bal-h, 30px)",
                    paddingLeft: 4,
                    paddingRight: 4,
                    paddingTop: 0,
                    paddingBottom: 0,
                  }}
                  value={row.total}
                  onChange={(e) => {
                    const total = e.target.value;
                    setDirty(true);
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
              </label>
              <label className="flex flex-col gap-0.5">
                <span className="hidden text-[6px] leading-2 font-semibold text-[#0a1f4a] uppercase max-md:block">
                  Used
                </span>
                <Input
                  type="number"
                  min={0}
                  step="0.5"
                  aria-label={`${row.type} used`}
                  className="text-center text-xs max-md:rounded-[4px] max-md:text-[8px] [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                  style={{
                    height: "var(--bal-h, 30px)",
                    minHeight: "var(--bal-h, 30px)",
                    paddingLeft: 4,
                    paddingRight: 4,
                    paddingTop: 0,
                    paddingBottom: 0,
                  }}
                  value={row.used}
                  disabled={row.type === "WFH"}
                  title={row.type === "WFH" ? "Counted from approved WFH requests" : undefined}
                  onChange={(e) => {
                    const used = e.target.value;
                    setDirty(true);
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
              </label>
              <label className="flex flex-col gap-0.5">
                <span className="hidden text-[6px] leading-2 font-semibold text-[#0a1f4a] uppercase max-md:block">
                  Remaining
                </span>
                <Input
                  type="number"
                  aria-label={`${row.type} remaining`}
                  className="text-center text-xs max-md:rounded-[4px] max-md:text-[8px] [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                  style={{
                    height: "var(--bal-h, 30px)",
                    minHeight: "var(--bal-h, 30px)",
                    paddingLeft: 4,
                    paddingRight: 4,
                    paddingTop: 0,
                    paddingBottom: 0,
                  }}
                  value={String(row.remaining)}
                  disabled
                />
              </label>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
