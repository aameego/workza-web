export const cameraAccessErrorMessage = (err: unknown): string => {
  const name =
    err && typeof err === "object" && "name" in err
      ? String((err as { name?: string }).name)
      : "";
  if (name === "NotAllowedError") {
    return "Camera permission denied. Tap Allow camera and choose Allow. If the browser does not ask, enable Camera for this site in Settings.";
  }
  return "Unable to access camera. Please try again.";
};
