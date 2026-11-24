import { useRef } from "react";
import { cn, Field, Input } from "../../../design-system";
import { Hash, Minus, Plus, Signature, Upload } from "lucide-react";

export interface Signatory {
  name: string;
  title: string;
  signatureImageUrl?: string;
  signatureDisplayUrl?: string;
  stampImageUrl?: string;
  stampDisplayUrl?: string;
}

export interface LetterSignatoryData {
  signatoryName: string;
  signatoryTitle: string;
  signatories: Signatory[];
}

export interface LetterSignatoryProps {
  data: LetterSignatoryData;
  onChange: (data: LetterSignatoryData) => void;
  multipleStamps: boolean;
  onMultipleStampsChange: (checked: boolean) => void;
  onUploadSignature: (index: number, file: File) => void;
  onUploadStamp: (index: number, file: File) => void;
}

const MAX_SIGNATORIES = 5;

/** Signature or stamp upload box, linked to a single signatory. */
function SignatoryImageUpload({
  kind,
  previewUrl,
  isPending,
  onUpload,
}: {
  kind: "signature" | "stamp";
  previewUrl: string;
  isPending: boolean;
  onUpload: (file: File) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const isSignature = kind === "signature";
  const label = isSignature ? "Upload Signature" : "Upload Stamp";
  const hint = isSignature
    ? "PNG or JPG, max 2 MB. A transparent background looks best."
    : "PNG or JPG, max 2 MB. Shown beside the signature.";

  return (
    <div className="flex flex-col gap-wz-4 rounded-wz-lg bg-wz-hover p-wz-4">
      <div className="flex items-center gap-wz-3">
        <div className="flex shrink-0 items-center justify-center rounded-wz-lg border border-wz-border bg-white h-12 w-12 overflow-hidden">
          {previewUrl ? (
            <img src={previewUrl} alt={label} className="h-full w-full object-cover rounded-wz-lg" />
          ) : (
            isSignature ? (
              <Signature size={20} className="text-wz-text-muted" />
            ) : (
              <Hash size={20} className="text-wz-text-muted" />
            )
          )}
        </div>
        <div className="flex min-w-0 flex-col">
          <h4 className="m-0 text-sm font-semibold text-wz-heading">{label}</h4>
          <p className="m-0 mt-0.5 text-xs text-wz-text-muted">{hint}</p>
        </div>
      </div>
      <button
        type="button"
        disabled={isPending}
        onClick={() => inputRef.current?.click()}
        className={cn(
          "inline-flex w-fit items-center gap-2 rounded-wz-md border border-wz-primary bg-transparent px-3 py-1.5 text-xs font-semibold text-wz-primary hover:bg-wz-state-hover disabled:opacity-50 disabled:cursor-not-allowed",
          isPending && "opacity-70 cursor-wait",
        )}
      >
        <Upload size={14} strokeWidth={1.75} />
        {isPending ? "Uploading…" : label}
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg"
        className="sr-only"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) onUpload(file);
          e.target.value = "";
        }}
      />
    </div>
  );
}

export function LetterSignatory({
  data,
  onChange,
  multipleStamps,
  onMultipleStampsChange,
  onUploadSignature,
  onUploadStamp,
}: LetterSignatoryProps) {
  // Always render at least one signatory block (placeholder when none exist).
  const signatories =
    data.signatories && data.signatories.length > 0
      ? data.signatories
      : [{ name: "", title: "" }];

  // With more than one signatory, keep the toggle locked on until they are removed.
  const hasMultipleSignatories = signatories.length > 1;

  const setField = (key: keyof LetterSignatoryData, value: string) => {
    onChange({ ...data, [key]: value });
  };

  const setSignatoryField = (index: number, key: "name" | "title", value: string) => {
    const updated = [...signatories];
    updated[index] = { ...updated[index], [key]: value };
    onChange({ ...data, signatories: updated });
  };

  const addSignatory = () => {
    if (signatories.length >= MAX_SIGNATORIES) return;
    onChange({
      ...data,
      signatories: [...signatories, { name: "", title: "" }],
    });
  };

  const removeSignatory = (index: number) => {
    if (signatories.length <= 1) return;
    const updated = signatories.filter((_, i) => i !== index);
    onChange({ ...data, signatories: updated });
  };

  return (
    <div className="space-y-wz-5">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="m-0 text-base font-semibold text-wz-heading">
            Letter signatory
          </h3>
          <p className="m-0 mt-0.5 text-xs text-wz-text-muted">
            Printed at the end of generated letters. Leave blank to sign
            letters manually.
          </p>
        </div>
        <label
          className={cn(
            "inline-flex items-center gap-3 text-sm select-none",
            hasMultipleSignatories ? "cursor-not-allowed opacity-70" : "cursor-pointer",
          )}
          title={
            hasMultipleSignatories
              ? "Remove extra signatories before turning this off"
              : undefined
          }
        >
          <input
            type="checkbox"
            checked={multipleStamps}
            disabled={hasMultipleSignatories}
            onChange={(e) => onMultipleStampsChange(e.target.checked)}
            className="sr-only"
          />
          <span
            className={cn(
              "relative inline-block w-10 h-6 rounded-full shrink-0 transition-colors duration-300 ease-in-out",
              multipleStamps ? "bg-wz-primary" : "bg-[#e5e9ef]",
            )}
          >
            <span
              className={cn(
                "absolute left-0.5 top-0.5 size-5 rounded-full bg-white shadow-md transition-transform duration-300 ease-in-out",
                multipleStamps && "translate-x-4",
              )}
            />
          </span>
          <span>Allow adding more than one stamp and signature.</span>
        </label>
      </div>

      {multipleStamps ? (
        <>
          {signatories.map((s, i) => (
            <div
              key={i}
              className={cn(
                "p-wz-5",
                i > 0 && "mt-wz-4 border-t border-wz-border pt-wz-5",
              )}
            >
              <div className="grid grid-cols-1 gap-wz-5 lg:grid-cols-2">
                <Field label={`Authorised Signatory Name${i + 1}`}>
                  <Input
                    placeholder="e.g. Priya Sharma"
                    value={s.name}
                    onChange={(e) => setSignatoryField(i, "name", e.target.value)}
                  />
                </Field>

                <Field label={`Signatory Designation${i + 1}`}>
                  <Input
                    placeholder="e.g. Head - Human Resources"
                    value={s.title}
                    onChange={(e) => setSignatoryField(i, "title", e.target.value)}
                  />
                </Field>
              </div>

              <div className="mt-wz-4 grid grid-cols-1 gap-wz-5 lg:grid-cols-2">
                <SignatoryImageUpload
                  kind="signature"
                  previewUrl={s.signatureDisplayUrl || ""}
                  isPending={false}
                  onUpload={(file) => onUploadSignature(i, file)}
                />
                <SignatoryImageUpload
                  kind="stamp"
                  previewUrl={s.stampDisplayUrl || ""}
                  isPending={false}
                  onUpload={(file) => onUploadStamp(i, file)}
                />
              </div>

              {signatories.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeSignatory(i)}
                  className="mt-wz-3 inline-flex items-center gap-1 text-xs text-wz-error hover:text-wz-error/80"
                >
                  <Minus size={14} strokeWidth={1.75} />
                  Remove signatory {i + 1}
                </button>
              )}
            </div>
          ))}

          <button
            type="button"
            onClick={addSignatory}
            disabled={signatories.length >= MAX_SIGNATORIES}
            className={cn(
              "mt-wz-4 flex w-full items-center justify-center gap-2 rounded-wz-md border border-wz-primary bg-transparent px-4 py-2.5 text-sm font-semibold text-wz-primary hover:bg-wz-state-hover",
              "disabled:opacity-50 disabled:cursor-not-allowed",
            )}
          >
            <Plus size={16} strokeWidth={1.75} />
            Add Signature
          </button>
        </>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-wz-5 lg:grid-cols-2">
            <Field label="Authorised Signatory Name">
              <Input
                placeholder="e.g. Priya Sharma"
                value={data.signatoryName}
                onChange={(e) => setField("signatoryName", e.target.value)}
              />
            </Field>

            <Field label="Signatory Designation">
              <Input
                placeholder="e.g. Head - Human Resources"
                value={data.signatoryTitle}
                onChange={(e) => setField("signatoryTitle", e.target.value)}
              />
            </Field>
          </div>

        </>
      )}
    </div>
  );
}
