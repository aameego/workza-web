import { useRef } from "react";
import { Upload, Building } from "lucide-react";
import { cn } from "../../../design-system";

export interface OrganizationLogoUploadProps {
  previewUrl: string;
  isPending: boolean;
  onUpload: (file: File) => void;
}

export function OrganizationLogoUpload({
  previewUrl,
  isPending,
  onUpload,
}: OrganizationLogoUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const pickFile = () => {
    inputRef.current?.click();
  };

  const handleChange = () => {
    const file = inputRef.current?.files?.[0];
    if (file) onUpload(file);
    inputRef.current!.value = "";
  };

  return (
    <div className="flex flex-wrap items-center gap-wz-4 rounded-wz-lg border border-wz-border bg-white p-wz-4">
      <div
        className="flex shrink-0 items-center justify-center rounded-wz-md border border-wz-border bg-white h-20 w-20 overflow-hidden"
      >
        {previewUrl ? (
          <img
            src={previewUrl}
            alt="Organization logo"
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <Building size={28} className="text-wz-text-muted" />
          </div>
        )}
      </div>
      <div className="flex min-w-0 flex-1 flex-col items-start">
        <button
          type="button"
          disabled={isPending}
          onClick={pickFile}
          className={cn(
            "inline-flex shrink-0 items-center gap-2 rounded-wz-md border border-wz-primary bg-transparent px-3 py-1.5 text-xs font-semibold text-wz-primary hover:bg-wz-state-hover disabled:opacity-50 disabled:cursor-not-allowed",
            isPending && "opacity-70 cursor-wait",
          )}
        >
          <Upload size={14} strokeWidth={1.75} />
          {isPending ? "Uploading…" : "Upload Logo"}
        </button>
        <p className="m-0 mt-1 text-xs text-wz-text-muted">
          PNG, JPG or WEBP, max 2 MB. Used on all payslips and letters for
          this organization.
        </p>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        className="sr-only"
        onChange={handleChange}
      />
    </div>
  );
}
