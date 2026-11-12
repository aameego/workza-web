import { CalendarDays } from "lucide-react";
import { FilterSelect } from "./FilterSelect";
import { monthIndex, monthOptions } from "./monthOptions";

export type MonthSelectProps = {
  year: number;
  /** 1–12 */
  month: number;
  /** Months to move by (negative = earlier), so callers keep a simple shift handler. */
  onShift: (delta: number) => void;
  "aria-label"?: string;
};

/** Figma page-header month dropdown ("Dropdown-2"): label + 12px calendar icon. */
export function MonthSelect({ year, month, onShift, ...rest }: MonthSelectProps) {
  const selected = monthIndex(year, month);
  return (
    <FilterSelect
      aria-label={rest["aria-label"] ?? "Select month"}
      value={selected}
      onChange={(e) => onShift(Number(e.target.value) - selected)}
      icon={<CalendarDays size={12} aria-hidden className="shrink-0" />}
    >
      {monthOptions(year, month).map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </FilterSelect>
  );
}
