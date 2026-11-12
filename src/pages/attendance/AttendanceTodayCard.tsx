import { Clock, LogIn, LogOut, MapPin, Timer, Users } from "lucide-react";
import { cn } from "../../design-system";
import { resolveAttendanceSelfieUrl } from "../employees/attendanceSelfieUrl";
import { formatHistoryTime } from "./attendanceHistory";
import type { NormalizedAttendanceRow } from "./attendanceViewModel";

export type AttendanceTodayCardProps = {
  today: Date;
  row: NormalizedAttendanceRow | null;
  loading: boolean;
  onCheck: (mode: "checkin" | "checkout") => void;
};

const Pill = ({ children, tone }: { children: string; tone: "glass" | "mint" }) => (
  <span
    className={cn(
      "inline-flex h-[26px] items-center gap-1.5 rounded-wz-full px-2.5 text-[11px] leading-[14px] font-semibold whitespace-nowrap",
      tone === "glass"
        ? "border border-white/25 bg-white/15 text-white"
        : "bg-[#d9f6f1] text-[#0e9384]",
    )}
  >
    <span className="size-1.5 rounded-wz-full bg-[#4ee0c0]" />
    {children}
  </span>
);

const minutesLabel = (mins?: number) =>
  mins && mins > 0 ? `${Math.floor(mins / 60)}h ${mins % 60}m` : "-";

/**
 * Figma attendance-employee "Today's Check In / Out" (1:17630): navy→teal
 * header, four stat tiles, centred check in/out, then the selfie + location bar.
 */
export default function AttendanceTodayCard({ today, row, loading, onCheck }: AttendanceTodayCardProps) {
  const sessions = row?.sessions || [];
  const first = sessions[0];
  const last = sessions[sessions.length - 1];
  const checkedIn = Boolean(row?.isCheckedIn);
  const worked =
    row?.workedMinutes ?? sessions.reduce((sum, s) => sum + (s.minutes || 0), 0);
  const selfie = resolveAttendanceSelfieUrl(last?.checkInSelfieUrl);
  const loc = last?.checkInLocation;
  const coords =
    loc?.latitude != null && loc?.longitude != null
      ? `${loc.latitude.toFixed(6)}, ${loc.longitude.toFixed(6)}`
      : null;
  const dateLabel = today
    .toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" })
    .replace(/^(\w+)/, "$1,")
    .toUpperCase();

  const stats = [
    [LogIn, "First In", formatHistoryTime(first?.checkIn || row?.checkIn)],
    [LogOut, "Last Out", checkedIn ? "-" : formatHistoryTime(last?.checkOut || row?.checkOut)],
    [Timer, "Total Hours", minutesLabel(worked)],
    [Users, "Sessions", String(row?.sessionCount ?? (sessions.length || "-"))],
  ] as const;

  const btn =
    "inline-flex h-[30px] w-[100px] cursor-pointer items-center justify-center gap-1.5 rounded-wz-sm border-0 text-[11px] leading-[14px] font-semibold disabled:cursor-not-allowed";

  return (
    <section className="overflow-hidden rounded-wz-xl border border-wz-border bg-white">
      <div className="flex min-h-[91px] items-center justify-between gap-4 bg-[linear-gradient(90deg,#0f2f66_0%,#1f5da3_55%,#13889e_100%)] px-5 py-4">
        <div className="flex flex-col">
          <span className="text-[10px] leading-[13px] font-bold tracking-[0.6px] text-[#80bab9]">{dateLabel}</span>
          <h2 className="m-0 mt-1 text-base leading-[22px] font-bold text-white">Today&apos;s Check In / Out</h2>
          <p className="m-0 mt-1 text-xs leading-4 text-white/60">
            Selfie and location are required for check-in and check-out.
          </p>
        </div>
        {row ? <Pill tone="glass">{checkedIn ? "Checked in" : "Checked out"}</Pill> : null}
      </div>

      <div className="flex flex-col gap-3.5 px-5 pt-4 pb-4">
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {stats.map(([Icon, label, value]) => (
            <div key={label} className="flex h-[57px] flex-col justify-center gap-1 rounded-wz-md border border-[#eef1f5] bg-[#f7f9fc] px-3">
              <span className="inline-flex items-center gap-1 text-[9px] leading-[11px] font-bold tracking-[0.5px] text-wz-text-muted uppercase">
                <Icon size={10} aria-hidden />
                {label}
              </span>
              <span className="text-sm leading-[18px] font-bold text-wz-heading">{loading ? "…" : value}</span>
            </div>
          ))}
        </div>

        <div className="flex justify-center gap-3">
          <button
            type="button"
            className={cn(btn, checkedIn || loading ? "bg-[#ebeff3] text-[#b6bec9]" : "bg-wz-primary text-white")}
            disabled={checkedIn || loading}
            onClick={() => onCheck("checkin")}
          >
            <LogIn size={12} aria-hidden />
            Check in
          </button>
          <button
            type="button"
            className={cn(btn, !checkedIn || loading ? "bg-[#ebeff3] text-[#b6bec9]" : "bg-wz-primary text-white")}
            disabled={!checkedIn || loading}
            onClick={() => onCheck("checkout")}
          >
            <LogOut size={12} aria-hidden />
            Check out
          </button>
        </div>

        {last ? (
          <div className="flex min-h-[88px] items-start justify-between gap-4 rounded-wz-md bg-[#f5f8fc] px-3.5 py-2.5">
            <div className="flex gap-6">
              <div className="flex flex-col gap-2">
                <span className="text-[9px] leading-[11px] font-bold tracking-[0.5px] text-wz-text-muted uppercase">Check-in Selfie</span>
                {selfie ? (
                  <img src={selfie} alt="Check-in selfie" className="size-[46px] rounded-wz-sm object-cover" />
                ) : (
                  <span className="text-sm text-wz-text-muted">-</span>
                )}
              </div>
              <div className="flex flex-col gap-2">
                <span className="text-[9px] leading-[11px] font-bold tracking-[0.5px] text-wz-text-muted uppercase">Check-in Location</span>
                {coords ? (
                  <a
                    href={loc?.mapsUrl || undefined}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 text-[11px] leading-[14px] text-wz-heading no-underline hover:underline"
                  >
                    <MapPin size={12} className="text-[#13a99a]" aria-hidden />
                    {loc?.checkInStatus ? `${loc.checkInStatus} · ` : ""}
                    {coords}
                  </a>
                ) : (
                  <span className="inline-flex items-center gap-1.5 text-[11px] text-wz-text-muted">
                    <Clock size={12} aria-hidden /> No location captured
                  </span>
                )}
              </div>
            </div>
            <Pill tone="mint">{last.isOpen ? "Active" : "Closed"}</Pill>
          </div>
        ) : null}
      </div>
    </section>
  );
}
