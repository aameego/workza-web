import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { ChevronRight, X } from "lucide-react";
import { Badge, cn } from "../../design-system";
import { useEmployee } from "../../hooks/useEmployees";
import { getAttendanceRegularizations } from "../../services/attendanceService";
import { EmployeeModalCard } from "../employees/EmployeeActionModals";
import { initialsFromName, managerDisplayName } from "../employees/employeeViewFormat";
import { buildHistoryEvents, formatDayLabel, formatHistoryTime } from "./attendanceHistory";
import { employeeIdFromRow, toDateInputValue } from "./attendanceEditHelpers";
import type { NormalizedAttendanceRow } from "./attendanceViewModel";

export type AttendanceHistoryModalProps = {
  open: boolean;
  onClose: () => void;
  row: NormalizedAttendanceRow | null;
};

const ValueBox = ({ label, value, tone }: { label: string; value: string; tone: "prev" | "next" | "plain" }) => (
  <div
    className={cn(
      "min-w-0 flex-1 rounded-wz-sm px-1.5 py-1",
      tone === "prev" ? "bg-[#fff3f4]" : "bg-[#ecf9f4]",
    )}
  >
    <p
      className={cn(
        "m-0 text-[7px] leading-[10px] font-semibold uppercase",
        tone === "prev" ? "text-[#b58c92]" : "text-[#5f9e8a]",
      )}
    >
      {label}
    </p>
    <p
      className={cn(
        "m-0 mt-0.5 truncate text-[10px] leading-3 font-bold",
        tone === "prev" ? "text-[#b42318]" : "text-[#027a48]",
      )}
    >
      {value}
    </p>
  </div>
);

/** Figma "Histroy Track - Attendance" (1:24099): 450px right drawer with a change timeline. */
export default function AttendanceHistoryModal({ open, onClose, row }: AttendanceHistoryModalProps) {
  const employeeId = row ? employeeIdFromRow(row) : "";
  const date = row ? toDateInputValue(row.date) : "";
  const { data: employee } = useEmployee(employeeId || undefined, open && Boolean(employeeId));
  const history = useQuery({
    queryKey: ["attendance-regularizations"],
    queryFn: getAttendanceRegularizations,
    enabled: open && Boolean(row),
  });

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open || !row) return null;

  const firstSession = row.sessions?.[0];
  const events = buildHistoryEvents(history.data || [], employeeId, date, {
    checkIn: firstSession?.checkIn || row.checkIn,
    checkOut: firstSession?.checkOut || row.checkOut,
    name: row.name,
  });
  const dash = (v: string) => v.replace("—", "-");
  const dateLabel = date
    ? formatDayLabel(new Date(`${date}T00:00:00`))
    : "-";

  return (
    <div
      className="fixed inset-0 z-80 flex justify-end bg-[rgba(15,23,42,0.45)]"
      role="presentation"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <aside
        role="dialog"
        aria-modal="true"
        aria-labelledby="att-history-title"
        className="flex h-full w-full max-w-[450px] flex-col bg-white shadow-[0_20px_50px_rgba(15,23,42,0.18)]"
      >
        <div className="flex items-center justify-between gap-wz-3 border-b border-wz-border px-wz-6 py-wz-4">
          <h2 id="att-history-title" className="m-0 text-xl leading-[25px] font-bold text-wz-heading">
            Attendance - History
          </h2>
          <button
            type="button"
            className="inline-flex size-6 shrink-0 cursor-pointer items-center justify-center rounded-wz-sm border border-wz-border bg-wz-neutral-50 p-0 text-wz-heading hover:bg-wz-neutral-100"
            aria-label="Close"
            onClick={onClose}
          >
            <X size={12} strokeWidth={2.5} />
          </button>
        </div>

        <div className="flex flex-1 flex-col gap-wz-6 overflow-auto px-wz-6 pt-wz-4 pb-wz-6">
          <div className="flex flex-col gap-4 border-b border-wz-border pb-[7px]">
            <EmployeeModalCard
              employee={{
                _id: employeeId,
                isActive: true,
                ...employee,
                name: employee?.name || row.name,
                employeeCode: employee?.employeeCode || row.employeeCode,
              }}
            />
            <div className="flex justify-between gap-6">
              {(
                [
                  ["Reporting Manager", employee?.managerId, "text-left"],
                  ["People Manager", employee?.peopleManagerId, "text-right"],
                ] as const
              ).map(([label, mgr, align]) => (
                <div key={label} className={cn("min-w-0", align)}>
                  <p className="m-0 text-xs leading-[15px] font-semibold tracking-[0.04em] text-wz-text-muted uppercase">
                    {label}
                  </p>
                  <p className="m-0 mt-1 truncate text-sm leading-[18px] font-bold text-wz-heading">
                    {employee ? dash(managerDisplayName(mgr)) : "-"}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            {(
              [
                ["Attendance Date", dateLabel],
                ["Check In", formatHistoryTime(row.checkIn)],
                ["Check Out", row.isCheckedIn ? "-" : formatHistoryTime(row.checkOut)],
              ] as const
            ).map(([label, value]) => (
              <div key={label} className="flex h-[49px] flex-col justify-center rounded-wz-md border border-wz-border px-3">
                <p className="m-0 text-[9px] leading-3 font-semibold text-wz-text-muted uppercase">{label}</p>
                <p className="m-0 mt-1 text-sm leading-[18px] font-bold text-wz-heading">{value}</p>
              </div>
            ))}
          </div>

          <section className="flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-wz-border pb-[7px]">
              <h3 className="m-0 text-[15px] leading-[18px] font-semibold text-wz-heading">Change timeline</h3>
              <span className="text-[11px] leading-[14px] text-wz-text-muted">
                {history.isLoading ? "Loading…" : `${events.length} event${events.length === 1 ? "" : "s"} · newest first`}
              </span>
            </div>

            {!history.isLoading && events.length === 0 ? (
              <p className="m-0 text-sm text-wz-text-muted">No changes recorded for this day.</p>
            ) : null}

            <ol className="m-0 flex list-none flex-col gap-4 p-0">
              {events.map((ev, idx) => (
                <li key={ev.key} className="relative flex gap-3">
                  <span className="relative flex w-3 shrink-0 justify-center">
                    <span
                      className={cn(
                        "relative z-[1] mt-0 inline-flex size-3 items-center justify-center rounded-wz-full border border-wz-border bg-white",
                      )}
                    >
                      <span
                        className={cn(
                          "size-1.5 rounded-wz-full",
                          ev.kind === "marked" ? "bg-[#12b76a]" : "bg-wz-primary",
                        )}
                      />
                    </span>
                    {idx < events.length - 1 ? (
                      <span className="absolute top-3 bottom-[-16px] w-0.5 bg-[#eef0f2]" aria-hidden />
                    ) : null}
                  </span>
                  <div className="min-w-0 flex-1 rounded-wz-md border border-wz-border px-2 pt-1.5 pb-1.5">
                    <div className="flex items-center justify-between gap-2">
                      <p className="m-0 text-[13px] leading-4 font-bold text-wz-heading">{ev.title}</p>
                      {ev.kind === "marked" ? (
                        <Badge status="info" size="sm">
                          Self
                        </Badge>
                      ) : null}
                    </div>
                    <div className="mt-2 flex items-center gap-1">
                      {ev.kind === "marked" ? (
                        <>
                          <ValueBox label="Check In" value={ev.checkIn || "-"} tone="plain" />
                          <span className="w-2" />
                          <ValueBox label="Check Out" value={ev.checkOut || "-"} tone="plain" />
                        </>
                      ) : (
                        <>
                          <ValueBox label="Previous Value" value={ev.previous || "-"} tone="prev" />
                          <ChevronRight size={8} className="shrink-0 text-wz-text-muted" aria-hidden />
                          <ValueBox label="Updated Value" value={ev.updated || "-"} tone="next" />
                        </>
                      )}
                    </div>
                    <div className="mt-2 flex items-center gap-[3px] border-t border-wz-border pt-2">
                      <span className="inline-flex size-6 shrink-0 items-center justify-center rounded-wz-full bg-[#edf2fb] text-[10px] font-semibold text-wz-heading">
                        {initialsFromName(ev.by)}
                      </span>
                      <span className="min-w-0 flex-1 truncate text-[10px] leading-3 font-bold text-wz-heading">
                        {ev.by || "-"}
                      </span>
                      {ev.at ? (
                        <span className="text-[8px] leading-[10px] whitespace-nowrap text-wz-text-muted">{ev.at}</span>
                      ) : null}
                    </div>
                    {ev.reason ? (
                      <p className="m-0 mt-1 text-[11px] leading-[14px] text-wz-text-muted">
                        <span className="font-semibold text-wz-heading">Reason:</span> {ev.reason}
                      </p>
                    ) : null}
                  </div>
                </li>
              ))}
            </ol>
          </section>
        </div>
      </aside>
    </div>
  );
}
