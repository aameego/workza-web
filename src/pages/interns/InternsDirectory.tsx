import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Check, Copy, Download, Plus, Search } from "lucide-react";
import {
  Avatar,
  Badge,
  Button,
  cn,
  FilterSelect,
  Pagination,
} from "../../design-system";
import { useDepartmentNames } from "../../hooks/useDepartmentNames";
import {
  useConvertInternToEmployee,
  useDeleteIntern,
  useExtendInternship,
  useInterns,
  useResendInternCredentials,
  useRestoreIntern,
  useToggleInternAppLogin,
  useUpdateInternStatus,
} from "../../hooks/useInterns";
import { readSessionUser } from "../../layouts/sessionUser";
import { ApiError } from "../../lib/apiClient";
import {
  fileNameFromContentDisposition,
  saveDownload,
} from "../../lib/saveDownload";
import { exportInterns } from "../../services/internService";
import type { InternCredentials, InternListItem } from "../../services/internTypes";
import { pageWindowLabel } from "../employees/employeeListHelpers";
import { canManageEmployees } from "../employees/letterAccess";
import { initialsFromName } from "../employees/employeeViewFormat";
import { INTERN_STATUS_FILTER_OPTIONS } from "./internConstants";
import {
  InternConvertModal,
  InternCredentialsModal,
  InternExtendModal,
  InternStatusModal,
  type ConvertFormState,
} from "./InternActionModals";
import InternRowActions from "./InternRowActions";
import {
  formatInternDate,
  formatInternStipend,
  internAppLoginBadge,
  internAppLoginLabel,
  internDeptName,
  internStatusBadge,
  internStatusLabel,
} from "./internViewFormat";

const PAGE_SIZE = 10;

const thClass =
  "h-[54px] border-b border-wz-border bg-white px-4 text-left align-middle text-xs leading-[normal] font-semibold whitespace-pre-line text-wz-heading";
const tdClass =
  "h-[60px] border-b border-wz-border px-4 py-0 align-middle text-xs leading-[normal] text-wz-heading";

export default function InternsDirectory() {
  const navigate = useNavigate();
  const { vendorSlug } = useParams();
  const user = readSessionUser();
  const vendorId = user?.vendorId || null;
  const base = `/${vendorSlug || "app"}`;
  const canManage = canManageEmployees(user?.role);

  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [departmentId, setDepartmentId] = useState("");
  const [page, setPage] = useState(1);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);
  const [toolbarError, setToolbarError] = useState<string | null>(null);

  const [statusTarget, setStatusTarget] = useState<InternListItem | null>(null);
  const [extendTarget, setExtendTarget] = useState<InternListItem | null>(null);
  const [convertTarget, setConvertTarget] = useState<InternListItem | null>(null);
  const [credentials, setCredentials] = useState<InternCredentials | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const updateStatus = useUpdateInternStatus();
  const extendMutation = useExtendInternship();
  const convertMutation = useConvertInternToEmployee();
  const deleteMutation = useDeleteIntern();
  const restoreMutation = useRestoreIntern();
  const toggleLogin = useToggleInternAppLogin();
  const resendCreds = useResendInternCredentials();

  useEffect(() => {
    const t = window.setTimeout(() => setSearch(searchInput.trim()), 300);
    return () => window.clearTimeout(t);
  }, [searchInput]);

  useEffect(() => {
    setPage(1);
  }, [search, status, departmentId]);

  const { data, isLoading, isFetching, isError, error, refetch } = useInterns({
    page,
    limit: PAGE_SIZE,
    search: search || undefined,
    status: status || undefined,
    departmentId: departmentId || undefined,
    isPagination: "true",
  });

  const { data: departments = [] } = useDepartmentNames(vendorId);

  const interns = data?.interns ?? [];
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
      /* ignore */
    }
  };

  const handleExport = async () => {
    if (exporting) return;
    setToolbarError(null);
    setExporting(true);
    try {
      const { blob, headers } = await exportInterns({
        search: search || undefined,
        status: status || undefined,
        departmentId: departmentId || undefined,
      });
      const fallback = `Interns-Export-${new Date().toISOString().split("T")[0]}.xlsx`;
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
            : "Failed to export interns",
      );
    } finally {
      setExporting(false);
    }
  };

  const errorMessage =
    error instanceof ApiError
      ? error.message
      : error instanceof Error
        ? error.message
        : "Failed to load interns";

  const runStatus = async (nextStatus: string, remark: string) => {
    if (!statusTarget) return;
    setActionError(null);
    try {
      await updateStatus.mutateAsync({
        id: statusTarget._id,
        status: nextStatus,
        remark: remark || undefined,
      });
      setStatusTarget(null);
    } catch (err) {
      setActionError(err instanceof ApiError ? err.message : "Status update failed");
    }
  };

  const runExtend = async (newEndDate: string, remark: string) => {
    if (!extendTarget) return;
    setActionError(null);
    try {
      await extendMutation.mutateAsync({
        id: extendTarget._id,
        newEndDate,
        remark: remark || undefined,
      });
      setExtendTarget(null);
    } catch (err) {
      setActionError(err instanceof ApiError ? err.message : "Could not extend internship");
    }
  };

  const runConvert = async (payload: ConvertFormState) => {
    if (!convertTarget) return;
    setActionError(null);
    try {
      const res = await convertMutation.mutateAsync({
        id: convertTarget._id,
        dateOfJoining: payload.dateOfJoining,
        designation: payload.designation,
        departmentId: payload.departmentId || undefined,
        employmentStatus: payload.employmentStatus,
      });
      setConvertTarget(null);
      const employeeId = res?.employee?._id;
      if (employeeId) {
        navigate(`${base}/employees/${employeeId}`);
      }
    } catch (err) {
      setActionError(err instanceof ApiError ? err.message : "Conversion failed");
    }
  };

  const archiveIntern = async (intern: InternListItem) => {
    setToolbarError(null);
    try {
      await deleteMutation.mutateAsync(intern._id);
    } catch (err) {
      setToolbarError(err instanceof ApiError ? err.message : "Archive failed");
    }
  };

  const restoreInternRow = async (intern: InternListItem) => {
    setToolbarError(null);
    try {
      await restoreMutation.mutateAsync(intern._id);
    } catch (err) {
      setToolbarError(err instanceof ApiError ? err.message : "Restore failed");
    }
  };

  const toggleAppLogin = async (intern: InternListItem, enable: boolean) => {
    setToolbarError(null);
    try {
      await toggleLogin.mutateAsync({ id: intern._id, enable });
    } catch (err) {
      setToolbarError(
        err instanceof ApiError ? err.message : "Could not update app login",
      );
    }
  };

  const resendCredentials = async (intern: InternListItem) => {
    setToolbarError(null);
    try {
      const res = await resendCreds.mutateAsync(intern._id);
      if (res?.loginInfo) setCredentials(res.loginInfo);
    } catch (err) {
      setToolbarError(
        err instanceof ApiError ? err.message : "Could not send credentials",
      );
    }
  };

  return (
    <div className="flex min-w-0 flex-col gap-wz-6">
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
              placeholder="Search by intern name or code…"
              aria-label="Search interns"
              className="box-border h-10 w-full rounded-wz-md border border-wz-border bg-white py-0 pr-3 pl-9 text-[13px] text-wz-heading outline-none placeholder:text-wz-text-muted focus:border-wz-primary focus:shadow-[0_0_0_3px_var(--wz-state-hover)]"
            />
          </label>
          <div className="flex flex-wrap items-center gap-wz-4">
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
            {canManage ? (
              <Button
                variant="primary"
                size="toolbar"
                type="button"
                onClick={() => navigate(`${base}/employees/interns/new`)}
              >
                <Plus className="size-4" aria-hidden />
                Add Intern
              </Button>
            ) : null}
          </div>
        </div>

        <div
          className="flex flex-wrap items-center gap-wz-4"
          role="group"
          aria-label="Intern filters"
        >
          <FilterSelect
            value={departmentId}
            onChange={(e) => setDepartmentId(e.target.value)}
            aria-label="Filter by department"
          >
            <option value="" hidden>
              Departments
            </option>
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
            aria-label="Filter by intern status"
          >
            <option value="" hidden>
              {INTERN_STATUS_FILTER_OPTIONS[0].label}
            </option>
            <option value="">All</option>
            {INTERN_STATUS_FILTER_OPTIONS.slice(1).map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </FilterSelect>
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
            Loading interns…
          </div>
        ) : isError ? (
          <div className="px-6 py-12 text-center text-sm text-wz-error">
            {errorMessage}{" "}
            <button type="button" className="underline" onClick={() => refetch()}>
              Retry
            </button>
          </div>
        ) : interns.length === 0 ? (
          <div className="px-6 py-12 text-center text-sm text-wz-text-secondary">
            No interns found.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1040px] border-collapse">
              <thead>
                <tr>
                  {[
                    "Intern",
                    "Contact",
                    "Department",
                    "Designation",
                    "Start",
                    "End",
                    "Stipend",
                    "Status",
                    "App Login",
                    "Actions",
                  ].map((h) => (
                    <th key={h} className={thClass}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {interns.map((intern) => (
                  <tr
                    key={intern._id}
                    className="hover:bg-wz-neutral-50 [&:last-child>td]:border-b-0"
                  >
                    <td className={tdClass}>
                      <div className="flex min-w-[160px] items-center gap-wz-3">
                        <Avatar
                          size="sm"
                          initials={initialsFromName(intern.name)}
                          src={intern.photoUrl || intern.photo || undefined}
                        />
                        <div className="flex min-w-0 flex-col gap-0.5">
                          <span className="truncate font-medium" title={intern.name}>
                            {intern.name || "—"}
                          </span>
                          <span className="text-[10px] text-wz-text-muted">
                            {intern.employeeCode || "—"}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className={tdClass}>
                      <div className="flex min-w-[150px] flex-col gap-0.5">
                        {(
                          [
                            ["email", intern.email, "text-xs text-wz-heading", 12],
                            ["phone", intern.phone, "text-[10px] text-wz-text-muted", 10],
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
                              {value || "—"}
                            </span>
                            {value ? (
                              <button
                                type="button"
                                className="inline-flex shrink-0 cursor-pointer items-center justify-center rounded-wz-sm border-0 bg-transparent p-0 leading-none text-wz-text-muted hover:text-wz-primary"
                                aria-label={`Copy ${kind}`}
                                onClick={() =>
                                  void copyContact(intern._id, kind, value)
                                }
                              >
                                {copiedKey === `${intern._id}-${kind}` ? (
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
                    <td className={tdClass} title={internDeptName(intern)}>
                      {internDeptName(intern)}
                    </td>
                    <td className={tdClass} title={intern.designation || ""}>
                      {intern.designation || "—"}
                    </td>
                    <td className={tdClass}>
                      {formatInternDate(intern.internshipStartDate)}
                    </td>
                    <td className={tdClass}>
                      {formatInternDate(intern.internshipEndDate)}
                    </td>
                    <td className={tdClass}>
                      {formatInternStipend(
                        intern.stipendAmount,
                        intern.stipendFrequency,
                      )}
                    </td>
                    <td className={tdClass}>
                      <Badge status={internStatusBadge(intern.internStatus)}>
                        {internStatusLabel(intern.internStatus)}
                      </Badge>
                    </td>
                    <td className={tdClass}>
                      <Badge status={internAppLoginBadge(intern)}>
                        {internAppLoginLabel(intern)}
                      </Badge>
                    </td>
                    <td className={tdClass}>
                      <InternRowActions
                        intern={intern}
                        user={user}
                        basePath={base}
                        onStatus={setStatusTarget}
                        onExtend={setExtendTarget}
                        onConvert={setConvertTarget}
                        onArchive={archiveIntern}
                        onRestore={restoreInternRow}
                        onToggleLogin={toggleAppLogin}
                        onResendCredentials={resendCredentials}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {!isError && interns.length > 0 ? (
          <Pagination
            page={page}
            pages={pages}
            onPageChange={setPage}
            summary={
              <>
                {pageWindowLabel(page, PAGE_SIZE, pagination.total, "interns")}
                {isFetching && !isLoading ? " · Updating…" : null}
              </>
            }
          />
        ) : null}
      </div>

      <InternStatusModal
        intern={statusTarget}
        open={Boolean(statusTarget)}
        loading={updateStatus.isPending}
        error={actionError}
        onClose={() => {
          setStatusTarget(null);
          setActionError(null);
        }}
        onSubmit={(s, r) => void runStatus(s, r)}
      />
      <InternExtendModal
        intern={extendTarget}
        open={Boolean(extendTarget)}
        loading={extendMutation.isPending}
        error={actionError}
        onClose={() => {
          setExtendTarget(null);
          setActionError(null);
        }}
        onSubmit={(d, r) => void runExtend(d, r)}
      />
      <InternConvertModal
        intern={convertTarget}
        open={Boolean(convertTarget)}
        loading={convertMutation.isPending}
        error={actionError}
        departments={departments}
        onClose={() => {
          setConvertTarget(null);
          setActionError(null);
        }}
        onSubmit={(p) => void runConvert(p)}
      />
      <InternCredentialsModal
        open={Boolean(credentials)}
        loginInfo={credentials}
        onClose={() => setCredentials(null)}
        onDone={() => setCredentials(null)}
      />
    </div>
  );
}