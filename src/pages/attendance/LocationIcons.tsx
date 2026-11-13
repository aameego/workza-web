import { useState } from "react";
import { Eye, MapPin } from "lucide-react";
import { Modal } from "../../design-system";
import { resolveAttendanceSelfieUrl } from "../employees/attendanceSelfieUrl";

/**
 * Figma table location cell: 12px pin (opens the map) + eye (opens the
 * "Employee Attendance Selfie" popup), 6 apart; "-" when neither is known.
 */
export default function LocationIcons({
  url,
  selfieUrl,
}: {
  url?: string | null;
  selfieUrl?: string | null;
}) {
  const [open, setOpen] = useState(false);
  const selfie = resolveAttendanceSelfieUrl(selfieUrl);
  if (!url && !selfie) return <>-</>;
  return (
    <span className="inline-flex items-center gap-1.5 text-wz-heading">
      {url ? (
        <a
          href={url}
          target="_blank"
          rel="noreferrer"
          className="inline-flex text-wz-heading hover:text-wz-primary"
          aria-label="Open location on map"
        >
          <MapPin size={12} aria-hidden />
        </a>
      ) : null}
      {selfie ? (
        <button
          type="button"
          className="inline-flex cursor-pointer border-0 bg-transparent p-0 text-wz-heading hover:text-wz-primary"
          aria-label="View attendance selfie"
          onClick={() => setOpen(true)}
        >
          <Eye size={12} aria-hidden />
        </button>
      ) : null}
      {open && selfie ? (
        <Modal open title="Employee Attendance Selfie" onClose={() => setOpen(false)}>
          <img
            src={selfie}
            alt="Attendance selfie"
            className="mx-auto block max-h-[60vh] max-w-full rounded-wz-md object-contain"
          />
        </Modal>
      ) : null}
    </span>
  );
}
