import { useEffect, useMemo, useState } from "react";
import { Download, Eye, Plus, Search, SquarePen, Upload } from "lucide-react";
import {
  Badge,
  Button,
  ConfirmDialog,
  Pagination,
  TabSwitcher,
} from "../../design-system";
import {
  useDeleteDepartment,
  useDepartments,
} from "../../hooks/useDepartments";
import { ApiError } from "../../lib/apiClient";
import { saveDownload } from "../../lib/saveDownload";
import { readSessionUser } from "../../layouts/sessionUser";
import type { Department } from "../../services/departmentService";
import { canManageDepartments, canViewDepartments } from "./departmentAccess";
import DepartmentBulkUploadModal from "./DepartmentBulkUploadModal";
import DepartmentFormModal from "./DepartmentFormModal";
import DepartmentViewModal from "./DepartmentViewModal";
import { flattenOrgDesignations } from "./departmentBulk";
import {
  buildDepartmentCsv,
  departmentsWithGeofence,
  filterDepartments,
  headDisplay,
  otPolicyLabel,
  pageWindowLabel,
  shiftLabel,
  type DepartmentTab,
} from "./departmentViewModel";

const PAGE_SIZE = 10;

const thClass =
  "h-[54px] border-b border-wz-border bg-white px-4 text-left align-middle text-xs leading-[normal] font-semibold whitespace-pre-line text-wz-heading";
const tdClass =
  "h-[60px] border-b border-wz-border px-4 py-0 align-middle text-xs leading-[normal] text-wz-heading";

function dash(value?: string | null): string {
  return value && value !== "—" ? value : "—";
}

export default function DepartmentsPage() {
  const user = readSessionUser();
  const vendorId = user?.vendorId || "";
  const canView = canViewDepartments(user);
  const canManage = canManageDepartments(user);

  const [tab, setTab] = useState<DepartmentTab>("departments");
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<"create" | "edit">("create");
  const [selected, setSelected] = useState<Department | null>(null);
  const [viewOpen, setViewOpen] = useState(false);
  const [bulkOpen, setBulkOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Department | null>(null);
  const [toolbarError, setToolbarError] = useState<string | null>(null);

  const { data: departments = [], isLoading, isError, error, refetch } =
    useDepartments(vendorId, canView);
  const deleteMutation = useDeleteDepartment();

  useEffect(() => {
    const t = window.setTimeout(() => setSearch(searchInput.trim()), 250);
    return () => window.clearTimeout(t);
  }, [searchInput]);

  useEffect(() => {
    setPage(1);
  }, [search, tab]);

  const filtered = useMemo(
    () => filterDepartments(departments, search),
    [departments, search],
  );

  const locationRows = useMemo(
    () => departmentsWithGeofence(filtered),
    [filtered],
  );

  const orgDesignations = useMemo(
    () => flattenOrgDesignations(departments),
    [departments],
  );

  const filteredDesignations = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return orgDesignations;
    return orgDesignations.filter((d) => d.name.toLowerCase().includes(q));
  }, [orgDesignations, search]);

  const tableRows =
    tab === "location"
      ? locationRows
      : tab === "designations"
        ? []
        : filtered;
  const total =
    tab === "designations" ? filteredDesignations.length : tableRows.length;
  const pages = Math.max(Math.ceil(total / PAGE_SIZE), 1);
  const pageSafe = Math.min(page, pages);
  const pageRows = tableRows.slice(
    (pageSafe - 1) * PAGE_SIZE,
    pageSafe * PAGE_SIZE,
  );
  const pageDesignations = filteredDesignations.slice(
    (pageSafe - 1) * PAGE_SIZE,
    pageSafe * PAGE_SIZE,
  );

  const errorMessage =
    error instanceof ApiError
      ? error.message
      : error instanceof Error
        ? error.message
        : "Failed to load departments";

  const openCreate = () => {
    setFormMode("create");
    setSelected(null);
    setFormOpen(true);
    setToolbarError(null);
  };

  const openEdit = (dep: Department) => {
    setFormMode("edit");
    setSelected(dep);
    setFormOpen(true);
    setToolbarError(null);
  };

  const openView = (dep: Department) => {
    setSelected(dep);
    setViewOpen(true);
  };

  const handleExport = async () => {
    setToolbarError(null);
    try {
      const csv = buildDepartmentCsv(filtered);
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
      await saveDownload(
        blob,
        `Departments-Export-${new Date().toISOString().split("T")[0]}.csv`,
        "text/csv",
      );
    } catch (err) {
      setToolbarError(
        err instanceof Error ? err.message : "Failed to export departments",
      );
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteMutation.mutateAsync(deleteTarget._id);
      setDeleteTarget(null);
      setFormOpen(false);
      setSelected(null);
    } catch (err) {
      setToolbarError(
        err instanceof ApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : "Failed to delete department",
      );
      setDeleteTarget(null);
    }
  };

  if (!canView) {
    return (
      <div className="rounded-wz-xl border border-wz-border bg-white px-6 py-12 text-center text-sm text-wz-text-secondary">
        You do not have permission to view departments.
      </div>
    );
  }

  const showDeptToolbar = tab !== "designations";

  return (
    <div className="flex min-w-0 flex-col gap-wz-6">
      <TabSwitcher
        aria-label="Department modules"
        value={tab}
        onChange={setTab}
        className="self-start"
        items={[
          {
            value: "departments",
            label: "Departments",
            count: departments.length,
          },
          {
            value: "designations",
            label: "Designations",
            count: orgDesignations.length,
          },
          {
            value: "location",
            label: "Location",
            count: departmentsWithGeofence(departments).length,
          },
        ]}
      />

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
            placeholder={
              tab === "designations"
                ? "Search by designation name..."
                : "Search by department name..."
            }
            aria-label={
              tab === "designations"
                ? "Search designations"
                : "Search departments"
            }
            className="box-border h-10 w-full rounded-wz-md border border-wz-border bg-white py-0 pr-3 pl-9 text-[13px] text-wz-heading outline-none placeholder:text-wz-text-muted focus:border-wz-primary focus:shadow-[0_0_0_3px_var(--wz-state-hover)]"
          />
        </label>
        {showDeptToolbar ? (
          <div className="flex flex-wrap items-center gap-wz-4">
            {canManage ? (
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
            ) : null}
            <Button
              variant="secondary"
              size="toolbar"
              type="button"
              onClick={() => void handleExport()}
            >
              <Download className="size-4" aria-hidden />
              Export Data
            </Button>
            {canManage ? (
              <Button
                variant="primary"
                size="toolbar"
                type="button"
                onClick={openCreate}
              >
                <Plus className="size-4" aria-hidden />
                Add Department
              </Button>
            ) : null}
          </div>
        ) : null}
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
            Loading departments…
          </div>
        ) : isError ? (
          <div className="px-6 py-12 text-center text-sm text-wz-error">
            {errorMessage}{" "}
            <button
              type="button"
              className="underline"
              onClick={() => refetch()}
            >
              Retry
            </button>
          </div>
        ) : tab === "designations" ? (
          pageDesignations.length === 0 ? (
            <div className="px-6 py-12 text-center text-sm text-wz-text-secondary">
              No designations found on employees yet.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] border-collapse">
                <thead>
                  <tr>
                    {["Designation", "Employees", "Departments"].map(
                      (label) => (
                        <th key={label} className={thClass}>
                          {label}
                        </th>
                      ),
                    )}
                  </tr>
                </thead>
                <tbody>
                  {pageDesignations.map((row) => (
                    <tr key={row.name} className="hover:bg-wz-hover/40">
                      <td className={tdClass}>
                        <span className="font-semibold">{row.name}</span>
                      </td>
                      <td className={tdClass}>{row.employeeCount}</td>
                      <td className={tdClass}>{row.departmentCount}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        ) : pageRows.length === 0 ? (
          <div className="px-6 py-12 text-center text-sm text-wz-text-secondary">
            {tab === "location"
              ? "No departments with a geofence location yet."
              : "No departments found."}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1100px] border-collapse">
              <thead>
                <tr>
                  {[
                    "Department",
                    "No. of\nDesignations",
                    "Description",
                    "Default Shift",
                    "Overtime Rule",
                    "State Name",
                    "Payout Rule",
                    "Department Head /\nManager",
                    "Status",
                    "Actions",
                  ].map((label) => (
                    <th key={label} className={thClass}>
                      {label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {pageRows.map((dep) => {
                  const head = headDisplay(dep.departmentHead);
                  const designationCount =
                    typeof dep.designationCount === "number"
                      ? dep.designationCount
                      : dep.linkedDesignations?.length || 0;
                  return (
                    <tr key={dep._id} className="hover:bg-wz-hover/40">
                      <td className={tdClass}>
                        <span className="font-semibold">{dep.name}</span>
                      </td>
                      <td className={tdClass}>
                        {designationCount > 0 ? designationCount : "—"}
                      </td>
                      <td className={tdClass}>{dash(dep.description)}</td>
                      <td className={tdClass}>
                        {dash(shiftLabel(dep.shift))}
                      </td>
                      <td className={tdClass}>
                        {dash(otPolicyLabel(dep.otPolicy))}
                      </td>
                      <td className={tdClass}>{dash(dep.stateName)}</td>
                      <td className={tdClass}>{dash(dep.sitePayoutRule)}</td>
                      <td className={tdClass}>
                        {head.name === "—" ? (
                          <span className="text-wz-text-muted">—</span>
                        ) : (
                          /* Figma list: name + code only (avatar is in the view modal). */
                          <div className="min-w-0">
                            <div className="truncate font-semibold">
                              {head.name}
                            </div>
                            {head.code ? (
                              <div className="text-[11px] text-wz-text-muted">
                                {head.code}
                              </div>
                            ) : null}
                          </div>
                        )}
                      </td>
                      <td className={tdClass}>
                        {/* Status API does not exist yet — Active is the live state for all departments. */}
                        <Badge status="success">Active</Badge>
                      </td>
                      <td className={tdClass}>
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            className="inline-flex size-8 cursor-pointer items-center justify-center rounded-wz-sm border border-wz-border bg-white text-wz-heading hover:bg-wz-hover"
                            aria-label={`View ${dep.name}`}
                            onClick={() => openView(dep)}
                          >
                            <Eye size={14} />
                          </button>
                          {canManage ? (
                            <button
                              type="button"
                              className="inline-flex size-8 cursor-pointer items-center justify-center rounded-wz-sm border border-wz-border bg-white text-wz-heading hover:bg-wz-hover"
                              aria-label={`Edit ${dep.name}`}
                              onClick={() => openEdit(dep)}
                            >
                              <SquarePen size={14} />
                            </button>
                          ) : null}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {!isLoading && !isError && total > 0 ? (
          <Pagination
            page={pageSafe}
            pages={pages}
            onPageChange={setPage}
            summary={
              tab === "designations"
                ? `Showing ${(pageSafe - 1) * PAGE_SIZE + 1}–${Math.min(pageSafe * PAGE_SIZE, total)} of ${total} designations`
                : pageWindowLabel(pageSafe, PAGE_SIZE, total)
            }
          />
        ) : null}
      </div>

      <DepartmentFormModal
        open={formOpen}
        mode={formMode}
        department={selected}
        vendorId={vendorId}
        onClose={() => {
          setFormOpen(false);
          setSelected(null);
        }}
        onDelete={canManage ? (dep) => setDeleteTarget(dep) : undefined}
      />

      <DepartmentViewModal
        open={viewOpen}
        department={selected}
        onClose={() => {
          setViewOpen(false);
          setSelected(null);
        }}
      />

      <DepartmentBulkUploadModal
        open={bulkOpen}
        vendorId={vendorId}
        onClose={() => setBulkOpen(false)}
      />

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Delete department"
        message={`Are you sure you want to delete “${deleteTarget?.name || "this department"}”? This cannot be undone.`}
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
