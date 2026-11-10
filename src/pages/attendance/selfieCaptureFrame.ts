/**
 * Front-camera frames are often shown mirrored (bathroom-mirror style).
 * Attendance selfies should look like a normal photo (how others see you),
 * so we flip horizontally when drawing the frame used for upload + review.
 */
export const drawUnmirroredSelfieFrame = (
  video: HTMLVideoElement,
): HTMLCanvasElement | null => {
  const width = video.videoWidth || 640;
  const height = video.videoHeight || 480;
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;

  // Flip horizontally so the stored selfie is not a mirror image.
  ctx.translate(width, 0);
  ctx.scale(-1, 1);
  ctx.drawImage(video, 0, 0, width, height);
  return canvas;
};

export const canvasToJpegBlob = (
  canvas: HTMLCanvasElement,
  quality = 0.9,
): Promise<Blob | null> =>
  new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob), "image/jpeg", quality);
  });
