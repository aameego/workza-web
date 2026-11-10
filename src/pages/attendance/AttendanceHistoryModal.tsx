import { Badge, Button, Modal, cn } from "../../design-system";
import type { NormalizedAttendanceRow } from "./attendanceViewModel";
import { ATTENDANCE_STATUS_COLORS } from "./attendanceViewModel";

export type AttendanceHistoryModalProps = {
  open: boolean;
  onClose: () => void;
  row: NormalizedAttendanceRow | null;
};

export default function AttendanceHistoryModal({
  open,
  onClose,
  row,
}: AttendanceHistoryModalProps) {
  const colors =
    ATTENDANCE_STATUS_COLORS[row?.status || ""] ||
    ATTENDANCE_STATUS_COLORS["Not Marked"];
  const sessions = row?.sessions || [];

  return (
    <Modal
      open={open}
      title={row ? `Attendance — ${row.name}` : "Attendance history"}
      onClose={onClose}
      size="lg"
      footer={
        <Button type="button" variant="secondary" onClick={onClose}>
          Close
        </Button>
      }
    >
      {!row ? (
        <p className="m-0 text-sm text-wz-text-secondary">No record selected.</p>
      ) : (
        <div className="space-y-wz-4">
          <div className="flex flex-wrap items-center gap-wz-3">
            <Badge className={cn(colors?.bg, colors?.text)}>
              {row.status || "—"}
            </Badge>
            <span className="text-sm text-wz-text-secondary">
              {row.date || "—"} · {row.employeeCode}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-wz-3 text-sm sm:grid-cols-4">
            <div>
              <p className="m-0 text-xs text-wz-text-secondary">Check In</p>
              <p className="m-0 font-semibold text-wz-text-primary">
                {row.checkIn || "—"}
              </p>
            </div>
            <div>
              <p className="m-0 text-xs text-wz-text-secondary">Check Out</p>
              <p className="m-0 font-semibold text-wz-text-primary">
                {row.checkOut || "—"}
              </p>
            </div>
            <div>
              <p className="m-0 text-xs text-wz-text-secondary">Hours</p>
              <p className="m-0 font-semibold text-wz-text-primary">
                {row.hours || "—"}
              </p>
            </div>
            <div>
              <p className="m-0 text-xs text-wz-text-secondary">Sessions</p>
              <p className="m-0 font-semibold text-wz-text-primary">
                {row.sessionCount ?? sessions.length ?? 0}
              </p>
            </div>
          </div>

          {row.notes || row.reason ? (
            <p className="m-0 rounded-wz-md bg-wz-neutral-50 px-wz-3 py-wz-2 text-sm text-wz-text-secondary">
              {row.notes || row.reason}
            </p>
          ) : null}

          {sessions.length > 0 ? (
            <div>
              <h3 className="m-0 mb-2 text-sm font-semibold text-wz-text-primary">
                Session history
              </h3>
              <ul className="m-0 list-none space-y-2 p-0">
                {sessions.map((s, idx) => (
                  <li
                    key={`${s.sessionNumber ?? idx}-${s.checkIn || ""}`}
                    className="rounded-wz-md border border-wz-border px-wz-3 py-wz-2 text-sm"
                  >
                    <span className="font-semibold text-wz-text-primary">
                      Session {s.sessionNumber ?? idx + 1}
                    </span>
                    <span className="text-wz-text-secondary">
                      {" "}
                      · In {s.checkIn || "—"} · Out {s.checkOut || "—"}
                      {s.hours ? ` · ${s.hours}` : ""}
                      {s.isOpen ? " (open)" : ""}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <p className="m-0 text-sm text-wz-text-secondary">
              No session history for this day.
            </p>
          )}
        </div>
      )}
    </Modal>
  );
}
