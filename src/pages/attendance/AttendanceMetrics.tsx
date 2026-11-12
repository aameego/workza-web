import { cn } from "../../design-system";
import type { OrgMetricCard, OrgMetricHintTone } from "./attendanceViewModel";

export type AttendanceMetricsProps = {
  metrics: OrgMetricCard[];
  className?: string;
};

const hintToneClass: Record<OrgMetricHintTone, string> = {
  green: "bg-[#ecfdf5] text-[#12b76a]",
  red: "bg-[rgba(234,88,12,0.09)] text-[#d92d20]",
  amber: "bg-[#fffbeb] text-[#f79009]",
  blue: "bg-[#eef4ff] text-[#1f5da3]",
  purple: "bg-[rgba(138,56,245,0.08)] text-[#8a38f5]",
};

export default function AttendanceMetrics({
  metrics,
  className,
}: AttendanceMetricsProps) {
  return (
    <div
      className={cn(
        "grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5",
        className,
      )}
    >
      {metrics.map((m) => (
        <div
          key={m.key}
          className="flex flex-col gap-1 rounded-xl border border-[#dee2e6] bg-white p-4 shadow-[0px_2px_8px_0px_rgba(0,0,0,0.03)]"
        >
          <p className="m-0 text-[10px] leading-[14px] font-bold tracking-[0.8px] text-[#6c757d] uppercase">
            {m.label}
          </p>
          <p className="m-0 text-[28px] leading-[34px] font-bold tracking-[-0.5px] text-[#0a1f4a]">
            {m.value}
          </p>
          {m.hint ? (
            <span
              className={cn(
                "inline-flex w-fit rounded-[5px] px-[7px] py-[3px] text-[10px] leading-[13px] font-semibold whitespace-nowrap",
                hintToneClass[m.hintTone] || hintToneClass.blue,
              )}
            >
              {m.hint}
            </span>
          ) : null}
        </div>
      ))}
    </div>
  );
}
