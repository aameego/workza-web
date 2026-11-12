import { useState } from "react";
import { FileUploadZone, Modal, type UploadState } from "../../design-system";
import {
  useBulkUploadMonthAttendance,
  useDownloadMonthlyUploadTemplate,
} from "../../hooks/useAttendance";
import { ApiError } from "../../lib/apiClient";
import {
  fileNameFromContentDisposition,
  saveDownload,
} from "../../lib/saveDownload";
import {
  formatBulkMonthUploadResult,
  validateAttendanceUploadFile,
} from "./attendanceEditHelpers";

export type AttendanceBulkUploadModalProps = {
  open: boolean;
  onClose: () => void;
  defaultMonth: number;
  defaultYear: number;
};

/** Figma Attendance - Bulk Upload (1:23980). The template is for the month selected on the page. */
export default function AttendanceBulkUploadModal({
  open,
  onClose,
  defaultMonth: month,
  defaultYear: year,
}: AttendanceBulkUploadModalProps) {
  const [upload, setUpload] = useState<UploadState | null>(null);
  const [templateError, setTemplateError] = useState<string | null>(null);
  const templateMutation = useDownloadMonthlyUploadTemplate();
  const uploadMutation = useBulkUploadMonthAttendance();

  const handleClose = () => {
    if (uploadMutation.isPending) return;
    setUpload(null);
    setTemplateError(null);
    onClose();
  };

  const onDownloadTemplate = async () => {
    setTemplateError(null);
    try {
      const result = await templateMutation.mutateAsync({ month, year });
      await saveDownload(
        result.blob,
        fileNameFromContentDisposition(
          result.headers.get("content-disposition"),
          `attendance-month-template-${year}-${String(month).padStart(2, "0")}.xlsx`,
        ),
      );
    } catch (err) {
      setTemplateError(
        err instanceof ApiError ? err.message : "Unable to download the template. Please try again.",
      );
    }
  };

  const onFile = async (file: File) => {
    const invalid = validateAttendanceUploadFile(file);
    if (invalid) return setUpload({ name: file.name, status: "error", message: invalid });
    setUpload({ name: file.name, status: "uploading" });
    try {
      const result = await uploadMutation.mutateAsync(file);
      setUpload({ name: file.name, status: "done", message: formatBulkMonthUploadResult(result) });
    } catch (err) {
      setUpload({
        name: file.name,
        status: "error",
        message: err instanceof ApiError ? err.message : "Monthly attendance upload failed.",
      });
    }
  };

  return (
    <Modal open={open} title="Bulk Upload - Attendance" onClose={handleClose}>
      <FileUploadZone
        title="Attendance"
        accept=".xlsx,.xls,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
        hint="Supported formats: XLSX or XLS · Max 5 MB"
        upload={upload}
        onFile={(f) => void onFile(f)}
        onClear={() => setUpload(null)}
        onDownloadTemplate={() => void onDownloadTemplate()}
        templateBusy={templateMutation.isPending}
      >
        {templateError ? (
          <p className="m-0 text-xs text-wz-error" role="alert">
            {templateError}
          </p>
        ) : null}
      </FileUploadZone>
    </Modal>
  );
}
