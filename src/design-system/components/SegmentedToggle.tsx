import { cn } from "../cn";

export type SegmentedToggleProps<T extends string> = {
  label: string;
  value: T;
  options: readonly (readonly [T, string])[];
  onChange: (value: T) => void;
  disabled?: boolean;
  /** Label 6px above the track (Figma leave sheets 173:49912) instead of 10 (attendance 173:50150). */
  tight?: boolean;
};

/**
 * Figma form segmented switch (Leave | WFH, Day level | Month level): label
 * then a 38px #f1f4f8 track; the active half is white with primary text.
 */
export function SegmentedToggle<T extends string>({
  label,
  value,
  options,
  onChange,
  disabled,
  tight = false,
}: SegmentedToggleProps<T>) {
  return (
    <div className="flex min-w-0 flex-col gap-1.5">
      <span className="text-[13px] leading-[18px] font-semibold text-wz-heading">{label}</span>
      <div
        role="radiogroup"
        aria-label={label}
        className={cn(
          "grid h-[38px] auto-cols-fr grid-flow-col rounded-wz-md border border-[#e5e9ef] bg-[#f1f4f8] p-0.5 max-md:rounded-[6px] max-md:border-0",
          tight ? "mt-0" : "mt-1",
        )}
      >
        {options.map(([v, text]) => (
          <button
            key={v}
            type="button"
            role="radio"
            aria-checked={value === v}
            disabled={disabled}
            onClick={() => onChange(v)}
            className={cn(
              "cursor-pointer rounded-wz-sm border-0 text-[13px] font-semibold disabled:cursor-not-allowed max-md:rounded-[4px] max-md:font-bold",
              value === v
                ? "bg-white text-wz-primary shadow-[0_1px_2px_rgba(15,23,42,0.06)]"
                : "bg-transparent text-wz-text-muted max-md:text-[#7f8ea3]",
            )}
          >
            {text}
          </button>
        ))}
      </div>
    </div>
  );
}
