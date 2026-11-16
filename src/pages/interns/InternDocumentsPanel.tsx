import { useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Eye, FileText } from "lucide-react";
import { Button } from "../../design-system";
import { useInternDocuments, INTERNS_QUERY_KEY } from "../../hooks/useInterns";
import { ApiError } from "../../lib/apiClient";
import { getDocumentViewUrl } from "../../services/documentService";
import { uploadInternDocument } from "../../services/internService";
import { EmployeeSectionHeader } from "../employees/EmployeeInfoField";
import {
  acceptFor,
  docTypeLabel,
  formatFileSize,
  formatUploadedAgo,
  isAllowedFile,
} from "../employees/documentTypes";
import { INTERN_DOC_TYPES } from "./internConstants";

export type InternDocumentsPanelProps = {
  internId: string;
  canUpload: boolean;
};

type DocRow = {
  _id?: string;
  fileName?: string;
  originalName?: string;
  documentType?: string;
  createdAt?: string;
  uploadedAt?: string;
  size?: number;
  fileSize?: number;
};

export default function InternDocumentsPanel({
  internId,
  canUpload,
}: InternDocumentsPanelProps) {
  const { data, isLoading, isError, error, refetch } = useInternDocuments(
    internId,
    true,
  );
  const qc = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const [docType, setDocType] = useState<string>(INTERN_DOC_TYPES[0]);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const documents = (data?.documents || []) as DocRow[];

  const onPickFile = () => {
    setUploadError(null);
    fileRef.current?.click();
  };

  const onFileChange = async (file: File | null) => {
    if (!file) return;
    if (!isAllowedFile(docType, file.name)) {
      setUploadError(
        `Invalid file for ${docTypeLabel(docType)}. Allowed: ${acceptFor(docType)}`,
      );
      return;
    }
    setUploading(true);
    setUploadError(null);
    try {
      await uploadInternDocument({
        internId,
        documentType: docType,
        file,
      });
      void qc.invalidateQueries({
        queryKey: [INTERNS_QUERY_KEY, "documents", internId],
      });
    } catch (err) {
      setUploadError(
        err instanceof ApiError ? err.message : "Upload failed. Try again.",
      );
    } finally {
      setUploading(false);
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
        <Button type="button" variant="secondary" className="mt-wz-3" onClick={() => void refetch()}>
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
        accept={acceptFor(docType)}
        onChange={(e) => void onFileChange(e.target.files?.[0] || null)}
      />
      <section className="rounded-wz-xl border border-wz-border bg-white p-wz-6">
        <EmployeeSectionHeader title="Intern Documents" />
        {canUpload ? (
          <div className="mt-wz-4 flex flex-wrap items-end gap-wz-3">
            <label className="flex min-w-[200px] flex-col gap-1 text-xs font-semibold text-wz-text-muted">
              Document type
              <select
                className="h-10 rounded-wz-md border border-wz-border px-3 text-sm text-wz-heading"
                value={docType}
                onChange={(e) => setDocType(e.target.value)}
              >
                {INTERN_DOC_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {docTypeLabel(t)}
                  </option>
                ))}
              </select>
            </label>
            <Button
              type="button"
              variant="secondary"
              disabled={uploading}
              onClick={onPickFile}
            >
              {uploading ? "Uploading…" : "Upload Document"}
            </Button>
          </div>
        ) : null}
        {uploadError ? (
          <p className="m-0 mt-wz-3 text-sm text-wz-error" role="alert">
            {uploadError}
          </p>
        ) : null}
        {documents.length === 0 ? (
          <p className="m-0 mt-wz-4 text-sm text-wz-text-secondary">
            No documents uploaded yet.
          </p>
        ) : (
          <ul className="m-0 mt-wz-4 flex list-none flex-col gap-wz-2 p-0">
            {documents.map((doc, idx) => {
              const name = doc.originalName || doc.fileName || docTypeLabel(doc.documentType);
              const when = formatUploadedAgo(doc.uploadedAt || doc.createdAt);
              const size = formatFileSize(doc.fileSize ?? doc.size);
              return (
                <li
                  key={doc._id || `${doc.documentType}-${idx}`}
                  className="flex flex-wrap items-center justify-between gap-wz-3 rounded-wz-md border border-wz-border px-3 py-2"
                >
                  <div className="flex min-w-0 items-center gap-wz-3">
                    <FileText className="size-4 shrink-0 text-wz-text-muted" aria-hidden />
                    <div className="min-w-0">
                      <p className="m-0 truncate text-sm font-semibold text-wz-heading">
                        {name}
                      </p>
                      <p className="m-0 text-[11px] text-wz-text-muted">
                        {docTypeLabel(doc.documentType)} · {size}
                        {when ? ` · ${when}` : ""}
                      </p>
                    </div>
                  </div>
                  {doc._id ? (
                    <a
                      href={getDocumentViewUrl(doc._id)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs font-semibold text-wz-primary no-underline hover:underline"
                    >
                      <Eye size={14} aria-hidden />
                      View
                    </a>
                  ) : null}
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}