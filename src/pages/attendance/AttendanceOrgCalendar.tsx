import type { ReactNode } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "../../design-system";
import { WEEKDAYS } from "../employees/attendanceCalendar";
import {
  CALENDAR_LEGEND,
  type OrgCalendarCell,
} from "./attendanceViewModel";

export type AttendanceOrgCalendarProps = {
  monthLabel: string;
  cells: OrgCalendarCell[];
  onPrev: () => void;
  onNext: () => void;
  onSelectDay: (day: number) => void;
  subtitle?: string;
  /** Optional employee filter control (org calendar). */
  toolbar?: ReactNode;
};

export default function AttendanceOrgCalendar({
  monthLabel,
  cells,
  onPrev,
  onNext,
  onSelectDay,
  subtitle = "(Organisation)",
  toolbar,
}: AttendanceOrgCalendarProps) {
  return (
    <section className="rounded-wz-xl border border-wz-border bg-white p-wz-5">
      <div className="mb-wz-4 flex flex-wrap items-center justify-between gap-wz-3">
        <h2 className="m-0 text-base font-semibold text-wz-text-primary">
          {monthLabel}{" "}
          <span className="font-normal text-wz-text-secondary">{subtitle}</span>
        </h2>
        <div className="flex flex-wrap items-center gap-2">
          {toolbar}
          <button
            type="button"
            className="inline-flex size-8 cursor-pointer items-center justify-center rounded-wz-md border border-wz-border bg-white text-wz-text-secondary hover:bg-wz-neutral-50"
            aria-label="Previous month"
            onClick={onPrev}
          >
            <ChevronLeft className="size-4" />
          </button>
          <button
            type="button"
            className="inline-flex size-8 cursor-pointer items-center justify-center rounded-wz-md border border-wz-border bg-white text-wz-text-secondary hover:bg-wz-neutral-50"
            aria-label="Next month"
            onClick={onNext}
          >
            <ChevronRight className="size-4" />
          </button>
        </div>
      </div>

      <div className="mb-2 grid grid-cols-7 gap-1 text-center text-[11px] font-semibold uppercase tracking-wide text-wz-text-secondary">
        {WEEKDAYS.map((d) => (
          <span key={d}>{d}</span>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {cells.map((cell) =>
          cell.empty ? (
            <div key={cell.key} className="min-h-[64px]" />
          ) : (
            <button
              key={cell.key}
              type="button"
              onClick={() => onSelectDay(cell.day)}
              className={cn(
                "flex min-h-[64px] cursor-pointer flex-col items-start rounded-wz-lg border px-2 py-1.5 text-left transition-colors",
                cell.isSelected
                  ? "border-wz-primary bg-wz-hover"
                  : "border-wz-border bg-white hover:border-wz-primary/40",
                cell.isToday && !cell.isSelected ? "ring-1 ring-wz-primary/30" : "",
              )}
            >
              <span className="text-xs font-semibold text-wz-text-primary">
                {cell.day}
              </span>
              {cell.holidayName ? (
                <span className="mt-auto truncate text-[10px] font-medium text-[#5925dc]">
                  {cell.holidayName}
                </span>
              ) : cell.weekOff ? (
                <span className="mt-auto text-[10px] text-wz-text-secondary">
                  Week Off
                </span>
              ) : cell.presentCount > 0 ? (
                <span className="mt-auto inline-flex items-center gap-1 text-[10px] font-semibold text-[#027a48]">
                  <span className="size-1.5 rounded-full bg-[#12b76a]" />
                  {cell.presentCount}
                </span>
              ) : null}
            </button>
          ),
        )}
      </div>

      <div className="mt-wz-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-[11px] text-wz-text-secondary">
        {CALENDAR_LEGEND.map((item) => (
          <span key={item.key} className="inline-flex items-center gap-1.5">
            <span className={cn("size-2 rounded-full", item.className)} />
            {item.label}
          </span>
        ))}
      </div>
    </section>
  );
}
