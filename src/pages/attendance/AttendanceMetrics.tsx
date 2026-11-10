import { cn } from "../../design-system";
import type { OrgMetricCard } from "./attendanceViewModel";

export type AttendanceMetricsProps = {
  metrics: OrgMetricCard[];
  className?: string;
};

export default function AttendanceMetrics({
  metrics,
  className,
}: AttendanceMetricsProps) {
  return (
    <div
      className={cn(
        "grid grid-cols-1 gap-wz-3 sm:grid-cols-2 xl:grid-cols-5",
        className,
      )}
    >
      {metrics.map((m) => (
        <div
          key={m.key}
          className={cn(
            "rounded-wz-xl border border-wz-border border-l-4 bg-white px-wz-4 py-wz-4",
            m.accent,
          )}
        >
          <p className="m-0 text-xs font-semibold text-wz-text-secondary">
            {m.label}
          </p>
          <p className="m-0 mt-1 text-2xl font-bold text-wz-text-primary">
            {m.value}
          </p>
          <p className="m-0 mt-1 text-[11px] text-wz-text-secondary">{m.hint}</p>
        </div>
      ))}
    </div>
  );
}
