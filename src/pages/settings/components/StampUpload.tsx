import { useRef } from "react";
import { Upload, Hash } from "lucide-react";
import { Card, cn } from "../../../design-system";

export interface StampUploadProps {
  previewUrl: string;
  isPending: boolean;
  onUpload: (file: File) => void;
}

export function StampUpload({
  previewUrl,
  isPending,
  onUpload,
}: StampUploadProps) {
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
    <Card className="flex flex-col gap-wz-4">
      <div className="flex items-center gap-wz-3">
        <div
          className="flex shrink-0 items-center justify-center rounded-wz-lg border border-wz-border bg-white h-12 w-12 object-cover"
        >
          {previewUrl ? (
            <img
              src={previewUrl}
              alt="Stamp"
              className="h-full w-full object-cover rounded-wz-lg"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <Hash size={20} className="text-wz-text-muted" />
            </div>
          )}
        </div>
        <div className="flex min-w-0 flex-col">
          <h3 className="m-0 text-sm font-semibold text-wz-heading">
            Upload Stamp
          </h3>
          <p className="m-0 mt-0.5 text-xs text-wz-text-muted">
            PNG or JPG, max 2 MB. Shown beside the signature.
          </p>
        </div>
      </div>
      <button
        type="button"
        disabled={isPending}
        onClick={pickFile}
        className={cn(
          "inline-flex items-center gap-2 rounded-wz-md border border-wz-primary bg-transparent px-3 py-1.5 text-xs font-semibold text-wz-primary hover:bg-wz-state-hover disabled:opacity-50 disabled:cursor-not-allowed",
          isPending && "opacity-70 cursor-wait",
        )}
      >
        <Upload size={14} strokeWidth={1.75} />
        {isPending ? "Uploading…" : "Upload Stamp"}
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg"
        className="sr-only"
        onChange={handleChange}
      />
    </Card>
  );
}
