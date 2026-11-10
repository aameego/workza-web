import { useMemo, useState } from "react";
import { Button, Field, Modal, Select } from "../../design-system";
import { useMonthReport } from "../../hooks/useAttendance";
import { ApiError } from "../../lib/apiClient";
import {
  fileNameFromContentDisposition,
  saveDownload,
} from "../../lib/saveDownload";
import { MONTH_NAMES } from "./attendanceMonthOptions";

export type AttendanceMonthlyReportModalProps = {
  open: boolean;
  onClose: () => void;
};

export default function AttendanceMonthlyReportModal({
  open,
  onClose,
}: AttendanceMonthlyReportModalProps) {
  const today = new Date();
  const currentYear = today.getFullYear();
  const currentMonthIndex = today.getMonth();
  const [reportYear, setReportYear] = useState(currentYear);
  const [reportMonth, setReportMonth] = useState(
    MONTH_NAMES[currentMonthIndex] || "January",
  );
  const [error, setError] = useState<string | null>(null);
  const mutation = useMonthReport();

  const availableMonths = useMemo(() => {
    if (reportYear === currentYear) {
      return MONTH_NAMES.slice(0, currentMonthIndex + 1);
    }
    return [...MONTH_NAMES];
  }, [reportYear, currentYear, currentMonthIndex]);

  const handleDownload = async () => {
    setError(null);
    try {
      const result = await mutation.mutateAsync({
        reportMonth,
        reportYear,
      });
      const fileName = fileNameFromContentDisposition(
        result.headers.get("content-disposition"),
        `Attendance_Report_${reportMonth}_${reportYear}.xlsx`,
      );
      await saveDownload(result.blob, fileName);
      onClose();
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : "Could not download the report. Please try again.",
      );
    }
  };

  return (
    <Modal
      open={open}
      title="Download monthly attendance report"
      onClose={() => {
        if (mutation.isPending) return;
        onClose();
      }}
      footer={
        <>
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
            disabled={mutation.isPending}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="primary"
            onClick={() => void handleDownload()}
            disabled={mutation.isPending}
          >
            {mutation.isPending ? "Downloading…" : "Download"}
          </Button>
        </>
      }
    >
      <div className="space-y-wz-4">
        {error ? (
          <p className="m-0 text-sm text-wz-error" role="alert">
            {error}
          </p>
        ) : null}
        <div className="grid grid-cols-1 gap-wz-4 sm:grid-cols-2">
          <Field label="Year">
            <Select
              value={String(reportYear)}
              onChange={(e) => {
                const next = Number(e.target.value);
                setReportYear(next);
                if (
                  next === currentYear &&
                  !MONTH_NAMES.slice(0, currentMonthIndex + 1).includes(
                    reportMonth as (typeof MONTH_NAMES)[number],
                  )
                ) {
                  setReportMonth(MONTH_NAMES[currentMonthIndex]!);
                }
              }}
              disabled={mutation.isPending}
            >
              {[currentYear, currentYear - 1, currentYear - 2].map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Month">
            <Select
              value={reportMonth}
              onChange={(e) => setReportMonth(e.target.value)}
              disabled={mutation.isPending}
            >
              {availableMonths.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </Select>
          </Field>
        </div>
      </div>
    </Modal>
  );
}
