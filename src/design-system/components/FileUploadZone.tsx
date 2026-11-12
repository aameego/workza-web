import { useRef, useState, type ReactNode } from "react";
import { Download, Trash2, Upload, X } from "lucide-react";
import { cn } from "../cn";

export type UploadState = {
  name: string;
  status: "uploading" | "done" | "error";
  /** Shown under the row (red on error, muted otherwise). */
  message?: string;
};

export type FileUploadZoneProps = {
  title: string;
  accept: string;
  hint: string;
  onFile: (file: File) => void;
  onClear: () => void;
  upload: UploadState | null;
  onDownloadTemplate?: () => void;
  templateBusy?: boolean;
  disabled?: boolean;
  /** Extra content under the file row (e.g. a result summary). */
  children?: ReactNode;
};

/**
 * Figma upload-group (Bulk Upload / Upload Documents): title + "Download
 * template" pill, 151px dashed drop area, then the Uploading / Uploaded /
 * error file row. Upload starts on pick or drop; there is no footer.
 */
export function FileUploadZone({
  title,
  accept,
  hint,
  onFile,
  onClear,
  upload,
  onDownloadTemplate,
  templateBusy,
  disabled,
  children,
}: FileUploadZoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const busy = disabled || upload?.status === "uploading";

  const take = (file?: File | null) => {
    if (file && !busy) onFile(file);
    if (inputRef.current) inputRef.current.value = "";
  };

  return (
    <div className="-mt-2 flex flex-col gap-wz-6">
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2.5">
          <h3 className="m-0 text-base leading-5 font-bold text-wz-heading">{title}</h3>
          {onDownloadTemplate ? (
            <button
              type="button"
              disabled={templateBusy}
              onClick={onDownloadTemplate}
              className="inline-flex h-6 cursor-pointer items-center gap-1 rounded-wz-sm border-0 bg-[#eef4ff] px-2 text-[11px] leading-[14px] font-semibold text-wz-primary disabled:cursor-wait disabled:opacity-60"
            >
              <Download size={12} aria-hidden />
              {templateBusy ? "Downloading…" : "Download template"}
            </button>
          ) : null}
        </div>

        <label
          className={cn(
            "relative flex h-[151px] cursor-pointer flex-col items-center rounded-wz-lg border border-dashed bg-white pt-[18px] text-center",
            dragging ? "border-wz-primary bg-[#f5f8fd]" : "border-[#d0d5dd]",
            busy && "cursor-not-allowed opacity-70",
          )}
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragging(false);
            take(e.dataTransfer.files?.[0]);
          }}
        >
          <input
            ref={inputRef}
            type="file"
            accept={accept}
            disabled={busy}
            className="sr-only"
            onChange={(e) => take(e.target.files?.[0])}
          />
          <Upload size={28} strokeWidth={1.75} className="text-wz-heading" aria-hidden />
          <span className="mt-[29px] text-[15px] leading-[18px] font-bold text-wz-heading">
            Drag &amp; drop files or{" "}
            <span className="text-wz-primary underline underline-offset-2">Browse</span>
          </span>
          <span className="mt-[17px] text-[13px] leading-[18px] text-wz-text-muted">{hint}</span>
        </label>
      </div>

      {upload ? (
        <div className="flex flex-col gap-2">
          <span className="text-[13px] leading-[18px] font-semibold text-wz-heading">
            {upload.status === "uploading" ? "Uploading 1/1 files" : "Uploaded"}
          </span>
          <div
            className={cn(
              "relative flex h-10 items-center justify-between gap-3 rounded-wz-md border bg-white px-3",
              upload.status === "done"
                ? "border-[#12b76a]"
                : upload.status === "error"
                  ? "border-wz-danger"
                  : "border-wz-border",
            )}
          >
            <span className="min-w-0 truncate text-sm leading-[18px] text-wz-text-muted">{upload.name}</span>
            {upload.status === "uploading" ? (
              <>
                <span className="absolute bottom-1.5 left-3 h-[3px] w-[45%] animate-pulse rounded-full bg-wz-primary" />
                <span className="inline-flex size-[18px] shrink-0 items-center justify-center rounded-wz-full bg-wz-neutral-100 text-wz-text-muted">
                  <X size={10} aria-hidden />
                </span>
              </>
            ) : (
              <button
                type="button"
                aria-label="Remove file"
                onClick={onClear}
                className="inline-flex size-[18px] shrink-0 cursor-pointer items-center justify-center rounded-wz-sm border-0 bg-[#fff3f3] p-0 text-wz-danger"
              >
                <Trash2 size={11} aria-hidden />
              </button>
            )}
          </div>
          {upload.message ? (
            <p
              className={cn(
                "m-0 text-xs leading-4 whitespace-pre-line",
                upload.status === "error" ? "text-[#b42318]" : "text-wz-text-muted",
              )}
              role={upload.status === "error" ? "alert" : "status"}
            >
              {upload.message}
            </p>
          ) : null}
        </div>
      ) : null}
      {children}
    </div>
  );
}
