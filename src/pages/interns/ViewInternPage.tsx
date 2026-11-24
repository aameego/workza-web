import { useEffect, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { CalendarClock, Pencil, RotateCcw, Trash2, UserCheck } from "lucide-react";
import {
  Avatar,
  Badge,
  Button,
  ConfirmDialog,
  TabSwitcher,
  showSuccessToast,
} from "../../design-system";
import {
  useConvertInternToEmployee,
  useDeleteIntern,
  useExtendInternship,
  useInternDetail,
  useUpdateInternStatus,
} from "../../hooks/useInterns";
import { useDepartmentNames } from "../../hooks/useDepartmentNames";
import { readSessionUser } from "../../layouts/sessionUser";
import { ApiError } from "../../lib/apiClient";
import type { InternListItem } from "../../services/internTypes";
import { initialsFromName } from "../employees/employeeViewFormat";
import { canManageEmployees } from "../employees/letterAccess";
import {
  InternConvertModal,
  InternExtendModal,
  InternStatusModal,
  type ConvertFormState,
} from "./InternActionModals";
import InternDocumentsPanel from "./InternDocumentsPanel";
import InternOverviewPanel from "./InternOverviewPanel";
import InternStipendPanel from "./InternStipendPanel";
import {
  canChangeInternStatus,
  canConvertIntern,
  canEditInternRecord,
  canExtendInternship,
  internStatusBadge,
  internStatusLabel,
} from "./internViewFormat";

type ViewTab = "overview" | "documents" | "stipend";

const TABS: { id: ViewTab; label: string }[] = [
  { id: "overview", label: "Overview" },
  { id: "documents", label: "Documents" },
  { id: "stipend", label: "Stipend" },
];

export default function ViewInternPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { vendorSlug, internId } = useParams();
  const base = `/${vendorSlug || "app"}`;
  const user = readSessionUser();
  const vendorId = user?.vendorId || null;
  const canManage = canManageEmployees(user?.role);

  const { data: intern, isLoading, isError, error, refetch } = useInternDetail(
    internId,
  );
  const { data: departments = [] } = useDepartmentNames(vendorId);

  const [tab, setTab] = useState<ViewTab>("overview");
  const [archiveOpen, setArchiveOpen] = useState(false);
  const [statusTarget, setStatusTarget] = useState<InternListItem | null>(null);
  const [extendTarget, setExtendTarget] = useState<InternListItem | null>(null);
  const [convertTarget, setConvertTarget] = useState<InternListItem | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const updateStatus = useUpdateInternStatus();
  const extendMutation = useExtendInternship();
  const convertMutation = useConvertInternToEmployee();
  const deleteMutation = useDeleteIntern();

  useEffect(() => {
    if (location.hash === "#documents") {
      setTab("documents");
    }
  }, [location.hash]);

  if (isLoading) {
    return (
      <div className="p-wz-6 text-sm text-wz-text-secondary">Loading intern…</div>
    );
  }

  if (isError || !intern) {
    const message =
      error instanceof ApiError
        ? error.message
        : "Intern not found or could not be loaded.";
    return (
      <div className="flex flex-col gap-wz-4 p-wz-6">
        <p className="m-0 text-sm text-wz-error" role="alert">
          {message}
        </p>
        <div className="flex gap-wz-3">
          <Button type="button" variant="secondary" onClick={() => void refetch()}>
            Retry
          </Button>
          <Button
            type="button"
            variant="ghost"
            onClick={() => navigate(`${base}/employees?type=intern`)}
          >
            Back to interns
          </Button>
        </div>
      </div>
    );
  }

  const internAsList = intern as InternListItem;
  const editPath = `${base}/employees/interns/${intern._id}/edit`;

  const runStatus = async (nextStatus: string, remark: string) => {
    setActionError(null);
    try {
      await updateStatus.mutateAsync({
        id: intern._id,
        status: nextStatus,
        remark: remark || undefined,
      });
      setStatusTarget(null);
      showSuccessToast("Intern status updated.");
    } catch (err) {
      setActionError(err instanceof ApiError ? err.message : "Status update failed");
    }
  };

  const runExtend = async (newEndDate: string, remark: string) => {
    setActionError(null);
    try {
      await extendMutation.mutateAsync({
        id: intern._id,
        newEndDate,
        remark: remark || undefined,
      });
      setExtendTarget(null);
      showSuccessToast("Internship extended.");
    } catch (err) {
      setActionError(err instanceof ApiError ? err.message : "Could not extend internship");
    }
  };

  const runConvert = async (payload: ConvertFormState) => {
    setActionError(null);
    try {
      const res = await convertMutation.mutateAsync({
        id: intern._id,
        dateOfJoining: payload.dateOfJoining,
        designation: payload.designation,
        departmentId: payload.departmentId || undefined,
        employmentStatus: payload.employmentStatus,
      });
      setConvertTarget(null);
      showSuccessToast("Intern converted to employee.");
      const employeeId = res?.employee?._id;
      if (employeeId) navigate(`${base}/employees/${employeeId}`);
    } catch (err) {
      setActionError(err instanceof ApiError ? err.message : "Conversion failed");
    }
  };

  const confirmArchive = async () => {
    setActionError(null);
    try {
      await deleteMutation.mutateAsync(intern._id);
      setArchiveOpen(false);
      showSuccessToast("Intern archived.");
      navigate(`${base}/employees?type=intern`);
    } catch (err) {
      setArchiveOpen(false);
      setActionError(err instanceof ApiError ? err.message : "Could not archive intern");
    }
  };

  return (
    <div className="flex min-w-0 flex-col gap-wz-6">
      <div className="flex flex-wrap items-start justify-between gap-wz-4 rounded-wz-xl border border-wz-border bg-white p-wz-6">
        <div className="flex min-w-0 items-center gap-wz-4">
          <Avatar
            size="lg"
            initials={initialsFromName(intern.name)}
            src={intern.photoUrl || intern.photo || undefined}
          />
          <div>
            <h1 className="m-0 text-xl font-bold text-wz-heading">{intern.name || "Intern"}</h1>
            <p className="m-0 mt-1 text-sm text-wz-text-muted">
              {intern.employeeCode || "—"} · {intern.designation || "Intern"}
            </p>
            <div className="mt-wz-2 flex flex-wrap items-center gap-wz-2">
              <Badge status={internStatusBadge(intern.internStatus)}>
                {internStatusLabel(intern.internStatus)}
              </Badge>
              {intern.isDeleted ? (
                <Badge status="error">Archived</Badge>
              ) : null}
            </div>
          </div>
        </div>
        {canManage ? (
          <div className="flex flex-wrap items-center gap-wz-2">
            {canEditInternRecord(internAsList) ? (
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => navigate(editPath)}
              >
                <Pencil className="size-4" aria-hidden />
                Edit
              </Button>
            ) : null}
            {canChangeInternStatus(intern.internStatus) ? (
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => setStatusTarget(internAsList)}
              >
                <RotateCcw className="size-4" aria-hidden />
                Status
              </Button>
            ) : null}
            {canExtendInternship(internAsList) ? (
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => setExtendTarget(internAsList)}
              >
                <CalendarClock className="size-4" aria-hidden />
                Extend
              </Button>
            ) : null}
            {canConvertIntern(internAsList) ? (
              <Button
                type="button"
                variant="primary"
                size="sm"
                onClick={() => setConvertTarget(internAsList)}
              >
                <UserCheck className="size-4" aria-hidden />
                Convert
              </Button>
            ) : null}
            {!intern.isDeleted && intern.internStatus !== "converted" ? (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setArchiveOpen(true)}
              >
                <Trash2 className="size-4" aria-hidden />
                Archive
              </Button>
            ) : null}
          </div>
        ) : null}
      </div>

      {actionError && !statusTarget && !extendTarget && !convertTarget ? (
        <p className="m-0 text-sm text-wz-error" role="alert">
          {actionError}
        </p>
      ) : null}

      <TabSwitcher
        aria-label="Intern profile sections"
        value={tab}
        onChange={(v) => setTab(v as ViewTab)}
        className="self-start"
        items={TABS.map((t) => ({ value: t.id, label: t.label }))}
      />

      {tab === "overview" ? <InternOverviewPanel intern={intern} /> : null}
      {tab === "documents" ? (
        <InternDocumentsPanel internId={intern._id} canUpload={canManage} />
      ) : null}
      {tab === "stipend" ? (
        <InternStipendPanel intern={intern} canManage={canManage} />
      ) : null}

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
      <ConfirmDialog
        open={archiveOpen}
        tone="destructive"
        title="Archive Intern?"
        message={`Archive ${intern.name || "this intern"}? They will be hidden until restored.`}
        confirmLabel="Archive"
        loading={deleteMutation.isPending}
        onClose={() => setArchiveOpen(false)}
        onConfirm={() => void confirmArchive()}
      />
    </div>
  );
}