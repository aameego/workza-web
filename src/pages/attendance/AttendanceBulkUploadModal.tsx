import { useEffect, useRef, useState } from "react";
import { Download, Upload } from "lucide-react";
import { Button, Field, Modal, Select } from "../../design-system";
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

const MONTH_OPTIONS = Array.from({ length: 12 }, (_, i) => ({
  value: i + 1,
  label: new Date(2020, i, 1).toLocaleString("en-US", { month: "long" }),
}));

export default function AttendanceBulkUploadModal({
  open,
  onClose,
  defaultMonth,
  defaultYear,
}: AttendanceBulkUploadModalProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [month, setMonth] = useState(defaultMonth);
  const [year, setYear] = useState(defaultYear);
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const templateMutation = useDownloadMonthlyUploadTemplate();
  const uploadMutation = useBulkUploadMonthAttendance();
  const busy = templateMutation.isPending || uploadMutation.isPending;

  const yearOptions = [defaultYear - 1, defaultYear, defaultYear + 1];

  useEffect(() => {
    if (!open) return;
    setMonth(defaultMonth);
    setYear(defaultYear);
  }, [open, defaultMonth, defaultYear]);

  const resetLocal = () => {
    setFile(null);
    setError(null);
    setMessage(null);
    if (inputRef.current) inputRef.current.value = "";
  };

  const handleClose = () => {
    if (busy) return;
    resetLocal();
    onClose();
  };

  const onPickFile = (next: File | null) => {
    setMessage(null);
    const validation = validateAttendanceUploadFile(next);
    if (validation) {
      setFile(null);
      setError(validation);
      return;
    }
    setError(null);
    setFile(next);
  };

  const onDownloadTemplate = async () => {
    setError(null);
    try {
      const result = await templateMutation.mutateAsync({ month, year });
      const fileName = fileNameFromContentDisposition(
        result.headers.get("content-disposition"),
        `attendance-month-template-${year}-${String(month).padStart(2, "0")}.xlsx`,
      );
      await saveDownload(result.blob, fileName);
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : "Unable to download the template. Please try again.",
      );
    }
  };

  const onUpload = async () => {
    const validation = validateAttendanceUploadFile(file);
    if (validation || !file) {
      setError(validation || "Please select a file.");
      return;
    }
    setError(null);
    setMessage(null);
    try {
      const result = await uploadMutation.mutateAsync(file);
      setMessage(formatBulkMonthUploadResult(result));
      setFile(null);
      if (inputRef.current) inputRef.current.value = "";
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : "Monthly attendance upload failed.",
      );
    }
  };

  return (
    <Modal
      open={open}
      title="Bulk Upload Attendance"
      onClose={handleClose}
      footer={
        <>
          <Button
            type="button"
            variant="secondary"
            onClick={handleClose}
            disabled={busy}
          >
            Close
          </Button>
          <Button
            type="button"
            variant="primary"
            onClick={() => void onUpload()}
            disabled={!file || busy}
          >
            {uploadMutation.isPending ? "Uploading…" : "Upload Excel"}
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-wz-4">
        <p className="m-0 text-sm text-wz-text-secondary">
          Download the month template, fill Employee Code / working days, then
          upload the Excel file.
        </p>

        <div className="grid grid-cols-1 gap-wz-3 sm:grid-cols-2">
          <Field label="Month">
            <Select
              value={String(month)}
              onChange={(e) => {
                setMonth(Number(e.target.value));
                setMessage(null);
              }}
              disabled={busy}
            >
              {MONTH_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Year">
            <Select
              value={String(year)}
              onChange={(e) => {
                setYear(Number(e.target.value));
                setMessage(null);
              }}
              disabled={busy}
            >
              {yearOptions.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </Select>
          </Field>
        </div>

        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={() => void onDownloadTemplate()}
          disabled={busy}
        >
          <Download size={15} aria-hidden />
          {templateMutation.isPending
            ? "Downloading…"
            : "Download month template"}
        </Button>

        <label className="relative flex min-h-[120px] cursor-pointer flex-col items-center justify-center gap-2 rounded-wz-md border border-dashed border-wz-border bg-wz-neutral-50 px-wz-5 py-wz-5 text-center text-wz-text-secondary hover:border-wz-primary hover:bg-wz-hover">
          <input
            ref={inputRef}
            type="file"
            accept=".xlsx,.xls,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
            className="absolute inset-0 cursor-pointer opacity-0"
            disabled={busy}
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
            <span className="text-xs">Max 5 MB</span>
          )}
        </label>

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
