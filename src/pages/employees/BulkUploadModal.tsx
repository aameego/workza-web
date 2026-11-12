import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { FileUploadZone, Modal, type UploadState } from "../../design-system";
import { useBulkUploadEmployees } from "../../hooks/useEmployees";
import { useSalaryStructures } from "../../hooks/useSalaryStructures";
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
  const [upload, setUpload] = useState<UploadState | null>(null);
  const [copiedName, setCopiedName] = useState<string | null>(null);

  const uploadMutation = useBulkUploadEmployees();
  const { data: structures = [], isLoading: structuresLoading } =
    useSalaryStructures(vendorId, open);

  const handleClose = () => {
    if (uploadMutation.isPending) return;
    setUpload(null);
    setCopiedName(null);
    onClose();
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

  const onFile = async (file: File) => {
    if (!isExcelUploadFile(file)) {
      return setUpload({ name: file.name, status: "error", message: "Please choose an .xlsx or .xls file" });
    }
    setUpload({ name: file.name, status: "uploading" });
    try {
      const result = await uploadMutation.mutateAsync(file);
      setUpload({ name: file.name, status: "done", message: formatBulkUploadMessage(result) });
    } catch (err) {
      setUpload({
        name: file.name,
        status: "error",
        message: err instanceof Error ? err.message : "Bulk upload failed",
      });
    }
  };

  return (
    <Modal open={open} title="Bulk Upload - Employees" onClose={handleClose} size="md">
      <FileUploadZone
        title="Employees"
        accept=".xlsx,.xls,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
        hint="Supported formats: XLSX or XLS"
        upload={upload}
        onFile={(f) => void onFile(f)}
        onClear={() => setUpload(null)}
        onDownloadTemplate={onDownloadTemplate}
      >
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

      </FileUploadZone>
    </Modal>
  );
}
