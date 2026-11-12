import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Download, Plus, Upload } from "lucide-react";
import { Button, MonthSelect } from "../../design-system";
import {
  useAttendanceList,
  useAttendanceMonth,
  useDownloadAttendanceReport,
} from "../../hooks/useAttendance";
import { ApiError } from "../../lib/apiClient";
import {
  fileNameFromContentDisposition,
  saveDownload,
} from "../../lib/saveDownload";
import type { SessionUser } from "../../layouts/sessionUser";
import type { AttendanceListParams } from "../../services/attendanceService";
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
import AttendanceExportModal from "./AttendanceExportModal";
import AttendanceHistoryModal from "./AttendanceHistoryModal";
import AttendanceMarkModal from "./AttendanceMarkModal";
import AttendanceReporteesPanel from "./AttendanceReporteesPanel";
import AttendanceMetrics from "./AttendanceMetrics";
import AttendanceOrgCalendar from "./AttendanceOrgCalendar";
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
  /** Manager tabs, shown left of the month picker. */
  leading?: ReactNode;
};

export default function AttendanceAdminPage({
  user,
  listTarget = "org",
  calendarSubtitle = "(Organisation)",
  leading,
}: AttendanceAdminPageProps) {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [selectedDay, setSelectedDay] = useState<number | null>(now.getDate());
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [markOpen, setMarkOpen] = useState(false);
  const [bulkOpen, setBulkOpen] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const [editRow, setEditRow] = useState<NormalizedAttendanceRow | null>(null);
  const [historyRow, setHistoryRow] = useState<NormalizedAttendanceRow | null>(
    null,
  );

  const canMark = canMarkAttendance(user);
  const canBulk = canManageAttendance(user);
  const canEdit = canDirectEditAttendance(user);
  const canExport = canDownloadAttendanceReport(user, listTarget);

  useEffect(() => {
    const t = window.setTimeout(() => setSearch(searchInput.trim()), 250);
    return () => window.clearTimeout(t);
  }, [searchInput]);

  const monthQuery = useAttendanceMonth(year, month, {
    target: listTarget,
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
        filterType: selectedDay != null ? "custom" : "today",
      }),
    [listTarget, year, month, selectedDay, search],
  );
  const listQuery = useAttendanceList(listParams);
  const downloadMutation = useDownloadAttendanceReport();

  const metrics = useMemo(
    () => orgDayMetrics(listQuery.data?.stats || monthQuery.data?.stats),
    [listQuery.data?.stats, monthQuery.data?.stats],
  );

  const cells = useMemo(
    () => buildOrgCalendarCells(year, month, monthQuery.data, selectedDay),
    [year, month, monthQuery.data, selectedDay],
  );

  const rows = useMemo(
    () => (listQuery.data?.rows || []).map(normalizeAttendanceRow),
    [listQuery.data?.rows],
  );

  const shiftMonth = (delta: number) => {
    const d = new Date(year, month - 1 + delta, 1);
    setYear(d.getFullYear());
    setMonth(d.getMonth() + 1);
    setSelectedDay(null);
  };

  const onExport = async (
    params: AttendanceListParams,
  ): Promise<string | null> => {
    try {
      const result = await downloadMutation.mutateAsync(params);
      const fileName = fileNameFromContentDisposition(
        result.headers.get("content-disposition"),
        `attendance-${listTarget}-${params.startDate}-to-${params.endDate}.xlsx`,
      );
      await saveDownload(result.blob, fileName);
      return null;
    } catch (err) {
      return err instanceof ApiError
        ? err.message
        : "Unable to download the attendance report.";
    }
  };

  const dayTitle =
    selectedDay != null
      ? formatAttendanceDayTitle(year, month, selectedDay)
      : "Attendance — Today";

  const daySubtitle = "Showing all employees attendance for the selected date";

  const defaultMarkDate =
    selectedDay != null ? dateIsoForDay(year, month, selectedDay) : undefined;

  return (
    <div className="space-y-6">
      {/* Figma workspace header: month + outlined Bulk/Export + solid Mark (no page copy) */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-2">{leading}</div>
        <div className="flex flex-wrap items-center gap-4">
          <MonthSelect year={year} month={month} onShift={shiftMonth} />
          <div className="flex flex-wrap items-center gap-4">
            {canBulk ? (
              <Button
                type="button"
                variant="secondary"
                size="toolbar"
                onClick={() => setBulkOpen(true)}
              >
                <Upload className="size-4" aria-hidden />
                Bulk Upload
              </Button>
            ) : null}
            {canExport ? (
              <Button
                type="button"
                variant="secondary"
                size="toolbar"
                onClick={() => setExportOpen(true)}
              >
                <Download className="size-4" aria-hidden />
                Export Report
              </Button>
            ) : null}
            {canMark ? (
              <Button
                type="button"
                variant="primary"
                size="toolbar"
                onClick={() => setMarkOpen(true)}
              >
                <Plus className="size-4" aria-hidden />
                Mark Attendance
              </Button>
            ) : null}
          </div>
        </div>
      </div>

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

      {listTarget === "team" ? (
        <AttendanceReporteesPanel
          onView={setHistoryRow}
          onViewAll={() => {
            const t = new Date();
            setYear(t.getFullYear());
            setMonth(t.getMonth() + 1);
            setSelectedDay(t.getDate());
            document
              .getElementById("attendance-day-table")
              ?.scrollIntoView({ behavior: "smooth" });
          }}
        />
      ) : null}

      <AttendanceOrgCalendar
        monthLabel={monthLabel(year, month)}
        subtitle={calendarSubtitle}
        cells={cells}
        onPrev={() => shiftMonth(-1)}
        onNext={() => shiftMonth(1)}
        onSelectDay={(day) => {
          setSelectedDay((prev) => (prev === day ? null : day));
        }}
      />

      <div id="attendance-day-table">
        <AttendanceDayTable
          title={dayTitle}
          subtitle={daySubtitle}
          rows={rows}
          loading={listQuery.isLoading || listQuery.isFetching}
          search={searchInput}
          onSearchChange={setSearchInput}
          canEdit={canEdit}
          onEdit={(row) => setEditRow(row)}
          onHistory={(row) => setHistoryRow(row)}
        />
      </div>

      <AttendanceMarkModal
        open={markOpen}
        onClose={() => setMarkOpen(false)}
        defaultDate={defaultMarkDate}
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
      <AttendanceExportModal
        open={exportOpen}
        onClose={() => setExportOpen(false)}
        target={listTarget}
        vendorId={user?.vendorId || null}
        year={year}
        month={month}
        busy={downloadMutation.isPending}
        onExport={onExport}
      />
    </div>
  );
}
