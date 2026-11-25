import { useEffect, useMemo, useState } from "react";
import { Plus, Search, SquarePen, Trash2, Upload } from "lucide-react";
import {
  Badge,
  Button,
  ConfirmDialog,
  FilterSelect,
  Pagination,
} from "../../../design-system";
import { ApiError } from "../../../lib/apiClient";
import { readSessionUser } from "../../../layouts/sessionUser";
import {
  useDeleteHoliday,
  useHolidays,
} from "../../../hooks/useHolidays";
import {
  HOLIDAY_TYPES,
  holidayTypeLabel,
  type Holiday,
  type HolidayType,
} from "../../../services/holidayService";
import HolidayBulkUploadModal from "./HolidayBulkUploadModal";
import HolidayFormModal from "./HolidayFormModal";

const PAGE_SIZE = 10;

const thClass =
  "h-[54px] border-b border-wz-border bg-white px-4 text-left align-middle text-xs leading-[normal] font-semibold text-wz-heading";
const tdClass =
  "h-[60px] border-b border-wz-border px-4 py-0 align-middle text-xs leading-[normal] text-wz-heading";

const TYPE_BADGE: Record<HolidayType, "info" | "success" | "warning" | "neutral"> = {
  National: "info",
  Festival: "success",
  Restricted: "warning",
  Company: "neutral",
};

/** ISO → "26 Jan 2026" (local, no UTC day-shift for date-only values). */
const formatDisplayDate = (value: string): string => {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(value || "");
  const date = m
    ? new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]))
    : new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

/** Weekday for the "Date & Day" column. */
const formatDay = (value: string): string => {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(value || "");
  const date = m
    ? new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]))
    : new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("en-IN", { weekday: "long" });
};

export function HolidaysTab() {
  const vendorId = readSessionUser()?.vendorId ?? "";
  const currentYear = new Date().getFullYear();

  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [year, setYear] = useState(currentYear);
  const [page, setPage] = useState(1);
  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<"create" | "edit">("create");
  const [selected, setSelected] = useState<Holiday | null>(null);
  const [bulkOpen, setBulkOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Holiday | null>(null);
  const [toolbarError, setToolbarError] = useState<string | null>(null);

  const {
    data: holidays = [],
    isLoading,
    isError,
    error,
    refetch,
  } = useHolidays({ vendorId, year });
  const deleteMutation = useDeleteHoliday();

  useEffect(() => {
    // Debounced search — page resets here (async, alongside the search update).
    const t = window.setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(1);
    }, 250);
    return () => window.clearTimeout(t);
  }, [searchInput]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return holidays
      .filter((h) => (q ? h.name.toLowerCase().includes(q) : true))
      .filter((h) => (typeFilter ? h.type === typeFilter : true))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [holidays, search, typeFilter]);

  const total = filtered.length;
  const pages = Math.max(Math.ceil(total / PAGE_SIZE), 1);
  const pageSafe = Math.min(page, pages);
  const pageRows = filtered.slice(
    (pageSafe - 1) * PAGE_SIZE,
    pageSafe * PAGE_SIZE,
  );

  const errorMessage =
    error instanceof ApiError
      ? error.message
      : error instanceof Error
        ? error.message
        : "Failed to load holidays";

  const openCreate = () => {
    setFormMode("create");
    setSelected(null);
    setFormOpen(true);
    setToolbarError(null);
  };

  const openEdit = (holiday: Holiday) => {
    if (!holiday._id || holiday.source === "weekOff") {
      setToolbarError(
        "Legacy holidays from WeekOff settings cannot be edited here.",
      );
      return;
    }
    setFormMode("edit");
    setSelected(holiday);
    setFormOpen(true);
    setToolbarError(null);
  };

  const confirmDelete = async () => {
    if (!deleteTarget?._id) return;
    try {
      await deleteMutation.mutateAsync(deleteTarget._id);
      setDeleteTarget(null);
    } catch (err) {
      setToolbarError(
        err instanceof ApiError
          ? err.message
          : "Failed to delete holiday",
      );
      setDeleteTarget(null);
    }
  };

  const requestDelete = (holiday: Holiday) => {
    if (!holiday._id || holiday.source === "weekOff") {
      setToolbarError(
        "Legacy holidays from WeekOff settings cannot be deleted here.",
      );
      return;
    }
    setDeleteTarget(holiday);
  };

  return (
    <div className="flex min-w-0 flex-col gap-wz-6">
      <div>
        <h2 className="m-0 text-lg leading-[23px] font-bold text-wz-heading">
          Holiday Calendar
        </h2>
        <p className="m-0 mt-1 text-xs leading-[15px] text-wz-text-muted">
          Manage organization-wide and department-specific paid holidays.
        </p>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-wz-4">
        <label className="relative w-[300px] max-w-full">
          <Search
            size={16}
            aria-hidden
            className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-wz-text-muted"
          />
          <input
            type="search"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search by holiday name..."
            aria-label="Search holidays"
            className="box-border h-10 w-full rounded-wz-md border border-wz-border bg-white py-0 pr-3 pl-9 text-[13px] text-wz-heading outline-none placeholder:text-wz-text-muted focus:border-wz-primary focus:shadow-[0_0_0_3px_var(--wz-state-hover)]"
          />
        </label>

        <div
          className="flex flex-wrap items-center gap-wz-4"
          role="group"
          aria-label="Holiday filters"
        >
          <FilterSelect
            value={typeFilter}
            onChange={(e) => {
              setTypeFilter(e.target.value);
              setPage(1);
            }}
            aria-label="Filter by type"
          >
            <option value="">Type</option>
            {HOLIDAY_TYPES.map((type) => (
              <option key={type} value={type}>
                {holidayTypeLabel(type)}
              </option>
            ))}
          </FilterSelect>
          <FilterSelect
            value={String(year)}
            onChange={(e) => {
              setYear(Number(e.target.value));
              setPage(1);
            }}
            aria-label="Filter by year"
          >
            {[currentYear - 1, currentYear, currentYear + 1].map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </FilterSelect>
          <Button
            variant="secondary"
            size="toolbar"
            type="button"
            onClick={() => {
              setToolbarError(null);
              setBulkOpen(true);
            }}
          >
            <Upload className="size-4" aria-hidden />
            Bulk Upload
          </Button>
          <Button
            variant="primary"
            size="toolbar"
            type="button"
            onClick={openCreate}
          >
            <Plus className="size-4" aria-hidden />
            Add Holiday
          </Button>
        </div>
      </div>

      {toolbarError ? (
        <div
          className="rounded-wz-md border border-wz-error/35 bg-wz-error/8 px-3.5 py-2.5 text-xs text-wz-error"
          role="alert"
        >
          {toolbarError}
        </div>
      ) : null}

      <div className="overflow-hidden rounded-wz-xl border border-wz-border bg-white">
        {isLoading ? (
          <div className="px-6 py-12 text-center text-sm text-wz-text-secondary">
            Loading holidays…
          </div>
        ) : isError ? (
          <div className="px-6 py-12 text-center text-sm text-wz-error">
            {errorMessage}{" "}
            <button type="button" className="underline" onClick={() => refetch()}>
              Retry
            </button>
          </div>
        ) : pageRows.length === 0 ? (
          <div className="px-6 py-12 text-center text-sm text-wz-text-secondary">
            {holidays.length === 0
              ? `No holidays configured for ${year}.`
              : "No holidays match your search."}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1100px] border-collapse">
              <thead>
                <tr>
                  {[
                    "Date & Day",
                    "Holiday",
                    "Description",
                    "States",
                    "Department",
                    "Created By\n(HR/Admin)",
                    "Type",
                    "Actions",
                  ].map((label) => (
                    <th key={label} className={thClass}>
                      {label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {pageRows.map((holiday) => (
                  <tr
                    key={holiday._id || `${holiday.name}-${holiday.date}`}
                    className="hover:bg-wz-hover/40"
                  >
                    <td className={tdClass}>
                      <div className="font-semibold">
                        {formatDisplayDate(holiday.date)}
                      </div>
                      <div className="text-[11px] text-wz-text-muted">
                        {formatDay(holiday.date)}
                      </div>
                    </td>
                    <td className={tdClass}>
                      <span className="font-semibold">{holiday.name}</span>
                    </td>
                    <td className={tdClass}>
                      <span className="text-wz-text-muted">
                        {holiday.description || "—"}
                      </span>
                    </td>
                    <td className={tdClass}>{holiday.state || "All"}</td>
                    <td className={tdClass}>
                      {holiday.department || "All Departments"}
                    </td>
                    <td className={tdClass}>
                      {holiday.createdBy || "HR/Admin"}
                    </td>
                    <td className={tdClass}>
                      <Badge status={TYPE_BADGE[holiday.type] ?? "neutral"}>
                        {holidayTypeLabel(holiday.type)}
                      </Badge>
                    </td>
                    <td className={tdClass}>
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          className="inline-flex size-8 cursor-pointer items-center justify-center rounded-wz-sm border border-wz-border bg-white text-wz-heading hover:bg-wz-hover disabled:cursor-not-allowed disabled:opacity-50"
                          aria-label={`Edit ${holiday.name}`}
                          disabled={!holiday._id}
                          onClick={() => openEdit(holiday)}
                        >
                          <SquarePen size={14} />
                        </button>
                        <button
                          type="button"
                          className="inline-flex size-8 cursor-pointer items-center justify-center rounded-wz-sm border border-wz-border bg-white text-wz-danger hover:bg-wz-hover disabled:cursor-not-allowed disabled:opacity-50"
                          aria-label={`Delete ${holiday.name}`}
                          disabled={!holiday._id}
                          onClick={() => requestDelete(holiday)}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {!isLoading && !isError && total > 0 ? (
          <Pagination
            page={pageSafe}
            pages={pages}
            onPageChange={setPage}
            summary={`Showing ${(pageSafe - 1) * PAGE_SIZE + 1}–${Math.min(pageSafe * PAGE_SIZE, total)} of ${total} entries`}
          />
        ) : null}
      </div>

      <HolidayFormModal
        key={
          formOpen
            ? `holiday-${formMode}-${selected?._id ?? "new"}`
            : "holiday-closed"
        }
        open={formOpen}
        mode={formMode}
        holiday={selected}
        vendorId={vendorId}
        onClose={() => {
          setFormOpen(false);
          setSelected(null);
        }}
      />

      <HolidayBulkUploadModal
        open={bulkOpen}
        onClose={() => setBulkOpen(false)}
      />

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Delete holiday"
        message={`Are you sure you want to delete “${deleteTarget?.name || "this holiday"}”? This cannot be undone.`}
        tone="destructive"
        confirmLabel={deleteMutation.isPending ? "Deleting…" : "Delete"}
        loading={deleteMutation.isPending}
        onConfirm={() => void confirmDelete()}
        onClose={() => {
          if (!deleteMutation.isPending) setDeleteTarget(null);
        }}
      />
    </div>
  );
}

export default HolidaysTab;
