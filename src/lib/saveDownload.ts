const XLSX_MIME =
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

export const DOWNLOAD_FILE_TYPE = "DOWNLOAD_FILE";

type ReactNativeWebView = {
  postMessage: (message: string) => void;
};

declare global {
  interface Window {
    ReactNativeWebView?: ReactNativeWebView;
  }
}

export const isNativeWebViewDownload = (): boolean =>
  typeof window !== "undefined" &&
  typeof window.ReactNativeWebView?.postMessage === "function";

export const mimeTypeForFileName = (
  fileName: string,
  blobType = "",
): string => {
  if (blobType && blobType !== "application/octet-stream") return blobType;
  const lower = String(fileName || "").toLowerCase();
  if (lower.endsWith(".xlsx")) return XLSX_MIME;
  if (lower.endsWith(".xls")) return "application/vnd.ms-excel";
  if (lower.endsWith(".pdf")) return "application/pdf";
  if (lower.endsWith(".csv")) return "text/csv";
  return blobType || "application/octet-stream";
};

const blobToBase64 = (blob: Blob): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const dataUrl = String(reader.result || "");
      const comma = dataUrl.indexOf(",");
      resolve(comma >= 0 ? dataUrl.slice(comma + 1) : dataUrl);
    };
    reader.onerror = () =>
      reject(reader.error || new Error("Could not read the file"));
    reader.readAsDataURL(blob);
  });

const saveWithAnchor = (blob: Blob, fileName: string) => {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", fileName);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
  return { method: "anchor" as const };
};

/** Browser `<a download>` or Workza WebView native download bridge. */
export const saveDownload = async (
  blob: Blob,
  fileName: string,
  mimeType?: string,
): Promise<{ method: "anchor" | "native" }> => {
  const type = mimeTypeForFileName(fileName, mimeType || blob?.type);
  if (isNativeWebViewDownload()) {
    const base64 = await blobToBase64(blob);
    window.ReactNativeWebView!.postMessage(
      JSON.stringify({
        type: DOWNLOAD_FILE_TYPE,
        fileName,
        mimeType: type,
        base64,
      }),
    );
    return { method: "native" };
  }
  return saveWithAnchor(blob, fileName);
};

export const fileNameFromContentDisposition = (
  header: string | null | undefined,
  fallback: string,
): string => {
  if (!header) return fallback;
  const match = header.match(/filename\*?=(?:UTF-8''|")?([^";]+)"?/i);
  if (!match?.[1]) return fallback;
  try {
    return decodeURIComponent(match[1].trim());
  } catch {
    return match[1].trim();
  }
};
