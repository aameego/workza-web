import { useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import {
  Check,
  Copy,
  Download,
  Plus,
  Search,
  SquarePen,
  Upload,
} from "lucide-react";
import {
  Badge,
  Button,
  cn,
  ConfirmDialog,
  FilterSelect,
  MonthSelect,
  Pagination,
  TabSwitcher,
} from "../../design-system";
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
import {
  getConsultancyPayments,
  saveConsultancyPayment,
} from "../../services/consultancyPaymentService";
import type { EmployeeListItem } from "../../services/employeeTypes";
import { monthLabel } from "./attendanceCalendar";
import BulkUploadModal from "./BulkUploadModal";
import ConsultancyPaymentModal from "./ConsultancyPaymentModal";
import EmployeeRowActions from "./EmployeeRowActions";
import type { DirectoryTab } from "./employeeListHelpers";
import {
  APP_LOGIN_FILTER_OPTIONS,
  DEFAULT_ACCESS_ROLE_OPTIONS,
  NON_ACCESS_ROLES,
  STATUS_FILTER_OPTIONS,
  appLoginBadge,
  appLoginLabel,
  employmentActiveBadge,
  employmentActiveLabel,
  employmentTypeBadge,
  employmentTypeLabel,
  pageWindowLabel,
} from "./employeeListHelpers";


const PAGE_SIZE = 10;

/** Figma Data/Employee Table: header 54, rows 60 (content centred), 12px navy, 16px side padding. */
const thClass =
  "h-[54px] border-b border-wz-border bg-white px-4 text-left align-middle text-xs leading-[normal] font-semibold whitespace-pre-line text-wz-heading";
const tdClass =
  "h-[60px] border-b border-wz-border px-4 py-0 align-middle text-xs leading-[normal] text-wz-heading";

const inr = (v?: number) => `₹${Math.round(Number(v) || 0).toLocaleString("en-IN")}`;

export default function EmployeesPage() {
  const navigate = useNavigate();
  const { vendorSlug } = useParams();
  const user = readSessionUser();
  const vendorId = user?.vendorId || null;
  const base = `/${vendorSlug || "app"}`;

  const [searchParams, setSearchParams] = useSearchParams();
  // The tab lives in the URL (?type=consultancy) so the top bar title and a refresh follow it.
  const [directory, setDirectory] = useState<DirectoryTab>(
    searchParams.get("type") === "consultancy" ? "consultancy" : "employee",
  );
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
  // Consultancy tab: payments are per month (Figma "Select Year/ Month").
  const isConsult = directory === "consultancy";
  const qc = useQueryClient();
  const [payPeriod, setPayPeriod] = useState(() => {
    const d = new Date();
    return { year: d.getFullYear(), month: d.getMonth() + 1 };
  });
  const [payStatus, setPayStatus] = useState("");
  const [editPay, setEditPay] = useState<EmployeeListItem | null>(null);
  const [markPaid, setMarkPaid] = useState<EmployeeListItem | null>(null);
  const [markingPaid, setMarkingPaid] = useState(false);
  const paymentsQuery = useQuery({
    queryKey: ["consultancy-payments", payPeriod.year, payPeriod.month],
    queryFn: () => getConsultancyPayments(payPeriod.month, payPeriod.year),
    enabled: isConsult,
  });
  const paymentById = useMemo(
    () =>
      new Map(
        (paymentsQuery.data?.rows || []).map((r) => [String(r.employee?._id || ""), r.payment]),
      ),
    [paymentsQuery.data],
  );
  const refreshPayments = () => void qc.invalidateQueries({ queryKey: ["consultancy-payments"] });
  const shiftPayMonth = (delta: number) => {
    const d = new Date(payPeriod.year, payPeriod.month - 1 + delta, 1);
    const now = new Date();
    // The API refuses future months.
    if (d > new Date(now.getFullYear(), now.getMonth(), 1)) return;
    setPayPeriod({ year: d.getFullYear(), month: d.getMonth() + 1 });
  };
  const confirmMarkPaid = async () => {
    if (!markPaid) return;
    setMarkingPaid(true);
    try {
      await saveConsultancyPayment({
        employeeId: markPaid._id,
        month: payPeriod.month,
        year: payPeriod.year,
        status: "Paid",
      });
      refreshPayments();
    } catch (err) {
      setToolbarError(err instanceof ApiError ? err.message : "Unable to mark the payment as paid");
    } finally {
      setMarkingPaid(false);
      setMarkPaid(null);
    }
  };

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
  // Figma shows a count on every tab, so fetch the other directory's total too (1 row).
  const { data: otherDirectory } = useEmployees({
    page: 1,
    limit: 1,
    isConsultancy: directory !== "consultancy",
    isPagination: "true",
  });
  const { data: departments = [] } = useDepartmentNames(vendorId);
  const { data: roles = [] } = useRoles(Boolean(vendorId));

  const accessRoleOptions = useMemo(() => {
    const fromApi = roles
      .filter(
        (r) =>
          !r.isAdmin &&
          r.roleName &&
          !(NON_ACCESS_ROLES as readonly string[]).includes(r.roleName),
      )
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

  // ponytail: payment status filters the loaded page only (the directory API has no payment
  // filter); move it server-side if consultants ever span many pages.
  const employees = (data?.employees ?? []).filter(
    (e) =>
      !isConsult ||
      !payStatus ||
      (paymentById.get(e._id)?.status || "Pending") === payStatus,
  );
  const pagination = data?.pagination ?? {
    page: 1,
    limit: PAGE_SIZE,
    total: 0,
    pages: 0,
  };
  const pages = Math.max(pagination.pages || 0, 0);

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
    setSearchParams(next === "consultancy" ? { type: "consultancy" } : {}, { replace: true });
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
    <div className="flex min-w-0 flex-col gap-wz-6">
      <TabSwitcher
        aria-label="Employee directory"
        value={directory}
        onChange={switchDirectory}
        className="self-start"
        items={[
          {
            value: "employee",
            label: "Employees",
            count:
              directory === "employee"
                ? pagination.total
                : otherDirectory?.pagination?.total,
          },
          {
            value: "consultancy",
            label: "Consultancy",
            count:
              directory === "consultancy"
                ? pagination.total
                : otherDirectory?.pagination?.total,
          },
        ]}
      />

      {/* Figma Data/Filter Toolbar: search + actions row, then filters, 16 apart */}
      <div className="flex flex-col gap-wz-4">
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
                directory === "consultancy"
                  ? "Search by consultants name or code..."
                  : "Search by employees name or code..."
              }
              aria-label={directory === "consultancy" ? "Search consultants" : "Search employees"}
              className="box-border h-10 w-full rounded-wz-md border border-wz-border bg-white py-0 pr-3 pl-9 text-[13px] text-wz-heading outline-none placeholder:text-wz-text-muted focus:border-wz-primary focus:shadow-[0_0_0_3px_var(--wz-state-hover)]"
            />
          </label>
          <div className="flex flex-wrap items-center gap-wz-4">
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
              variant="secondary"
              size="toolbar"
              type="button"
              onClick={() => void handleExport()}
              disabled={exporting}
            >
              <Download className="size-4" aria-hidden />
              {exporting ? "Exporting…" : "Export Data"}
            </Button>
            <Button
              variant="primary"
              size="toolbar"
              type="button"
              onClick={() => navigate(addEmployeeHref)}
            >
              <Plus className="size-4" aria-hidden />
              {directory === "consultancy" ? "Add Consultant" : "Add Employee"}
            </Button>
          </div>
        </div>

      <div
        className="flex flex-wrap items-center gap-wz-4"
        role="group"
        aria-label="Employee filters"
      >
        <FilterSelect
          value={departmentId}
          onChange={(e) => setDepartmentId(e.target.value)}
          aria-label="Filter by department"
        >
          <option value="" hidden>Departments</option>
          <option value="">All</option>
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
          <option value="" hidden>
            {isConsult ? "Consultant Status" : STATUS_FILTER_OPTIONS[0].label}
          </option>
          <option value="">All</option>
          {STATUS_FILTER_OPTIONS.slice(1).map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </FilterSelect>

        <FilterSelect
          value={appLogin}
          onChange={(e) => setAppLogin(e.target.value)}
          aria-label="Filter by app login"
        >
          <option value="" hidden>
            {APP_LOGIN_FILTER_OPTIONS[0].label}
          </option>
          <option value="">All</option>
          {APP_LOGIN_FILTER_OPTIONS.slice(1).map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </FilterSelect>

        <FilterSelect
          value={role}
          onChange={(e) => setRole(e.target.value)}
          aria-label="Filter by access role"
        >
          <option value="" hidden>Access Roles</option>
          <option value="">All</option>
          {accessRoleOptions.map((roleName) => (
            <option key={roleName} value={roleName}>
              {roleName}
            </option>
          ))}
        </FilterSelect>

        {isConsult ? (
          <>
            <FilterSelect
              value={payStatus}
              onChange={(e) => setPayStatus(e.target.value)}
              aria-label="Filter by payment status"
            >
              <option value="" hidden>
                Payment Status
              </option>
              <option value="">All</option>
              <option value="Paid">Paid</option>
              <option value="Pending">Pending</option>
            </FilterSelect>
            <MonthSelect
              year={payPeriod.year}
              month={payPeriod.month}
              onShift={shiftPayMonth}
              aria-label="Select year and month"
            />
          </>
        ) : null}
      </div>
      </div>

      {isConsult ? (
        /* Figma consultancy metrics: six 86px cards for the selected month */
        <div className="grid grid-cols-2 gap-wz-4 sm:grid-cols-3 xl:grid-cols-6">
          {(
            [
              ["Consultants", String(paymentsQuery.data?.summary?.totalConsultants ?? 0)],
              ["Total Gross", inr(paymentsQuery.data?.summary?.totalPayable)],
              ["TDS Deduction", inr(paymentsQuery.data?.summary?.totalTDS)],
              ["Net Payable", inr(paymentsQuery.data?.summary?.totalNetPayable)],
              ["Paid (Net)", inr(paymentsQuery.data?.summary?.paidAmount)],
              ["Pending (Net)", inr(paymentsQuery.data?.summary?.pendingAmount)],
            ] as const
          ).map(([label, value]) => (
            <div
              key={label}
              className="flex h-[86px] flex-col gap-1 rounded-wz-xl border border-wz-border bg-white p-wz-4"
            >
              <p className="m-0 text-[11px] leading-[14px] font-semibold tracking-[0.5px] text-wz-text-muted uppercase">
                {label}
              </p>
              <p className="m-0 truncate text-[28px] leading-[34px] font-bold text-wz-heading">
                {value}
              </p>
            </div>
          ))}
        </div>
      ) : null}

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
            <table
              className={cn(
                "w-full min-w-[980px] border-collapse",
                // Figma fits 12 consultant columns in the same width: tighter cell padding.
                isConsult && "[&_td]:px-2.5 [&_th]:px-2.5",
              )}
            >
              <thead>
                <tr>
                  {(isConsult
                    ? [
                        "Code",
                        "Contact",
                        "Designation",
                        "Department",
                        "State",
                        "Monthly\nRate (₹)",
                        "Reporting\nManager",
                        "TDS (%)",
                        "Status & App Login",
                        "Payment\nStatus",
                        "Payment\nActions",
                        "Actions",
                      ]
                    : [
                        "Employee",
                        "Contact",
                        "Designation",
                        "Department",
                        "State",
                        "Reporting\nManager",
                        "App Login",
                        "Status",
                        "Actions",
                      ]
                  ).map((h) => (
                    <th key={h} className={thClass}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {employees.map((emp) => {
                  const typeLabel = employmentTypeLabel(emp);
                  const pay = paymentById.get(emp._id);
                  const paid = pay?.status === "Paid";
                  return (
                    <tr
                      key={emp._id}
                      className="hover:bg-wz-neutral-50 [&:last-child>td]:border-b-0"
                    >
                      <td className={tdClass}>
                        <div className="flex min-w-[100px] flex-col gap-0.5">
                          <span title={emp.name}>{emp.name || "-"}</span>
                          <span className="text-[10px] text-wz-text-muted">
                            {emp.employeeCode || "-"}
                          </span>
                        </div>
                      </td>
                      <td className={tdClass}>
                        <div className="flex min-w-[150px] flex-col gap-0.5">
                          {(
                            [
                              ["email", emp.email, "text-xs text-wz-heading", 12],
                              ["phone", emp.phone, "text-[10px] text-wz-text-muted", 10],
                            ] as const
                          ).map(([kind, value, textClass, iconSize]) => (
                            <div
                              key={kind}
                              className="flex max-w-[200px] items-center gap-1.5"
                            >
                              <span
                                className={cn("truncate", textClass)}
                                title={value || ""}
                              >
                                {value || "-"}
                              </span>
                              {value ? (
                                <button
                                  type="button"
                                  className="inline-flex shrink-0 cursor-pointer items-center justify-center rounded-wz-sm border-0 bg-transparent p-0 leading-none text-wz-text-muted hover:text-wz-primary"
                                  aria-label={`Copy ${kind}`}
                                  onClick={() =>
                                    void copyContact(emp._id, kind, value)
                                  }
                                >
                                  {copiedKey === `${emp._id}-${kind}` ? (
                                    <Check size={iconSize} />
                                  ) : (
                                    <Copy size={iconSize} />
                                  )}
                                </button>
                              ) : null}
                            </div>
                          ))}
                        </div>
                      </td>
                      <td className={tdClass} title={emp.designation || ""}>
                        {emp.designation || "-"}
                      </td>
                      <td className={tdClass} title={emp.department || ""}>
                        {emp.department || "-"}
                      </td>
                      <td className={tdClass} title={emp.stateName || ""}>
                        {emp.stateName || "-"}
                      </td>
                      {isConsult ? (
                        <td className={tdClass}>
                          {pay?.amount ?? emp.monthlyConsultancyPay
                            ? Number(pay?.amount ?? emp.monthlyConsultancyPay).toLocaleString("en-IN")
                            : "-"}
                        </td>
                      ) : null}
                      <td className={tdClass} title={emp.managerId?.name || ""}>
                        {emp.managerId?.name || "-"}
                      </td>
                      {isConsult ? (
                        <>
                          <td className={tdClass}>{pay?.tdsPercent ?? emp.tdsPercent ?? "-"}</td>
                          <td className={tdClass}>
                            <div className="flex items-center gap-wz-2">
                              <Badge status={employmentActiveBadge(emp)}>
                                {employmentActiveLabel(emp)}
                              </Badge>
                              <Badge status={appLoginBadge(emp)}>{appLoginLabel(emp)}</Badge>
                            </div>
                          </td>
                          <td className={tdClass}>
                            <Badge status={paid ? "success" : "warning"}>
                              {paid ? "Paid" : "Pending"}
                            </Badge>
                          </td>
                          <td className={tdClass}>
                            {paid || !emp.isActive ? (
                              "-"
                            ) : (
                              <div className="flex items-center gap-wz-2">
                                <button
                                  type="button"
                                  aria-label={`Edit payment for ${emp.name}`}
                                  className="inline-flex size-6 cursor-pointer items-center justify-center rounded-wz-md border-0 bg-transparent text-wz-heading hover:bg-wz-neutral-100"
                                  onClick={() => setEditPay(emp)}
                                >
                                  <SquarePen size={12} />
                                </button>
                                <button
                                  type="button"
                                  aria-label={`Mark ${emp.name} as paid`}
                                  className="inline-flex size-6 cursor-pointer items-center justify-center rounded-wz-md border-0 bg-transparent text-[#12b76a] hover:bg-[#ecfdf3]"
                                  onClick={() => setMarkPaid(emp)}
                                >
                                  <Check size={12} />
                                </button>
                              </div>
                            )}
                          </td>
                        </>
                      ) : (
                        <>
                          <td className={tdClass}>
                            <Badge status={appLoginBadge(emp)}>
                              {appLoginLabel(emp)}
                            </Badge>
                          </td>
                          <td className={tdClass}>
                            <div className="flex items-center gap-wz-2">
                              <Badge status={employmentActiveBadge(emp)}>
                                {employmentActiveLabel(emp)}
                              </Badge>
                              {typeLabel ? (
                                <Badge status={employmentTypeBadge(emp)}>
                                  {typeLabel}
                                </Badge>
                              ) : null}
                            </div>
                          </td>
                        </>
                      )}
                      <td className={tdClass}>
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
          <Pagination
            page={page}
            pages={pages}
            onPageChange={setPage}
            summary={
              <>
                {pageWindowLabel(
                  page,
                  PAGE_SIZE,
                  pagination.total,
                  directory === "consultancy" ? "consultants" : "employees",
                )}
                {isFetching && !isLoading ? " · Updating…" : null}
              </>
            }
          />
        ) : null}
      </div>

      <ConsultancyPaymentModal
        employee={editPay}
        payment={editPay ? paymentById.get(editPay._id) : undefined}
        month={payPeriod.month}
        year={payPeriod.year}
        periodLabel={monthLabel(payPeriod.year, payPeriod.month)}
        onClose={() => setEditPay(null)}
        onSaved={refreshPayments}
      />
      <ConfirmDialog
        open={Boolean(markPaid)}
        tone="success"
        title="Mark as Paid?"
        message={`Mark ${markPaid?.name || "this consultant"}'s ${monthLabel(payPeriod.year, payPeriod.month)} payment as paid? A paid payment cannot be edited or reverted.`}
        confirmLabel="Mark Paid"
        loading={markingPaid}
        onClose={() => setMarkPaid(null)}
        onConfirm={() => void confirmMarkPaid()}
      />
      <BulkUploadModal
        open={bulkOpen}
        onClose={() => setBulkOpen(false)}
        vendorId={vendorId}
      />
    </div>
  );
}
