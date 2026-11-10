import { useState } from "react";
import { useCheckInOut } from "../../hooks/useAttendance";
import { ApiError } from "../../lib/apiClient";
import SelfieCaptureModal, {
  type SelfieCaptureResult,
} from "./SelfieCaptureModal";

export type AttendanceCheckInModalProps = {
  open: boolean;
  mode: "checkin" | "checkout";
  onClose: () => void;
};

export default function AttendanceCheckInModal({
  open,
  mode,
  onClose,
}: AttendanceCheckInModalProps) {
  const { checkIn, checkOut } = useCheckInOut("self");
  const [error, setError] = useState<string | null>(null);
  const pending = checkIn.isPending || checkOut.isPending;

  const handleClose = () => {
    if (pending) return;
    setError(null);
    onClose();
  };

  const handleCapture = async (payload: SelfieCaptureResult) => {
    setError(null);
    try {
      if (mode === "checkin") {
        await checkIn.mutateAsync({
          selfieFile: payload.blob,
          latitude: payload.location.latitude,
          longitude: payload.location.longitude,
          accuracy: payload.location.accuracy,
        });
      } else {
        await checkOut.mutateAsync({
          selfieFile: payload.blob,
          latitude: payload.location.latitude,
          longitude: payload.location.longitude,
          accuracy: payload.location.accuracy,
        });
      }
      setError(null);
      onClose();
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : "Unable to process attendance. Please try again.",
      );
    }
  };

  return (
    <SelfieCaptureModal
      open={open}
      mode={mode}
      submitting={pending}
      submitError={error}
      onClose={handleClose}
      onCapture={(payload) => void handleCapture(payload)}
    />
  );
}
