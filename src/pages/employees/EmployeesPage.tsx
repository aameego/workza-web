import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Check, Copy, Search } from "lucide-react";
import { Badge, Button, cn, FilterSelect } from "../../design-system";
import { useDepartmentNames } from "../../hooks/useDepartmentNames";
import { useEmployees } from "../../hooks/useEmployees";
import { useRoles } from "../../hooks/useRoles";
import { readSessionUser } from "../../layouts/sessionUser";
import { ApiError } from "../../lib/apiClient";
import {
  fileNameFromContentDisposition,
  saveDownload,
} from "../../lib/saveDownload";
import { exportEmployees } from "../../services/employeeService";
import BulkUploadModal from "./BulkUploadModal";
import EmployeeRowActions from "./EmployeeRowActions";
import type { DirectoryTab } from "./employeeListHelpers";
import {
  APP_LOGIN_FILTER_OPTIONS,
  DEFAULT_ACCESS_ROLE_OPTIONS,
  STATUS_FILTER_OPTIONS,
  appLoginBadge,
  appLoginLabel,
  employmentActiveBadge,
  employmentActiveLabel,
  employmentTypeBadge,
  employmentTypeLabel,
  pageWindowLabel,
  paginationItems,
} from "./employeeListHelpers";


const PAGE_SIZE = 10;

const tabClass = (active: boolean) =>
  cn(
    "inline-flex h-[34px] cursor-pointer items-center gap-2 rounded-wz-full border px-3.5 text-sm font-semibold",
    active
      ? "border-wz-primary bg-wz-hover text-wz-primary"
      : "border-wz-border bg-white text-wz-text-secondary hover:bg-wz-neutral-50",
  );

const tabCountClass = (active: boolean) =>
  cn(
    "inline-flex h-5 min-w-[22px] items-center justify-center rounded-wz-full px-1.5 text-[11px] font-semibold",
    active
      ? "bg-wz-selected text-wz-primary"
      : "bg-wz-neutral-100 text-wz-text-secondary",
  );

const pageBtnClass = (active = false) =>
  cn(
    "h-8 min-w-8 cursor-pointer rounded-wz-md border px-2 text-xs font-semibold disabled:cursor-not-allowed disabled:opacity-45",
    active
      ? "border-wz-primary bg-wz-primary text-white"
      : "border-wz-border bg-white text-wz-text hover:enabled:bg-wz-neutral-50",
  );

export default function EmployeesPage() {
  const navigate = useNavigate();
  const { vendorSlug } = useParams();
  const user = readSessionUser();
  const vendorId = user?.vendorId || null;
  const base = `/${vendorSlug || "app"}`;

  const [directory, setDirectory] = useState<DirectoryTab>("employee");
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [departmentId, setDepartmentId] = useState("");
  const [appLogin, setAppLogin] = useState("");
  const [role, setRole] = useState("");
  const [page, setPage] = useState(1);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [bulkOpen, setBulkOpen] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [toolbarError, setToolbarError] = useState<string | null>(null);

  const addEmployeeHref =
    directory === "consultancy"
      ? `${base}/employees/new?type=consultancy`
      : `${base}/employees/new`;

  useEffect(() => {
    const t = window.setTimeout(() => setSearch(searchInput.trim()), 300);
    return () => window.clearTimeout(t);
  }, [searchInput]);

  useEffect(() => {
    setPage(1);
  }, [directory, search, status, departmentId, appLogin, role]);

  const listParams = useMemo(
    () => ({
      page,
      limit: PAGE_SIZE,
      search: search || undefined,
      status: status || undefined,
      departmentId: departmentId || undefined,
      appLogin: appLogin || undefined,
      role: role || undefined,
      isConsultancy: directory === "consultancy",
      isPagination: "true" as const,
    }),
    [page, search, status, departmentId, appLogin, role, directory],
  );

  const { data, isLoading, isFetching, isError, error, refetch } =
    useEmployees(listParams);
  const { data: departments = [] } = useDepartmentNames(vendorId);
  const { data: roles = [] } = useRoles(Boolean(vendorId));

  const accessRoleOptions = useMemo(() => {
    const fromApi = roles
      .filter((r) => !r.isAdmin && r.roleName && r.roleName !== "Admin")
      .map((r) => r.roleName);
    const merged = [
      ...DEFAULT_ACCESS_ROLE_OPTIONS,
      ...fromApi.filter(
        (name) =>
          !(DEFAULT_ACCESS_ROLE_OPTIONS as readonly string[]).includes(name),
      ),
    ];
    return [...new Set(merged)];
  }, [roles]);

  const employees = data?.employees ?? [];
  const pagination = data?.pagination ?? {
    page: 1,
    limit: PAGE_SIZE,
    total: 0,
    pages: 0,
  };
  const pages = Math.max(pagination.pages || 0, 0);
  const pageItems = paginationItems(page, pages);

  const copyContact = async (
    id: string,
    kind: "email" | "phone",
    value: string,
  ) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopiedKey(`${id}-${kind}`);
      window.setTimeout(() => setCopiedKey(null), 1500);
    } catch {
      /* ignore clipboard failures */
    }
  };

  const switchDirectory = (next: DirectoryTab) => {
    if (next === directory) return;
    setDirectory(next);
    setSearchInput("");
    setSearch("");
    setStatus("");
    setDepartmentId("");
    setAppLogin("");
    setRole("");
  };

  const errorMessage =
    error instanceof ApiError
      ? error.message
      : error instanceof Error
        ? error.message
        : "Failed to load employees";

  const handleExport = async () => {
    if (exporting) return;
    setToolbarError(null);
    setExporting(true);
    try {
      const { blob, headers } = await exportEmployees({
        search: search || undefined,
        status: status || undefined,
        departmentId: departmentId || undefined,
        appLogin: appLogin || undefined,
        role: role || undefined,
        isConsultancy: directory === "consultancy",
      });
      const fallback = `${
        directory === "consultancy" ? "Consultants" : "Employees"
      }-Export-${new Date().toISOString().split("T")[0]}.xlsx`;
      const fileName = fileNameFromContentDisposition(
        headers.get("content-disposition"),
        fallback,
      );
      await saveDownload(blob, fileName);
    } catch (err) {
      setToolbarError(
        err instanceof ApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : "Failed to export employees",
      );
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="flex min-w-0 flex-col gap-wz-5">
      <div
        className="flex flex-wrap items-center gap-wz-2"
        role="tablist"
        aria-label="Employee directory"
      >
        <button
          type="button"
          role="tab"
          aria-selected={directory === "employee"}
          className={tabClass(directory === "employee")}
          onClick={() => switchDirectory("employee")}
        >
          Employees
          {directory === "employee" ? (
            <span className={tabCountClass(true)}>{pagination.total}</span>
          ) : null}
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={directory === "consultancy"}
          className={tabClass(directory === "consultancy")}
          onClick={() => switchDirectory("consultancy")}
        >
          Consultancy
          {directory === "consultancy" ? (
            <span className={tabCountClass(true)}>{pagination.total}</span>
          ) : null}
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-wz-3">
        <label className="relative max-w-[360px] min-w-[200px] flex-[1_1_240px]">
          <Search
            size={16}
            aria-hidden
            className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-wz-neutral-500"
          />
          <input
            type="search"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search by employees name or code..."
            aria-label="Search employees"
            className="box-border h-10 w-full rounded-wz-md border border-wz-border bg-white py-0 pr-3 pl-9 text-sm text-wz-text outline-none focus:border-wz-primary focus:shadow-[0_0_0_3px_var(--wz-state-hover)]"
          />
        </label>

        <div className="ml-auto flex w-full flex-wrap gap-wz-2 max-[900px]:ml-0 sm:w-auto">
          <Button
            variant="secondary"
            type="button"
            onClick={() => {
              setToolbarError(null);
              setBulkOpen(true);
            }}
          >
            Bulk Upload
          </Button>
          <Button
            variant="secondary"
            type="button"
            onClick={() => void handleExport()}
            disabled={exporting}
          >
            {exporting ? "Exporting…" : "Export Data"}
          </Button>
          <Button
            variant="primary"
            type="button"
            onClick={() => navigate(addEmployeeHref)}
          >
            {directory === "consultancy" ? "+ Add Consultant" : "+ Add Employee"}
          </Button>
        </div>
      </div>

      <div
        className="flex flex-wrap items-center gap-wz-3"
        role="group"
        aria-label="Employee filters"
      >
        <FilterSelect
          value={departmentId}
          onChange={(e) => setDepartmentId(e.target.value)}
          aria-label="Filter by department"
        >
          <option value="">Departments</option>
          {departments.map((d) => (
            <option key={d._id} value={d._id}>
              {d.name}
            </option>
          ))}
        </FilterSelect>

        <FilterSelect
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          aria-label="Filter by employee status"
        >
          {STATUS_FILTER_OPTIONS.map((opt) => (
            <option key={opt.value || "all"} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </FilterSelect>

        <FilterSelect
          value={appLogin}
          onChange={(e) => setAppLogin(e.target.value)}
          aria-label="Filter by app login"
        >
          {APP_LOGIN_FILTER_OPTIONS.map((opt) => (
            <option key={opt.value || "all-login"} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </FilterSelect>

        <FilterSelect
          value={role}
          onChange={(e) => setRole(e.target.value)}
          aria-label="Filter by access role"
        >
          <option value="">Access Roles</option>
          {accessRoleOptions.map((roleName) => (
            <option key={roleName} value={roleName}>
              {roleName}
            </option>
          ))}
        </FilterSelect>
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
            Loading employees…
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
        ) : employees.length === 0 ? (
          <div className="px-6 py-12 text-center text-sm text-wz-text-secondary">
            No {directory === "consultancy" ? "consultants" : "employees"} found.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[980px] border-collapse">
              <thead>
                <tr>
                  {[
                    "Employee",
                    "Contact",
                    "Designation",
                    "Department",
                    "State",
                    "Reporting Manager",
                    "App Login",
                    "Status",
                    "Actions",
                  ].map((h) => (
                    <th
                      key={h}
                      className="whitespace-nowrap bg-wz-neutral-50 px-4 py-3.5 text-left text-xs font-semibold text-wz-text-secondary"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {employees.map((emp) => {
                  const typeLabel = employmentTypeLabel(emp);
                  return (
                    <tr
                      key={emp._id}
                      className="hover:bg-wz-neutral-50 [&:last-child>td]:border-b-0"
                    >
                      <td className="border-b border-wz-border px-4 py-3.5 align-top text-sm text-wz-text">
                        <div className="flex min-w-[140px] flex-col gap-0.5">
                          <strong
                            className="text-sm font-semibold text-wz-text"
                            title={emp.name}
                          >
                            {emp.name || "—"}
                          </strong>
                          <span className="text-xs text-wz-text-secondary">
                            {emp.employeeCode || "—"}
                          </span>
                        </div>
                      </td>
                      <td className="border-b border-wz-border px-4 py-3.5 align-top text-sm">
                        <div className="flex min-w-[160px] flex-col gap-1">
                          {(
                            [
                              ["email", emp.email],
                              ["phone", emp.phone],
                            ] as const
                          ).map(([kind, value]) => (
                            <div
                              key={kind}
                              className="flex max-w-[200px] items-center gap-1.5"
                            >
                              <span
                                className="truncate text-xs text-wz-text-secondary"
                                title={value || ""}
                              >
                                {value || "—"}
                              </span>
                              {value ? (
                                <button
                                  type="button"
                                  className="inline-flex size-[22px] shrink-0 cursor-pointer items-center justify-center rounded-wz-sm border-0 bg-transparent text-wz-neutral-500 hover:bg-wz-neutral-100 hover:text-wz-primary"
                                  aria-label={`Copy ${kind}`}
                                  onClick={() =>
                                    void copyContact(emp._id, kind, value)
                                  }
                                >
                                  {copiedKey === `${emp._id}-${kind}` ? (
                                    <Check size={12} />
                                  ) : (
                                    <Copy size={12} />
                                  )}
                                </button>
                              ) : null}
                            </div>
                          ))}
                        </div>
                      </td>
                      <td
                        className="border-b border-wz-border px-4 py-3.5 align-top text-sm text-wz-text"
                        title={emp.designation || ""}
                      >
                        {emp.designation || "—"}
                      </td>
                      <td
                        className="border-b border-wz-border px-4 py-3.5 align-top text-sm text-wz-text"
                        title={emp.department || ""}
                      >
                        {emp.department || "—"}
                      </td>
                      <td
                        className="border-b border-wz-border px-4 py-3.5 align-top text-sm text-wz-text-secondary"
                        title={emp.stateName || ""}
                      >
                        {emp.stateName || "—"}
                      </td>
                      <td
                        className="border-b border-wz-border px-4 py-3.5 align-top text-sm text-wz-text"
                        title={emp.managerId?.name || ""}
                      >
                        {emp.managerId?.name || "—"}
                      </td>
                      <td className="border-b border-wz-border px-4 py-3.5 align-top">
                        <Badge status={appLoginBadge(emp)} size="sm">
                          {appLoginLabel(emp)}
                        </Badge>
                      </td>
                      <td className="border-b border-wz-border px-4 py-3.5 align-top">
                        <div className="flex flex-wrap gap-1.5">
                          <Badge status={employmentActiveBadge(emp)} size="sm">
                            {employmentActiveLabel(emp)}
                          </Badge>
                          {typeLabel ? (
                            <Badge status={employmentTypeBadge(emp)} size="sm">
                              {typeLabel}
                            </Badge>
                          ) : null}
                        </div>
                      </td>
                      <td className="border-b border-wz-border px-4 py-3.5 align-top">
                        <EmployeeRowActions
                          employee={emp}
                          directory={directory}
                          vendorSlug={vendorSlug || "app"}
                          user={user}
                          basePath={base}
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {!isError && employees.length > 0 ? (
          <div className="flex flex-wrap items-center justify-between gap-wz-3 border-t border-wz-border bg-white px-4 py-3.5">
            <div className="text-xs text-wz-text-secondary">
              {pageWindowLabel(page, PAGE_SIZE, pagination.total)}
              {isFetching && !isLoading ? " · Updating…" : null}
            </div>
            <div className="flex flex-wrap items-center gap-1.5">
              <button
                type="button"
                className={pageBtnClass()}
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                Previous
              </button>
              {pageItems.map((item, idx) =>
                item === "ellipsis" ? (
                  <span
                    key={`e-${idx}`}
                    className="px-1 text-xs text-wz-text-secondary"
                  >
                    …
                  </span>
                ) : (
                  <button
                    key={item}
                    type="button"
                    className={pageBtnClass(item === page)}
                    onClick={() => setPage(item)}
                    aria-current={item === page ? "page" : undefined}
                  >
                    {item}
                  </button>
                ),
              )}
              <button
                type="button"
                className={pageBtnClass()}
                disabled={page >= pages}
                onClick={() => setPage((p) => Math.min(pages, p + 1))}
              >
                Next
              </button>
            </div>
          </div>
        ) : null}
      </div>

      <BulkUploadModal
        open={bulkOpen}
        onClose={() => setBulkOpen(false)}
        vendorId={vendorId}
      />
    </div>
  );
}
