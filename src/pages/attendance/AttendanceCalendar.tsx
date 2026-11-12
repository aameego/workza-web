import type { ReactNode } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "../../design-system";
import { WEEKDAYS, type OutsideCell } from "../employees/attendanceCalendar";
import { ATTENDANCE_LEGEND } from "./attendanceCalendarStyle";

export type AttendanceCalendarProps<C extends { key: string; empty?: false }> = {
  title: ReactNode;
  /** Legend labels to show (Figma's organisation view omits Compensatory Off). */
  legend?: readonly (typeof ATTENDANCE_LEGEND)[number]["label"][];
  onPrev: () => void;
  onNext: () => void;
  /** Arrow box height: 50 on the employee view, 48 on the organisation view. */
  arrowHeight?: 48 | 50;
  toolbar?: ReactNode;
  cells: Array<OutsideCell | C>;
  renderDay: (cell: C) => ReactNode;
};

/**
 * Header (18px bold title, 9px legend, 48px arrows) on the page, then the grid card
 * 16 below. Grid lines are the 1px gap over #e5eaf3, so cells need no borders.
 */
export default function AttendanceCalendar<C extends { key: string; empty?: false }>({
  title,
  legend,
  onPrev,
  onNext,
  arrowHeight = 50,
  toolbar,
  cells,
  renderDay,
}: AttendanceCalendarProps<C>) {
  const items = legend
    ? ATTENDANCE_LEGEND.filter((i) => legend.includes(i.label))
    : ATTENDANCE_LEGEND;
  return (
    <div className="flex flex-col gap-wz-4">
      <div className="flex flex-wrap items-start justify-between gap-wz-3">
        <div className="flex flex-col gap-1.5">
          <h2 className="m-0 text-lg leading-[23px] font-bold text-wz-heading">{title}</h2>
          <div className="flex flex-wrap gap-1.5">
            {items.map((item) => (
              <span
                key={item.label}
                className={cn(
                  "inline-flex h-[19px] items-center gap-[5px] px-2 text-[9px] leading-[normal] font-semibold",
                  item.text,
                )}
              >
                <span className={cn("size-2 rounded-wz-full", item.dot)} />
                {item.label}
              </span>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-wz-3">
          {toolbar}
          {(
            [
              ["Previous month", onPrev, ChevronLeft],
              ["Next month", onNext, ChevronRight],
            ] as const
          ).map(([aria, onClick, Icon]) => (
            <button
              key={aria}
              type="button"
              className={cn(
                "inline-flex w-12 cursor-pointer items-center justify-center rounded-wz-md border border-[#e5eaf3] bg-white text-wz-heading hover:bg-wz-neutral-50",
                arrowHeight === 48 ? "h-12" : "h-[50px]",
              )}
              aria-label={aria}
              onClick={onClick}
            >
              <Icon size={14} />
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-7 gap-px overflow-hidden rounded-wz-xl border border-[#e5eaf3] bg-[#e5eaf3]">
        {WEEKDAYS.map((day) => (
          <div
            key={day}
            className="flex h-[45px] items-center justify-center bg-[#eef2f7] text-[10px] font-semibold text-wz-text-muted uppercase"
          >
            {day}
          </div>
        ))}
        {cells.map((cell) =>
          cell.empty ? (
            <div
              key={cell.key}
              className="h-[59px] bg-white pt-[9px] pl-[11px] text-[11px] leading-[14px] font-semibold text-[#d3d6d8]"
              aria-hidden
            >
              {cell.outsideDay}
            </div>
          ) : (
            renderDay(cell)
          ),
        )}
      </div>
    </div>
  );
}
