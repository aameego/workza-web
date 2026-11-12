import { useEffect, useState } from "react";
import { Button, Field, Input, Modal, Select } from "../../design-system";
import { useDepartmentNames } from "../../hooks/useDepartmentNames";
import { useEmployee } from "../../hooks/useEmployees";
import type { AttendanceListParams } from "../../services/attendanceService";
import { dateIsoForDay } from "./attendanceViewModel";
import SearchableEmployeeSelect from "./SearchableEmployeeSelect";

export type AttendanceExportModalProps = {
  open: boolean;
  onClose: () => void;
  target: string;
  vendorId: string | null;
  year: number;
  month: number;
  busy: boolean;
  /** Resolves to an error message, or null when the file was saved. */
  onExport: (params: AttendanceListParams) => Promise<string | null>;
};

const STATUSES = [
  ["", "All"],
  ["active", "Active"],
  ["inactive", "Inactive"],
  ["probation", "Probation"],
  ["full-time", "Full-time"],
  ["exited", "Exited"],
] as const;

/**
 * Figma Export Report - Attendance (1:24315). /attendance/download filters by
 * date range, employee (search), department and status only, so Figma's
 * Designation and Work Location filters are left out.
 */
export default function AttendanceExportModal({
  open,
  onClose,
  target,
  vendorId,
  year,
  month,
  busy,
  onExport,
}: AttendanceExportModalProps) {
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [employeeId, setEmployeeId] = useState("");
  const [departmentId, setDepartmentId] = useState("");
  const [status, setStatus] = useState("");
  const [error, setError] = useState<string | null>(null);
  const { data: departments = [] } = useDepartmentNames(open ? vendorId : null);
  const { data: employee } = useEmployee(employeeId || undefined, open && Boolean(employeeId));

  useEffect(() => {
    if (!open) return;
    setFrom(dateIsoForDay(year, month, 1));
    setTo(dateIsoForDay(year, month, new Date(year, month, 0).getDate()));
    setEmployeeId("");
    setDepartmentId("");
    setStatus("");
    setError(null);
  }, [open, year, month]);

  const submit = async () => {
    if (!from || !to) return setError("Select both dates of the range.");
    if (to < from) return setError("The To date must be on or after the From date.");
    if (employeeId && !employee) return setError("Loading the selected employee, try again.");
    setError(null);
    const failed = await onExport({
      target,
      filterType: "custom",
      startDate: from,
      endDate: to,
      search: employee?.employeeCode || employee?.name || "",
      departmentId: departmentId || undefined,
      employeeStatus: status || undefined,
    });
    if (failed) setError(failed);
    else onClose();
  };

  return (
    <Modal
      open={open}
      title="Export Report - Attendance"
      onClose={() => {
        if (!busy) onClose();
      }}
      footer={
        <>
          <Button type="button" variant="secondary" style={{ flex: 1 }} disabled={busy} onClick={onClose}>
            Cancel
          </Button>
          <Button type="button" style={{ flex: 1 }} disabled={busy} onClick={() => void submit()}>
            {busy ? "Exporting…" : "Continue Export"}
          </Button>
        </>
      }
    >
      <div className="-mt-2 grid grid-cols-1 gap-wz-6 sm:grid-cols-2">
        <Field label="Date Range" required>
          <div className="grid grid-cols-2 gap-3">
            <Input type="date" aria-label="From" value={from} max={to || undefined} onChange={(e) => setFrom(e.target.value)} />
            <Input type="date" aria-label="To" value={to} min={from || undefined} onChange={(e) => setTo(e.target.value)} />
          </div>
        </Field>
        <Field label="Employee/ Consultant Name">
          <SearchableEmployeeSelect value={employeeId} onChange={setEmployeeId} disabled={busy} />
        </Field>
        <Field label="Department">
          <Select value={departmentId} onChange={(e) => setDepartmentId(e.target.value)}>
            <option value="">Select department</option>
            {departments.map((d) => (
              <option key={d._id} value={d._id}>
                {d.name}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Employment Status">
          <Select value={status} onChange={(e) => setStatus(e.target.value)}>
            {STATUSES.map(([v, label]) => (
              <option key={v} value={v}>
                {label}
              </option>
            ))}
          </Select>
        </Field>
        {error ? (
          <p className="m-0 text-sm text-wz-error sm:col-span-2" role="alert">
            {error}
          </p>
        ) : null}
      </div>
    </Modal>
  );
}
