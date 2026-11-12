import type { ReactNode } from "react";
import { cn } from "../../design-system";
import AttendanceCalendar from "./AttendanceCalendar";
import {
  dayCellClass,
  dayLook,
  dayNumberClass,
} from "./attendanceCalendarStyle";
import type { OrgCalendarCell } from "./attendanceViewModel";

export type AttendanceOrgCalendarProps = {
  monthLabel: string;
  cells: OrgCalendarCell[];
  onPrev: () => void;
  onNext: () => void;
  onSelectDay: (day: number) => void;
  subtitle?: string;
  /** Optional control beside month chevrons (kept for manager variants). */
  toolbar?: ReactNode;
};

/** Figma organisation legend has no Compensatory Off. */
const ORG_LEGEND = [
  "Present",
  "Absent",
  "Late",
  "Half Day",
  "WFH",
  "Leave",
  "Holiday",
  "Week Off",
] as const;

/**
 * Figma attendance-admin calendar (1:16935): days with attendance show "● 48"
 * present employees (6px dot, 14px semibold green) on the present tint; the
 * selected day is #eef4ff with a primary outline.
 */
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
    <AttendanceCalendar
      title={`${monthLabel} ${subtitle}`}
      legend={ORG_LEGEND}
      arrowHeight={48}
      toolbar={toolbar}
      onPrev={onPrev}
      onNext={onNext}
      cells={cells}
      renderDay={(cell) => {
        const label = cell.holidayName || (cell.weekOff ? "Week Off" : null);
        const look =
          cell.presentCount > 0 && !label
            ? dayLook("present", null)
            : dayLook(cell.status, label, cell.weekOff, Boolean(cell.holidayName));
        return (
          <button
            key={cell.key}
            type="button"
            onClick={() => onSelectDay(cell.day)}
            aria-pressed={cell.isSelected}
            aria-label={`Day ${cell.day}${label ? `, ${label}` : ""}${cell.presentCount > 0 ? `, ${cell.presentCount} present` : ""}`}
            className={cn(
              dayCellClass,
              cell.isSelected ? "bg-[#eef4ff] ring-1 ring-wz-primary ring-inset" : look.bg,
            )}
          >
            <span className={dayNumberClass(cell.isSelected || cell.isToday)}>
              {cell.day}
            </span>
            {label ? (
              <span
                className={cn(
                  "mt-[6px] truncate pr-[11px] text-center text-[10px] leading-6 font-semibold",
                  look.text,
                )}
                title={label}
              >
                {label}
              </span>
            ) : cell.presentCount > 0 ? (
              <span className="mt-[6px] inline-flex items-center justify-center gap-[5px] pr-[11px] text-sm leading-6 font-semibold text-[#12b76a]">
                <span className="size-1.5 rounded-wz-full bg-[#12b76a]" />
                {cell.presentCount}
              </span>
            ) : null}
          </button>
        );
      }}
    />
  );
}
