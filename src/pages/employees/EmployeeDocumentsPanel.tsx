import { useRef, useState } from "react";
import { Eye, FileText } from "lucide-react";
import { Button } from "../../design-system";
import { ApiError } from "../../lib/apiClient";
import { getDocumentViewUrl } from "../../services/documentService";
import {
  useEmployeeDocuments,
  useUploadEmployeeDocument,
} from "../../hooks/useEmployeeDetailTabs";
import { EmployeeSectionHeader } from "./EmployeeInfoField";
import {
  acceptFor,
  docTypeLabel,
  formatFileSize,
  formatUploadedAgo,
  isAllowedFile,
  pendingDocumentSlots,
  type PendingDocSlot,
} from "./documentTypes";

export type EmployeeDocumentsPanelProps = {
  employeeId: string;
  canUpload: boolean;
};

export default function EmployeeDocumentsPanel({
  employeeId,
  canUpload,
}: EmployeeDocumentsPanelProps) {
  const { data: documents = [], isLoading, isError, error, refetch } =
    useEmployeeDocuments(employeeId, true);
  const uploadMutation = useUploadEmployeeDocument(employeeId);
  const fileRef = useRef<HTMLInputElement>(null);
  const [pendingSlot, setPendingSlot] = useState<PendingDocSlot | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const pending = pendingDocumentSlots(documents);

  const onPickUpload = (slot: PendingDocSlot) => {
    setUploadError(null);
    setPendingSlot(slot);
    fileRef.current?.click();
  };

  const onFileChange = async (file: File | null) => {
    if (!file || !pendingSlot) return;
    if (!isAllowedFile(pendingSlot.documentType, file.name)) {
      setUploadError(
        `Invalid file for ${pendingSlot.label}. Allowed: ${acceptFor(pendingSlot.documentType)}`,
      );
      setPendingSlot(null);
      return;
    }
    try {
      await uploadMutation.mutateAsync({
        documentType: pendingSlot.documentType,
        file,
      });
      setPendingSlot(null);
    } catch (err: unknown) {
      setUploadError(
        err instanceof ApiError ? err.message : "Upload failed. Try again.",
      );
    } finally {
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  if (isLoading) {
    return (
      <section className="rounded-wz-xl border border-wz-border bg-white p-wz-6 text-sm text-wz-text-secondary">
        Loading documents…
      </section>
    );
  }

  if (isError) {
    return (
      <section className="rounded-wz-xl border border-wz-border bg-white p-wz-6">
        <p className="m-0 text-sm text-wz-error" role="alert">
          {error instanceof ApiError
            ? error.message
            : "Could not load documents."}
        </p>
        <Button
          type="button"
          variant="secondary"
          className="mt-wz-3"
          onClick={() => void refetch()}
        >
          Retry
        </Button>
      </section>
    );
  }

  return (
    <div className="flex w-full flex-col gap-wz-6">
      <input
        ref={fileRef}
        type="file"
        className="hidden"
        accept={pendingSlot ? acceptFor(pendingSlot.documentType) : undefined}
        onChange={(e) => void onFileChange(e.target.files?.[0] || null)}
      />

      <section className="rounded-wz-xl border border-wz-border bg-white p-wz-6">
        <div className="flex flex-col gap-wz-4">
          <EmployeeSectionHeader title="Verified Documents" />
          {documents.length === 0 ? (
            <p className="m-0 text-sm text-wz-text-secondary">
              No verified documents yet.
            </p>
          ) : (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              {documents.map((doc) => (
                <div
                  key={doc._id}
                  className="flex min-h-[69px] items-center gap-3 rounded-wz-md border border-wz-border bg-wz-neutral-50 p-3"
                >
                  <FileText size={24} className="shrink-0 text-wz-error" />
                  <div className="min-w-0 flex-1">
                    <p className="m-0 truncate text-sm leading-5 font-semibold text-wz-heading">
                      {doc.originalName ||
                        doc.fileName ||
                        docTypeLabel(doc.documentType)}
                    </p>
                    <div className="mt-1 flex flex-wrap items-center gap-2">
                      <span className="inline-flex h-[21px] items-center rounded-wz-sm border border-wz-border bg-white px-2 text-[10px] text-wz-text-muted">
                        {formatFileSize(doc.size ?? doc.fileSize)}
                      </span>
                      <span className="text-[11px] text-wz-text-muted">
                        {formatUploadedAgo(doc.uploadedAt || doc.createdAt)}
                      </span>
                    </div>
                  </div>
                  <a
                    href={getDocumentViewUrl(doc._id)}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex size-8 items-center justify-center rounded-wz-md text-wz-text-secondary hover:bg-wz-neutral-100 hover:text-wz-text"
                    aria-label="View document"
                    title="View"
                  >
                    <Eye size={24} strokeWidth={1.5} />
                  </a>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="rounded-wz-xl border border-wz-border bg-white p-wz-6">
        <div className="flex flex-col gap-wz-4">
          <EmployeeSectionHeader title="Pending Documents" />
          {uploadError ? (
            <p className="m-0 text-sm text-wz-error" role="alert">
              {uploadError}
            </p>
          ) : null}
          {pending.length === 0 ? (
            <p className="m-0 text-sm text-wz-text-secondary">
              All required documents are uploaded.
            </p>
          ) : (
            /* Figma Pending Documents: two columns filled top-down, 24 apart, 28px rows */
            <div
              className="grid grid-cols-1 gap-6 md:grid-flow-col md:grid-cols-2"
              style={{
                gridTemplateRows: `repeat(${Math.ceil(pending.length / 2)}, auto)`,
              }}
            >
              {pending.map((slot) => (
                <div
                  key={slot.id}
                  className="flex min-h-7 items-center justify-between gap-3"
                >
                  <p className="m-0 text-sm font-semibold tracking-[0.5px] text-[#6c757d] uppercase">
                    {slot.label}
                  </p>
                  {canUpload ? (
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      disabled={uploadMutation.isPending}
                      onClick={() => onPickUpload(slot)}
                    >
                      Upload
                    </Button>
                  ) : (
                    <span className="text-xs text-wz-text-secondary">-</span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
