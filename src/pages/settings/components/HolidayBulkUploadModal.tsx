import { useState } from "react";
import * as XLSX from "xlsx";
import {
  Button,
  FileUploadZone,
  Modal,
  type UploadState,
} from "../../../design-system";
import { ApiError } from "../../../lib/apiClient";
import { useBulkUploadHolidays } from "../../../hooks/useHolidays";

export type HolidayBulkUploadModalProps = {
  open: boolean;
  onClose: () => void;
};

const MAX_FILE_BYTES = 5 * 1024 * 1024;
const ALLOWED_EXTENSIONS = /\.(csv|xlsx|xls)$/i;

const validateFile = (file: File): string | null => {
  if (!ALLOWED_EXTENSIONS.test(file.name)) {
    return "Invalid file type. Please upload .csv, .xlsx, or .xls.";
  }
  if (file.size > MAX_FILE_BYTES) {
    return "File size exceeds the 5MB limit.";
  }
  return null;
};

/** Matches the backend header auto-detect (needs Name + Date columns). */
const downloadTemplate = (): void => {
  const rows: (string | number)[][] = [
    [
      "INSTRUCTIONS FOR BULK UPLOAD:",
      "", "", "", "", "",
    ],
    [
      "1. Name (Required): Name of the holiday (e.g., Independence Day).",
      "", "", "", "", "",
    ],
    [
      "2. Date (Required): Format YYYY-MM-DD (e.g., 2026-08-15).",
      "", "", "", "", "",
    ],
    [
      "3. Type (Required): Allowed values -> National | Festival | Restricted | Company.",
      "", "", "", "", "",
    ],
    [
      "4. State (Optional): Use exact state name like Delhi, Maharashtra. Leave blank for all states.",
      "", "", "", "", "",
    ],
    [
      "5. Department (Required): Leave blank or write 'All' for all departments, or enter the exact department name.",
      "", "", "", "", "",
    ],
    [
      "6. Description (Optional): Short details or notes for HR reference.",
      "", "", "", "", "",
    ],
    [],
    ["Name", "Date", "Type", "State", "Department", "Description"],
    [
      "Republic Day",
      "2026-01-26",
      "National",
      "Delhi",
      "All",
      "National Holiday",
    ],
    [
      "Diwali",
      "2026-11-08",
      "Festival",
      "Maharashtra",
      "All",
      "Festival Celebration",
    ],
    [
      "Regional Festival",
      "2026-04-14",
      "Restricted",
      "Karnataka",
      "Operations",
      "Optional Holiday",
    ],
  ];

  const ws = XLSX.utils.aoa_to_sheet(rows);
  ws["!cols"] = [
    { wch: 30 },
    { wch: 15 },
    { wch: 18 },
    { wch: 20 },
    { wch: 22 },
    { wch: 35 },
  ];
  ws["!merges"] = Array.from({ length: 7 }, (_, r) => ({
    s: { r, c: 0 },
    e: { r, c: 5 },
  }));

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Holidays");
  XLSX.writeFile(wb, "holiday-bulk-upload-template.xlsx");
};

const formatResult = (
  totalRows: number,
  inserted: number,
  skipped: number,
  errors?: string[],
): { status: "done" | "error"; message: string } => {
  const lines = [
    `Processed ${totalRows} row(s): ${inserted} added, ${Math.max(skipped, 0)} skipped.`,
  ];
  if (errors && errors.length > 0) {
    lines.push("", "Issues found:", ...errors);
    return { status: "error", message: lines.join("\n") };
  }
  return { status: "done", message: lines.join("\n") };
};

/** Figma-style bulk upload: pick a file, it uploads immediately, summary below. */
export function HolidayBulkUploadModal({
  open,
  onClose,
}: HolidayBulkUploadModalProps) {
  const [upload, setUpload] = useState<UploadState | null>(null);
  const uploadMutation = useBulkUploadHolidays();

  const handleClose = () => {
    if (uploadMutation.isPending) return;
    setUpload(null);
    onClose();
  };

  const onFile = async (file: File) => {
    const invalid = validateFile(file);
    if (invalid) return setUpload({ name: file.name, status: "error", message: invalid });

    setUpload({ name: file.name, status: "uploading" });
    try {
      const result = await uploadMutation.mutateAsync(file);
      const formatted = formatResult(
        result.totalRows,
        result.inserted,
        result.skipped,
        result.errors,
      );
      setUpload({ name: file.name, status: formatted.status, message: formatted.message });
    } catch (err) {
      setUpload({
        name: file.name,
        status: "error",
        message:
          err instanceof ApiError
            ? err.message
            : "Bulk holiday upload failed. Please try again.",
      });
    }
  };

  return (
    <Modal
      open={open}
      title="Bulk Upload Holidays"
      onClose={handleClose}
      footer={
        <Button
          type="button"
          variant="secondary"
          onClick={handleClose}
          disabled={uploadMutation.isPending}
        >
          {upload?.status === "done" ? "Done" : "Close"}
        </Button>
      }
    >
      <FileUploadZone
        title="Upload holidays file"
        accept=".csv,.xlsx,.xls,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel,text/csv"
        hint="Supported formats: CSV, XLSX or XLS · Max 5 MB"
        upload={upload}
        onFile={(f) => void onFile(f)}
        onClear={() => setUpload(null)}
        onDownloadTemplate={downloadTemplate}
        disabled={uploadMutation.isPending}
      />
    </Modal>
  );
}

export default HolidayBulkUploadModal;
