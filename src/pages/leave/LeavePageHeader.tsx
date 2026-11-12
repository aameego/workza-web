import { ChevronRight } from "lucide-react";
import { MonthSelect } from "../../design-system";

export type LeavePageHeaderProps = {
  year: number;
  month: number;
  onShiftMonth: (delta: number) => void;
  onViewPolicy?: () => void;
  showPolicy?: boolean;
  leading?: React.ReactNode;
};

export default function LeavePageHeader({
  year,
  month,
  onShiftMonth,
  onViewPolicy,
  showPolicy = true,
  leading,
}: LeavePageHeaderProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="flex flex-wrap items-center gap-2">{leading}</div>
      <div className="flex flex-wrap items-center justify-end gap-3">
        {showPolicy && onViewPolicy ? (
          /* Figma "Dropdown-2" face: 40px white box, #dee2e6 border, 13px muted text, 12px chevron 6 after */
          <button
            type="button"
            className="inline-flex h-10 cursor-pointer items-center gap-1.5 rounded-wz-md border border-wz-border bg-white px-3 text-[13px] leading-[normal] text-wz-text-muted hover:border-wz-neutral-400"
            onClick={onViewPolicy}
          >
            View Leave Policy
            <ChevronRight size={12} aria-hidden />
          </button>
        ) : null}
        <MonthSelect year={year} month={month} onShift={onShiftMonth} />
      </div>
    </div>
  );
}
