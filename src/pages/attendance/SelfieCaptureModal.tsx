import { useCallback, useEffect, useRef, useState } from "react";
import { Camera, RotateCcw } from "lucide-react";
import { Button, Modal, cn } from "../../design-system";
import { cameraAccessErrorMessage } from "./selfieCaptureCopy";
import {
  canvasToJpegBlob,
  drawUnmirroredSelfieFrame,
} from "./selfieCaptureFrame";

export type SelfieCaptureLocation = {
  latitude: number;
  longitude: number;
  accuracy: number | null;
  timestamp?: number;
};

export type SelfieCaptureResult = {
  blob: Blob;
  location: SelfieCaptureLocation;
};

export type SelfieCaptureModalProps = {
  open: boolean;
  mode?: "checkin" | "checkout";
  submitting?: boolean;
  /** API / submit error from parent after capture. */
  submitError?: string | null;
  onClose: () => void;
  onCapture: (payload: SelfieCaptureResult) => void;
};

const readGeolocation = (): Promise<SelfieCaptureLocation> =>
  new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("Geolocation is not supported by your browser."));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) =>
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy ?? null,
          timestamp: position.timestamp,
        }),
      (err) => {
        let msg = "Unable to fetch current location.";
        if (err.code === err.PERMISSION_DENIED) {
          msg = "Location access denied. Please enable location permissions.";
        } else if (err.code === err.POSITION_UNAVAILABLE) {
          msg = "Location information is unavailable.";
        } else if (err.code === err.TIMEOUT) {
          msg = "Location request timed out. Please try again.";
        }
        reject(new Error(msg));
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 },
    );
  });

export default function SelfieCaptureModal({
  open,
  mode = "checkin",
  submitting = false,
  submitError = null,
  onClose,
  onCapture,
}: SelfieCaptureModalProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [capturedBlob, setCapturedBlob] = useState<Blob | null>(null);
  const [error, setError] = useState("");
  const [cameraReady, setCameraReady] = useState(false);
  const [fetchingLocation, setFetchingLocation] = useState(false);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) videoRef.current.srcObject = null;
    setCameraReady(false);
  }, []);

  const resetCapture = useCallback(() => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl("");
    setCapturedBlob(null);
  }, [previewUrl]);

  const startCamera = useCallback(async () => {
    setError("");
    if (!navigator.mediaDevices?.getUserMedia) {
      setError("Camera is not supported on this device or browser.");
      return;
    }
    try {
      stopCamera();
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "user",
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          void videoRef.current
            ?.play()
            .then(() => setCameraReady(true))
            .catch(() => setError("Unable to start camera preview."));
        };
      }
    } catch (err) {
      setCameraReady(false);
      setError(cameraAccessErrorMessage(err));
    }
  }, [stopCamera]);

  useEffect(() => {
    if (open) {
      void startCamera();
    } else {
      stopCamera();
      resetCapture();
      setError("");
    }
    return () => stopCamera();
  }, [open, startCamera, stopCamera, resetCapture]);

  useEffect(
    () => () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    },
    [previewUrl],
  );

  const handleCapture = () => {
    const video = videoRef.current;
    if (!video || !cameraReady) return;
    const canvas = drawUnmirroredSelfieFrame(video);
    if (!canvas) {
      setError("Failed to capture selfie. Please try again.");
      return;
    }
    void canvasToJpegBlob(canvas).then((blob) => {
      if (!blob) {
        setError("Failed to capture selfie. Please try again.");
        return;
      }
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      setCapturedBlob(blob);
      setPreviewUrl(URL.createObjectURL(blob));
      stopCamera();
    });
  };

  const handleConfirm = async () => {
    if (!capturedBlob || submitting || fetchingLocation) return;
    try {
      setError("");
      setFetchingLocation(true);
      const location = await readGeolocation();
      setFetchingLocation(false);
      onCapture({ blob: capturedBlob, location });
    } catch (locErr) {
      setFetchingLocation(false);
      setError(
        locErr instanceof Error
          ? locErr.message
          : "Failed to get current location.",
      );
    }
  };

  const isCheckout = mode === "checkout";
  const isProcessing = submitting || fetchingLocation;
  const confirmLabel = isProcessing
    ? fetchingLocation
      ? "Fetching location…"
      : isCheckout
        ? "Checking out…"
        : "Checking in…"
    : isCheckout
      ? "Confirm & Check Out"
      : "Confirm & Check In";

  return (
    <Modal
      open={open}
      title={isCheckout ? "Check out with selfie" : "Check in with selfie"}
      onClose={() => {
        if (isProcessing) return;
        onClose();
      }}
      footer={
        previewUrl ? (
          <>
            <Button
              type="button"
              variant="secondary"
              disabled={isProcessing}
              onClick={() => {
                resetCapture();
                void startCamera();
              }}
            >
              <RotateCcw className="size-4" aria-hidden />
              Retake
            </Button>
            <Button
              type="button"
              variant="primary"
              disabled={isProcessing}
              onClick={() => void handleConfirm()}
            >
              {confirmLabel}
            </Button>
          </>
        ) : (
          <>
            <Button
              type="button"
              variant="secondary"
              disabled={isProcessing}
              onClick={onClose}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="primary"
              disabled={isProcessing || (!cameraReady && !error)}
              onClick={() => {
                if (error && !cameraReady) void startCamera();
                else handleCapture();
              }}
            >
              <Camera className="size-4" aria-hidden />
              {error && !cameraReady ? "Allow camera" : "Capture Selfie"}
            </Button>
          </>
        )
      }
    >
      <div className="space-y-wz-3">
        <p className="m-0 text-sm text-wz-text-secondary">
          Take a clear photo of your face. Your current location will be
          captured live when you confirm.
        </p>
        {previewUrl ? (
          <img
            src={previewUrl}
            alt="Captured selfie preview"
            className="mx-auto max-h-[320px] w-full rounded-wz-lg object-cover"
          />
        ) : (
          <div className="relative overflow-hidden rounded-wz-lg bg-wz-neutral-900">
            {/*
              Front cameras often feel like a bathroom mirror. Flip the live
              preview the same way we flip the captured frame so what you see
              matches the unmirrored photo that gets uploaded.
            */}
            <video
              ref={videoRef}
              className={cn(
                "mx-auto max-h-[320px] w-full object-cover",
                "scale-x-[-1]",
              )}
              playsInline
              muted
            />
            {!cameraReady && !error ? (
              <span className="absolute inset-0 flex items-center justify-center text-sm text-white">
                Starting camera…
              </span>
            ) : null}
          </div>
        )}
        {error || submitError ? (
          <p className="m-0 text-sm text-wz-error" role="alert">
            {submitError || error}
          </p>
        ) : null}
      </div>
    </Modal>
  );
}
