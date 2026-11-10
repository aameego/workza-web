import { useEffect, useMemo, useState } from "react";
import { CalendarDays, Download, FileSpreadsheet, Plus, Upload } from "lucide-react";
import { Button } from "../../design-system";
import {
  useAttendanceList,
  useAttendanceMonth,
  useDownloadAttendanceReport,
} from "../../hooks/useAttendance";
import { useDepartmentNames } from "../../hooks/useDepartmentNames";
import { ApiError } from "../../lib/apiClient";
import {
  fileNameFromContentDisposition,
  saveDownload,
} from "../../lib/saveDownload";
import type { SessionUser } from "../../layouts/sessionUser";
import { monthLabel } from "../employees/attendanceCalendar";
import {
  canDirectEditAttendance,
  canDownloadAttendanceReport,
  canManageAttendance,
  canMarkAttendance,
} from "./attendanceAccess";
import AttendanceBulkUploadModal from "./AttendanceBulkUploadModal";
import AttendanceDayTable from "./AttendanceDayTable";
import AttendanceEditModal from "./AttendanceEditModal";
import AttendanceHistoryModal from "./AttendanceHistoryModal";
import AttendanceMarkModal from "./AttendanceMarkModal";
import AttendanceMarkMonthModal from "./AttendanceMarkMonthModal";
import AttendanceMetrics from "./AttendanceMetrics";
import AttendanceMonthlyReportModal from "./AttendanceMonthlyReportModal";
import AttendanceOrgCalendar from "./AttendanceOrgCalendar";
import SearchableEmployeeSelect from "./SearchableEmployeeSelect";
import {
  buildAttendanceListParams,
  buildOrgCalendarCells,
  dateIsoForDay,
  formatAttendanceDayTitle,
  normalizeAttendanceRow,
  orgDayMetrics,
  type NormalizedAttendanceRow,
} from "./attendanceViewModel";

export type AttendanceAdminPageProps = {
  user: SessionUser | null;
  listTarget?: "org" | "team";
  calendarSubtitle?: string;
  /** Hide page title when embedded under manager tabs. */
  embedded?: boolean;
};

export default function AttendanceAdminPage({
  user,
  listTarget = "org",
  calendarSubtitle = "(Organisation)",
  embedded = false,
}: AttendanceAdminPageProps) {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [selectedDay, setSelectedDay] = useState<number | null>(now.getDate());
  const [filterType, setFilterType] = useState("today");
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [departmentId, setDepartmentId] = useState("");
  const [employeeStatus, setEmployeeStatus] = useState("");
  const [orgEmployeeId, setOrgEmployeeId] = useState("");
  const [markOpen, setMarkOpen] = useState(false);
  const [markMonthOpen, setMarkMonthOpen] = useState(false);
  const [bulkOpen, setBulkOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [editRow, setEditRow] = useState<NormalizedAttendanceRow | null>(null);
  const [historyRow, setHistoryRow] = useState<NormalizedAttendanceRow | null>(
    null,
  );
  const [actionError, setActionError] = useState<string | null>(null);

  const canMark = canMarkAttendance(user);
  const canBulk = canManageAttendance(user);
  const canEdit = canDirectEditAttendance(user);
  const canExport = canDownloadAttendanceReport(user, listTarget);
  const vendorId = user?.vendorId || null;

  const { data: departments = [] } = useDepartmentNames(vendorId);

  useEffect(() => {
    const t = window.setTimeout(() => setSearch(searchInput.trim()), 250);
    return () => window.clearTimeout(t);
  }, [searchInput]);

  const monthQuery = useAttendanceMonth(year, month, {
    target: listTarget,
    employeeId: orgEmployeeId || undefined,
  });
  const listParams = useMemo(
    () =>
      buildAttendanceListParams({
        target: listTarget,
        year,
        month,
        selectedDay,
        search,
        page: 1,
        limit: 100,
        filterType,
        departmentId,
        employeeStatus,
      }),
    [
      listTarget,
      year,
      month,
      selectedDay,
      search,
      filterType,
      departmentId,
      employeeStatus,
    ],
  );
  const listQuery = useAttendanceList(listParams);
  const downloadMutation = useDownloadAttendanceReport();

  const metrics = useMemo(
    () =>
      orgEmployeeId
        ? orgDayMetrics(monthQuery.data?.stats)
        : orgDayMetrics(listQuery.data?.stats || monthQuery.data?.stats),
    [orgEmployeeId, listQuery.data?.stats, monthQuery.data?.stats],
  );

  const cells = useMemo(
    () => buildOrgCalendarCells(year, month, monthQuery.data, selectedDay),
    [year, month, monthQuery.data, selectedDay],
  );

  const rows = useMemo(
    () => (listQuery.data?.rows || []).map(normalizeAttendanceRow),
    [listQuery.data?.rows],
  );

  const departmentOptions = useMemo(
    () => (departments || []).map((d) => ({ _id: d._id, name: d.name })),
    [departments],
  );

  const shiftMonth = (delta: number) => {
    const d = new Date(year, month - 1 + delta, 1);
    setYear(d.getFullYear());
    setMonth(d.getMonth() + 1);
    setSelectedDay(null);
  };

  const onFilterTypeChange = (next: string) => {
    setFilterType(next);
    setSelectedDay(null);
  };

  const onExport = async () => {
    setActionError(null);
    try {
      const result = await downloadMutation.mutateAsync(listParams);
      const fileName = fileNameFromContentDisposition(
        result.headers.get("content-disposition"),
        `attendance-${listTarget}-${year}-${String(month).padStart(2, "0")}.xlsx`,
      );
      await saveDownload(result.blob, fileName);
    } catch (err) {
      setActionError(
        err instanceof ApiError
          ? err.message
          : "Unable to download the attendance report.",
      );
    }
  };

  const dayTitle =
    selectedDay != null
      ? formatAttendanceDayTitle(year, month, selectedDay)
      : filterType === "7days"
        ? "Attendance — Last 7 days"
        : filterType === "30days"
          ? "Attendance — Last 30 days"
          : "Attendance — Today";

  const defaultMarkDate =
    selectedDay != null
      ? dateIsoForDay(year, month, selectedDay)
      : undefined;

  return (
    <div className="space-y-wz-5">
      <div className="flex flex-wrap items-start justify-between gap-wz-3">
        {embedded ? (
          <div />
        ) : (
          <div>
            <h1 className="m-0 text-xl font-semibold text-wz-text-primary">
              Attendance
            </h1>
            <p className="m-0 mt-1 text-sm text-wz-text-secondary">
              Track organisation attendance for {monthLabel(year, month)}.
            </p>
          </div>
        )}
        <div className="flex flex-wrap items-center gap-2">
          {canExport ? (
            <>
              <Button
                type="button"
                variant="secondary"
                onClick={() => void onExport()}
                disabled={downloadMutation.isPending}
              >
                <Download className="size-4" aria-hidden />
                {downloadMutation.isPending ? "Exporting…" : "Export Report"}
              </Button>
              {canBulk ? (
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setReportOpen(true)}
                >
                  <FileSpreadsheet className="size-4" aria-hidden />
                  Monthly Report
                </Button>
              ) : null}
            </>
          ) : null}
          {canBulk ? (
            <>
              <Button
                type="button"
                variant="secondary"
                onClick={() => setBulkOpen(true)}
              >
                <Upload className="size-4" aria-hidden />
                Bulk Upload
              </Button>
              <Button
                type="button"
                variant="secondary"
                onClick={() => setMarkMonthOpen(true)}
              >
                <CalendarDays className="size-4" aria-hidden />
                Mark Month
              </Button>
            </>
          ) : null}
          {canMark ? (
            <Button
              type="button"
              variant="primary"
              onClick={() => setMarkOpen(true)}
            >
              <Plus className="size-4" aria-hidden />
              Mark Attendance
            </Button>
          ) : null}
        </div>
      </div>

      {actionError ? (
        <p className="m-0 text-sm text-wz-error" role="alert">
          {actionError}
        </p>
      ) : null}

      {monthQuery.isError || listQuery.isError ? (
        <p className="m-0 text-sm text-wz-error" role="alert">
          {(monthQuery.error instanceof ApiError
            ? monthQuery.error.message
            : null) ||
            (listQuery.error instanceof ApiError
              ? listQuery.error.message
              : null) ||
            "Could not load attendance."}
        </p>
      ) : null}

      <AttendanceMetrics metrics={metrics} />

      <AttendanceOrgCalendar
        monthLabel={monthLabel(year, month)}
        subtitle={calendarSubtitle}
        cells={cells}
        onPrev={() => shiftMonth(-1)}
        onNext={() => shiftMonth(1)}
        onSelectDay={(day) => {
          setSelectedDay((prev) => (prev === day ? null : day));
          setFilterType("custom");
        }}
        toolbar={
          listTarget === "org" ? (
            <div className="w-56">
              <SearchableEmployeeSelect
                value={orgEmployeeId}
                onChange={setOrgEmployeeId}
                placeholder="All Employees"
                allowClear
              />
            </div>
          ) : null
        }
      />

      <AttendanceDayTable
        title={dayTitle}
        subtitle={
          selectedDay == null && filterType === "today"
            ? "Showing today’s records. Pick a calendar day or a range preset."
            : undefined
        }
        rows={rows}
        loading={listQuery.isLoading || listQuery.isFetching}
        search={searchInput}
        onSearchChange={setSearchInput}
        showRosterFilters
        showRangePresets
        filterType={selectedDay != null ? "custom" : filterType}
        onFilterTypeChange={onFilterTypeChange}
        departmentId={departmentId}
        onDepartmentChange={setDepartmentId}
        employeeStatus={employeeStatus}
        onEmployeeStatusChange={setEmployeeStatus}
        departments={departmentOptions}
        canEdit={canEdit}
        onEdit={(row) => setEditRow(row)}
        onHistory={(row) => setHistoryRow(row)}
      />

      <AttendanceMarkModal
        open={markOpen}
        onClose={() => setMarkOpen(false)}
        defaultDate={defaultMarkDate}
      />
      <AttendanceMarkMonthModal
        open={markMonthOpen}
        onClose={() => setMarkMonthOpen(false)}
        defaultMonth={month}
        defaultYear={year}
      />
      <AttendanceEditModal
        open={Boolean(editRow)}
        record={editRow}
        onClose={() => setEditRow(null)}
      />
      <AttendanceHistoryModal
        open={Boolean(historyRow)}
        onClose={() => setHistoryRow(null)}
        row={historyRow}
      />
      <AttendanceBulkUploadModal
        open={bulkOpen}
        onClose={() => setBulkOpen(false)}
        defaultMonth={month}
        defaultYear={year}
      />
      <AttendanceMonthlyReportModal
        open={reportOpen}
        onClose={() => setReportOpen(false)}
      />
    </div>
  );
}
