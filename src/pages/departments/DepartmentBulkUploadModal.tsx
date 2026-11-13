import { useState } from "react";
import { FileUploadZone, Modal, type UploadState } from "../../design-system";
import { useCreateDepartment, useShifts } from "../../hooks/useDepartments";
import { ApiError } from "../../lib/apiClient";
import { saveDownload } from "../../lib/saveDownload";
import {
  buildDepartmentBulkTemplateCsv,
  parseDepartmentBulkCsv,
  resolveShiftId,
  toBulkPayload,
} from "./departmentBulk";

export type DepartmentBulkUploadModalProps = {
  open: boolean;
  vendorId: string;
  onClose: () => void;
};

export default function DepartmentBulkUploadModal({
  open,
  vendorId,
  onClose,
}: DepartmentBulkUploadModalProps) {
  const [upload, setUpload] = useState<UploadState | null>(null);
  const createMutation = useCreateDepartment();
  const { data: shifts = [] } = useShifts(vendorId, open);
  const busy = createMutation.isPending;

  const handleClose = () => {
    if (busy) return;
    setUpload(null);
    onClose();
  };

  const onDownloadTemplate = async () => {
    const csv = buildDepartmentBulkTemplateCsv();
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    await saveDownload(blob, "Departments-Bulk-Upload-Template.csv", "text/csv");
  };

  const onFile = async (file: File) => {
    if (!/\.csv$/i.test(file.name)) {
      setUpload({
        name: file.name,
        status: "error",
        message: "Please choose a .csv file",
      });
      return;
    }
    setUpload({ name: file.name, status: "uploading" });
    try {
      const text = await file.text();
      const parsed = parseDepartmentBulkCsv(text);
      if (parsed.errors.length && parsed.rows.length === 0) {
        setUpload({
          name: file.name,
          status: "error",
          message: parsed.errors.join(" "),
        });
        return;
      }

      let created = 0;
      const rowErrors: string[] = [...parsed.errors];
      for (const row of parsed.rows) {
        const shiftId = resolveShiftId(row.shiftName, shifts);
        if (!shiftId) {
          rowErrors.push(
            `"${row.name}": Shift Name is required and must match an existing shift.`,
          );
          continue;
        }
        try {
          await createMutation.mutateAsync(
            toBulkPayload(row, vendorId, shiftId),
          );
          created += 1;
        } catch (err) {
          rowErrors.push(
            `"${row.name}": ${
              err instanceof ApiError
                ? err.message
                : err instanceof Error
                  ? err.message
                  : "Failed to create"
            }`,
          );
        }
      }

      if (created === 0) {
        setUpload({
          name: file.name,
          status: "error",
          message:
            rowErrors[0] ||
            "No departments were created. Check Shift Name values.",
        });
        return;
      }

      setUpload({
        name: file.name,
        status: "done",
        message:
          rowErrors.length > 0
            ? `Created ${created}. Issues: ${rowErrors.slice(0, 3).join(" ")}`
            : `Created ${created} department${created === 1 ? "" : "s"}.`,
      });
    } catch (err) {
      setUpload({
        name: file.name,
        status: "error",
        message:
          err instanceof Error ? err.message : "Could not read the CSV file",
      });
    }
  };

  return (
    <Modal
      open={open}
      title="Bulk Upload - Departments"
      onClose={handleClose}
      size="md"
    >
      <FileUploadZone
        title="Departments"
        accept=".csv,text/csv"
        hint="Supported format: CSV (Shift Name must match an existing shift)"
        upload={upload}
        onFile={(f) => void onFile(f)}
        onClear={() => setUpload(null)}
        onDownloadTemplate={() => void onDownloadTemplate()}
      />
    </Modal>
  );
}
