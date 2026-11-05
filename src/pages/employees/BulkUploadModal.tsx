import { useRef, useState } from "react";
import { Check, Copy, Download, Upload } from "lucide-react";
import { Button, Modal } from "../../design-system";
import { useBulkUploadEmployees } from "../../hooks/useEmployees";
import { useSalaryStructures } from "../../hooks/useSalaryStructures";
import { ApiError } from "../../lib/apiClient";
import {
  downloadEmployeeBulkTemplate,
  formatBulkUploadMessage,
  isExcelUploadFile,
} from "./employeeBulkTemplate";

export type BulkUploadModalProps = {
  open: boolean;
  onClose: () => void;
  vendorId: string | null;
};

export default function BulkUploadModal({
  open,
  onClose,
  vendorId,
}: BulkUploadModalProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copiedName, setCopiedName] = useState<string | null>(null);

  const uploadMutation = useBulkUploadEmployees();
  const { data: structures = [], isLoading: structuresLoading } =
    useSalaryStructures(vendorId, open);

  const resetLocal = () => {
    setFile(null);
    setMessage(null);
    setError(null);
    setCopiedName(null);
    if (inputRef.current) inputRef.current.value = "";
  };

  const handleClose = () => {
    if (uploadMutation.isPending) return;
    resetLocal();
    onClose();
  };

  const onPickFile = (next: File | null) => {
    setMessage(null);
    setError(null);
    if (next && !isExcelUploadFile(next)) {
      setFile(null);
      setError("Please choose an .xlsx or .xls file");
      return;
    }
    setFile(next);
  };

  const onDownloadTemplate = () => {
    downloadEmployeeBulkTemplate({
      orgUnitLabel: "Department",
      sampleStructureName: structures[0]?.name,
    });
  };

  const onCopyStructure = async (name: string) => {
    try {
      await navigator.clipboard.writeText(name);
      setCopiedName(name);
      window.setTimeout(() => setCopiedName(null), 1500);
    } catch {
      /* ignore */
    }
  };

  const onUpload = async () => {
    if (!file || uploadMutation.isPending) return;
    setMessage(null);
    setError(null);
    try {
      const result = await uploadMutation.mutateAsync(file);
      setMessage(formatBulkUploadMessage(result));
      setFile(null);
      if (inputRef.current) inputRef.current.value = "";
    } catch (err) {
      const msg =
        err instanceof ApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : "Bulk upload failed";
      setError(msg);
    }
  };

  return (
    <Modal
      open={open}
      title="Bulk Upload Employees"
      onClose={handleClose}
      size="md"
      footer={
        <Button
          type="button"
          variant="primary"
          onClick={() => void onUpload()}
          disabled={!file || uploadMutation.isPending}
        >
          {uploadMutation.isPending ? "Uploading…" : "Upload Excel"}
        </Button>
      }
    >
      <div className="flex flex-col gap-wz-4">
        <p className="m-0 text-sm text-wz-text-secondary">
          Download the template, fill it in, then upload it here.
        </p>

        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={onDownloadTemplate}
        >
          <Download size={15} aria-hidden />
          Download sample template
        </Button>

        <label className="relative flex min-h-[120px] cursor-pointer flex-col items-center justify-center gap-2 rounded-wz-md border border-dashed border-wz-border bg-wz-neutral-50 px-wz-5 py-wz-5 text-center text-wz-text-secondary hover:border-wz-primary hover:bg-wz-hover">
          <input
            ref={inputRef}
            type="file"
            accept=".xlsx,.xls,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
            className="absolute inset-0 cursor-pointer opacity-0"
            onChange={(e) => onPickFile(e.target.files?.[0] || null)}
          />
          <Upload size={24} aria-hidden />
          <span className="text-sm font-semibold text-wz-text-primary">
            Choose .xlsx or .xls file
          </span>
          {file ? (
            <span className="text-xs font-semibold text-wz-primary">
              {file.name}
            </span>
          ) : (
            <span className="text-xs">Click to browse, or drop a file</span>
          )}
        </label>

        <div className="flex flex-col gap-2">
          <h3 className="m-0 text-sm font-semibold text-wz-text-primary">
            Salary Structure Names
          </h3>
          <p className="m-0 text-xs text-wz-text-secondary">
            Copy a name into the “CTC Structure / Template Name” column. Enter
            annual CTC in the “CTC” column.
          </p>
          {structuresLoading ? (
            <p className="m-0 text-xs text-wz-text-secondary">
              Loading salary structures…
            </p>
          ) : structures.length > 0 ? (
            <ul className="m-0 flex max-h-40 list-none flex-col gap-1.5 overflow-auto p-0">
              {structures.map((structure) => (
                <li key={structure._id}>
                  <button
                    type="button"
                    className="flex w-full cursor-pointer items-center justify-between gap-2 rounded-wz-md border border-wz-border bg-white px-2.5 py-2 text-left text-sm text-wz-text-primary hover:border-wz-primary hover:bg-wz-hover"
                    title={`Copy ${structure.name}`}
                    onClick={() => void onCopyStructure(structure.name)}
                  >
                    <span>{structure.name}</span>
                    {copiedName === structure.name ? (
                      <Check size={14} aria-hidden />
                    ) : (
                      <Copy size={14} aria-hidden />
                    )}
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="m-0 text-xs text-wz-text-secondary">
              No salary structures found. Create one under Payroll → Salary
              Structures first.
            </p>
          )}
        </div>

        {error ? (
          <p className="m-0 whitespace-pre-line text-xs text-wz-error" role="alert">
            {error}
          </p>
        ) : null}
        {message ? (
          <p
            className="m-0 whitespace-pre-line text-xs text-wz-success"
            role="status"
          >
            {message}
          </p>
        ) : null}
      </div>
    </Modal>
  );
}
