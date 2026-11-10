import { useMemo, useState } from "react";
import { Camera, Clock, LogIn, LogOut, MapPin, X } from "lucide-react";
import { Badge, Button, cn } from "../../design-system";
import type {
  AttendanceDayEntry,
  AttendanceSession,
} from "../../services/attendanceService";
import { resolveAttendanceSelfieUrl } from "./attendanceSelfieUrl";

export type AttendanceDayDetailProps = {
  day: number;
  monthLabel: string;
  holidayName?: string | null;
  weekOff?: boolean;
  entries: AttendanceDayEntry[];
  onClose: () => void;
};

const statusBadge = (
  status?: string,
): "success" | "error" | "warning" | "blue" | "info" | "neutral" => {
  const s = String(status || "");
  if (s === "Present") return "success";
  if (s === "Absent") return "error";
  if (s === "Late") return "warning";
  if (s === "Half Day") return "blue";
  if (s === "Leave" || s === "WFH") return "info";
  return "neutral";
};

function LocationLink({
  location,
  prefix,
}: {
  location?: AttendanceSession["checkInLocation"];
  prefix: string;
}) {
  if (!location?.mapsUrl) return null;
  const status =
    location.checkInStatus || location.checkOutStatus || null;
  return (
    <a
      href={location.mapsUrl}
      target="_blank"
      rel="noreferrer"
      className="inline-flex items-center gap-1.5 rounded-wz-md border border-wz-border bg-white px-2.5 py-1.5 text-xs font-semibold text-wz-primary no-underline hover:bg-wz-neutral-50"
    >
      <MapPin size={14} aria-hidden />
      {prefix}
      {status ? ` · ${status}` : ""}
    </a>
  );
}

function SessionTimeline({
  sessions,
  totalHours,
  onViewSelfie,
}: {
  sessions: AttendanceSession[];
  totalHours?: string | number | null;
  onViewSelfie: (url: string, title: string) => void;
}) {
  if (!sessions.length) {
    return (
      <div className="flex flex-col items-center gap-2 py-wz-6 text-wz-text-secondary">
        <Clock size={28} strokeWidth={1.5} aria-hidden />
        <p className="m-0 text-sm">No sessions recorded.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-wz-4">
      {sessions.map((session, index) => (
        <article
          key={session.sessionNumber || index}
          className={cn(
            "rounded-wz-lg border border-wz-border bg-white p-wz-4",
            session.isOpen && "border-wz-primary/40",
          )}
        >
          <div className="mb-wz-3 flex items-center justify-between gap-2">
            <span className="text-sm font-semibold text-wz-text-primary">
              Session {session.sessionNumber || index + 1}
            </span>
            {session.isOpen ? (
              <Badge status="success" size="sm">
                Live
              </Badge>
            ) : (
              <span className="text-xs font-semibold text-wz-text-secondary">
                {session.hours || "—"}
              </span>
            )}
          </div>

          <div className="grid grid-cols-2 gap-wz-3">
            <div className="flex items-start gap-2">
              <LogIn size={15} className="mt-0.5 text-[#12b76a]" aria-hidden />
              <div>
                <p className="m-0 text-[11px] text-wz-text-secondary">Check in</p>
                <p className="m-0 text-sm font-semibold text-wz-text-primary">
                  {session.checkIn || "—"}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <LogOut size={15} className="mt-0.5 text-wz-error" aria-hidden />
              <div>
                <p className="m-0 text-[11px] text-wz-text-secondary">Check out</p>
                <p className="m-0 text-sm font-semibold text-wz-text-primary">
                  {session.isOpen ? "—" : session.checkOut || "—"}
                </p>
              </div>
            </div>
          </div>

          <div className="mt-wz-3 flex flex-wrap gap-2">
            {session.checkInSelfieUrl ? (
              <button
                type="button"
                className="inline-flex cursor-pointer items-center gap-1.5 rounded-wz-md border border-wz-border bg-white px-2.5 py-1.5 text-xs font-semibold text-wz-text-primary hover:bg-wz-neutral-50"
                onClick={() => {
                  const url = resolveAttendanceSelfieUrl(
                    session.checkInSelfieUrl,
                  );
                  if (url) {
                    onViewSelfie(
                      url,
                      `Session ${session.sessionNumber || index + 1} — Check-In Selfie`,
                    );
                  }
                }}
              >
                <Camera size={14} aria-hidden />
                In Selfie
              </button>
            ) : null}
            <LocationLink location={session.checkInLocation} prefix="Check-in" />
            {session.checkOutSelfieUrl ? (
              <button
                type="button"
                className="inline-flex cursor-pointer items-center gap-1.5 rounded-wz-md border border-wz-border bg-white px-2.5 py-1.5 text-xs font-semibold text-wz-text-primary hover:bg-wz-neutral-50"
                onClick={() => {
                  const url = resolveAttendanceSelfieUrl(
                    session.checkOutSelfieUrl,
                  );
                  if (url) {
                    onViewSelfie(
                      url,
                      `Session ${session.sessionNumber || index + 1} — Check-Out Selfie`,
                    );
                  }
                }}
              >
                <Camera size={14} aria-hidden />
                Out Selfie
              </button>
            ) : null}
            {!session.isOpen ? (
              <LocationLink
                location={session.checkOutLocation}
                prefix="Check-out"
              />
            ) : null}
          </div>
        </article>
      ))}

      {totalHours && totalHours !== "-" ? (
        <div className="flex items-center justify-between rounded-wz-md bg-wz-neutral-50 px-wz-4 py-wz-3 text-sm">
          <span className="text-wz-text-secondary">Total worked</span>
          <strong className="text-wz-text-primary">{totalHours}</strong>
        </div>
      ) : null}
    </div>
  );
}

export default function AttendanceDayDetail({
  day,
  monthLabel,
  holidayName,
  weekOff,
  entries,
  onClose,
}: AttendanceDayDetailProps) {
  const [selfie, setSelfie] = useState<{ url: string; title: string } | null>(
    null,
  );

  const primary = entries[0];
  const sessions = useMemo(() => {
    const list = primary?.sessions;
    return Array.isArray(list) ? list : [];
  }, [primary]);

  const emptyCopy = holidayName
    ? `Holiday — ${holidayName}`
    : weekOff
      ? "Week off — no attendance expected."
      : entries.length === 0
        ? "No attendance records for this day."
        : null;

  return (
    <section className="overflow-hidden rounded-wz-xl border border-wz-border bg-white">
      <div className="flex items-start justify-between gap-wz-3 border-b border-wz-border px-wz-5 py-wz-4">
        <div>
          <h2 className="m-0 text-base font-semibold text-[#0a1f4a]">
            {day} {monthLabel}
          </h2>
          <p className="m-0 mt-1 text-xs text-wz-text-secondary">
            Click the same day again to clear selection.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {primary?.status ? (
            <Badge status={statusBadge(primary.status)} size="sm">
              {primary.status}
            </Badge>
          ) : null}
          <button
            type="button"
            className="inline-flex size-8 cursor-pointer items-center justify-center rounded-wz-md border border-wz-border bg-white text-wz-text-secondary hover:bg-wz-neutral-50"
            aria-label="Close day detail"
            onClick={onClose}
          >
            <X size={16} />
          </button>
        </div>
      </div>

      <div className="px-wz-5 py-wz-4">
        {emptyCopy && !sessions.length ? (
          <p className="m-0 text-sm text-wz-text-secondary">{emptyCopy}</p>
        ) : (
          <>
            <div className="mb-wz-4 grid grid-cols-2 gap-wz-3 sm:grid-cols-4">
              <div>
                <p className="m-0 text-[11px] text-wz-text-secondary">Check in</p>
                <p className="m-0 text-sm font-semibold text-wz-text-primary">
                  {primary?.checkIn || "—"}
                </p>
              </div>
              <div>
                <p className="m-0 text-[11px] text-wz-text-secondary">Check out</p>
                <p className="m-0 text-sm font-semibold text-wz-text-primary">
                  {primary?.checkOut || "—"}
                </p>
              </div>
              <div>
                <p className="m-0 text-[11px] text-wz-text-secondary">Hours</p>
                <p className="m-0 text-sm font-semibold text-wz-text-primary">
                  {primary?.hours ?? "—"}
                </p>
              </div>
              <div>
                <p className="m-0 text-[11px] text-wz-text-secondary">
                  Leave / notes
                </p>
                <p className="m-0 text-sm font-semibold text-wz-text-primary">
                  {primary?.leaveLabel ||
                    primary?.leaveType ||
                    primary?.notes ||
                    "—"}
                </p>
              </div>
            </div>

            <h3 className="mb-wz-3 mt-0 text-sm font-semibold text-wz-text-primary">
              Sessions ({primary?.sessionCount ?? sessions.length})
            </h3>
            <SessionTimeline
              sessions={sessions}
              totalHours={primary?.hours}
              onViewSelfie={(url, title) => setSelfie({ url, title })}
            />
          </>
        )}
      </div>

      {selfie ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          role="dialog"
          aria-modal="true"
          aria-label={selfie.title}
          onClick={() => setSelfie(null)}
        >
          <div
            className="w-full max-w-lg overflow-hidden rounded-wz-xl bg-white shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-wz-border px-wz-4 py-wz-3">
              <p className="m-0 text-sm font-semibold text-wz-text-primary">
                {selfie.title}
              </p>
              <Button
                type="button"
                variant="secondary"
                onClick={() => setSelfie(null)}
              >
                Close
              </Button>
            </div>
            <div className="bg-wz-neutral-900 p-wz-4">
              <img
                src={selfie.url}
                alt={selfie.title}
                className="mx-auto max-h-[70vh] w-auto max-w-full rounded-wz-md object-contain"
              />
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
