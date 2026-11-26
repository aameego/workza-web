import { useState, type ReactNode } from "react";
import { Layers, Plus, SquarePen, Trash2 } from "lucide-react";
import {
  Badge,
  Button,
  Card,
  ConfirmDialog,
  FilterSelect,
  Pagination,
  cn,
  showSuccessToast,
} from "../../../design-system";
import { ApiError } from "../../../lib/apiClient";
import { readSessionUser } from "../../../layouts/sessionUser";
import {
  useApplySalaryTemplate,
  useDeleteSalaryComponent,
  useDeleteSalaryStructure,
  useSalaryComponents,
  useSalaryStructureList,
  useSalaryTemplates,
  useUpdateSalaryComponent,
} from "../../../hooks/useSalarySettings";
import {
  FORMULA_TYPES,
  componentCalcLabel,
  type SalaryComponent,
  type SalaryTemplate,
} from "../../../services/salaryComponentService";
import {
  structureItemId,
  type SalaryStructure,
  type StructureItem,
} from "../../../services/salaryStructureService";
import SalaryComponentModal from "./SalaryComponentModal";
import SalaryStructureModal from "./SalaryStructureModal";

const thClass =
  "h-[54px] border-b border-wz-border bg-white px-4 text-left align-middle text-xs leading-[normal] font-semibold text-wz-heading";
const tdClass =
  "h-[60px] border-b border-wz-border px-4 py-0 align-middle text-xs leading-[normal] text-wz-heading";

const PAGE_SIZE = 10;

type StructureTarget = {
  mode: "create" | "edit";
  structure: SalaryStructure | null;
};

type ComponentTarget = {
  mode: "create" | "edit";
  component: SalaryComponent | null;
};

type DeleteTarget =
  | { kind: "structure"; item: SalaryStructure }
  | { kind: "component"; item: SalaryComponent };

type PanelTone = "earning" | "deduction" | "employer";

const toneClass: Record<PanelTone, string> = {
  earning: "bg-wz-badge-success-bg text-wz-badge-success-fg",
  deduction: "bg-wz-badge-error-bg text-wz-badge-error-fg",
  employer: "bg-wz-badge-blue-bg text-wz-badge-blue-fg",
};

export function SalaryTab() {
  const vendorId = readSessionUser()?.vendorId ?? null;

  const structuresQuery = useSalaryStructureList(vendorId);
  const componentsQuery = useSalaryComponents(vendorId);
  const templatesQuery = useSalaryTemplates(vendorId);
  const deleteStructureMutation = useDeleteSalaryStructure();
  const deleteComponentMutation = useDeleteSalaryComponent();
  const updateComponentMutation = useUpdateSalaryComponent();
  const applyTemplateMutation = useApplySalaryTemplate();

  const structures = structuresQuery.data ?? [];
  const components = componentsQuery.data ?? [];
  const templates = templatesQuery.data ?? [];

  const [structureTarget, setStructureTarget] =
    useState<StructureTarget | null>(null);
  const [componentTarget, setComponentTarget] =
    useState<ComponentTarget | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget | null>(null);
  const [templateTarget, setTemplateTarget] = useState<SalaryTemplate | null>(
    null,
  );
  /** Pending "disable component" confirmation (checkbox toggle). */
  const [disableTarget, setDisableTarget] = useState<SalaryComponent | null>(
    null,
  );
  const [listError, setListError] = useState<string | null>(null);
  const [page, setPage] = useState(1);

  const total = structures.length;
  const pages = Math.max(Math.ceil(total / PAGE_SIZE), 1);
  const pageSafe = Math.min(page, pages);
  const pageRows = structures.slice(
    (pageSafe - 1) * PAGE_SIZE,
    pageSafe * PAGE_SIZE,
  );

  const structuresErrorMessage = structuresQuery.error
    ? structuresQuery.error instanceof ApiError
      ? structuresQuery.error.message
      : "Could not load salary structures."
    : null;
  const componentsErrorMessage = componentsQuery.error
    ? componentsQuery.error instanceof ApiError
      ? componentsQuery.error.message
      : "Could not load salary components."
    : null;

  const earnings = components.filter((c) => c.category === "Earning");
  const deductions = components.filter(
    (c) => c.category === "Deduction" && !c.isEmployerContribution,
  );
  const employerLines = components.filter((c) => c.isEmployerContribution);

  const runComponentUpdate = async (
    comp: SalaryComponent,
    isActive: boolean,
  ) => {
    try {
      await updateComponentMutation.mutateAsync({
        code: comp.code,
        data: { isActive },
      });
      showSuccessToast(
        isActive
          ? `${comp.name} enabled.`
          : `${comp.name} disabled. It stays visible in past payslips.`,
      );
    } catch (err) {
      setListError(
        err instanceof ApiError
          ? err.message
          : "Could not update the component.",
      );
    }
  };

  const confirmDisable = async () => {
    if (!disableTarget) return;
    const comp = disableTarget;
    setDisableTarget(null);
    await runComponentUpdate(comp, false);
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    const target = deleteTarget;
    try {
      if (target.kind === "structure") {
        await deleteStructureMutation.mutateAsync({
          structureId: target.item._id,
          vendorId: vendorId || "",
        });
        showSuccessToast("Salary structure deleted.");
      } else {
        const result = await deleteComponentMutation.mutateAsync(
          target.item.code,
        );
        showSuccessToast(
          result.softDeleted
            ? (result.message ??
              "Component disabled (in use) — historical payslips preserved.")
            : "Component removed successfully.",
        );
      }
      setDeleteTarget(null);
    } catch (err) {
      setListError(
        err instanceof ApiError
          ? err.message
          : target.kind === "structure"
            ? "Could not delete salary structure."
            : "Could not delete component.",
      );
      setDeleteTarget(null);
    }
  };

  const confirmApplyTemplate = async () => {
    if (!templateTarget) return;
    const template = templateTarget;
    setTemplateTarget(null);
    try {
      await applyTemplateMutation.mutateAsync(template.key);
      showSuccessToast("Template applied successfully.");
    } catch (err) {
      setListError(
        err instanceof ApiError
          ? err.message
          : "Failed to apply template.",
      );
    }
  };

  const renderPills = (items: StructureItem[] | undefined, tone: PanelTone) => {
    if (!items || items.length === 0) {
      return <span className="text-wz-text-muted">None</span>;
    }
    return (
      <div className="flex flex-wrap gap-1">
        {items.map((item, idx) => {
          const id = structureItemId(item);
          const comp = components.find((c) => c._id === id);
          const ref =
            item.componentId && typeof item.componentId === "object"
              ? item.componentId
              : null;
          const name =
            comp?.name || ref?.name || comp?.code || ref?.code || "Unknown";
          return (
            <span
              key={`${id ?? "item"}-${idx}`}
              className={cn(
                "inline-flex items-center rounded-full px-2 py-0.5 text-[11px] leading-4 font-medium",
                tone === "earning"
                  ? "bg-wz-badge-success-bg text-wz-badge-success-fg"
                  : "bg-wz-badge-error-bg text-wz-badge-error-fg",
              )}
            >
              {name}
            </span>
          );
        })}
      </div>
    );
  };

  const renderComponentRow = (comp: SalaryComponent) => {
    const active = comp.isActive !== false;
    return (
      <div
        key={comp._id}
        className={cn(
          "flex items-start gap-3 border-b border-wz-border px-3 py-3 last:border-b-0",
          !active && "bg-wz-neutral-50 opacity-70",
        )}
      >
        <input
          type="checkbox"
          className="mt-1 size-4 shrink-0 cursor-pointer accent-wz-primary"
          checked={active}
          aria-label={`${active ? "Disable" : "Enable"} ${comp.name}`}
          onChange={(e) => {
            if (e.target.checked) {
              setListError(null);
              void runComponentUpdate(comp, true);
            } else {
              setDisableTarget(comp);
            }
          }}
        />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-sm leading-5 font-semibold text-wz-heading">
              {comp.name}
            </span>
            {comp.isSystem ? (
              <Badge status="neutral" size="sm">
                system
              </Badge>
            ) : null}
            {FORMULA_TYPES.has(comp.calculationType || "") ? (
              <Badge status="info" size="sm">
                formula
              </Badge>
            ) : null}
            {comp.isPartOfCTC === false ? (
              <Badge status="warning" size="sm">
                Outside CTC
              </Badge>
            ) : null}
            {!active ? (
              <Badge status="neutral" size="sm">
                Inactive
              </Badge>
            ) : null}
          </div>
          <p className="m-0 mt-0.5 truncate text-xs leading-4 text-wz-text-muted">
            {componentCalcLabel(comp)}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          <button
            type="button"
            aria-label={`Edit ${comp.name}`}
            title="Edit"
            disabled={componentsQuery.isLoading}
            onClick={() => setComponentTarget({ mode: "edit", component: comp })}
            className="inline-flex size-8 cursor-pointer items-center justify-center rounded-wz-sm border border-wz-border bg-white text-wz-heading hover:bg-wz-hover disabled:cursor-not-allowed"
          >
            <SquarePen size={14} />
          </button>
          <button
            type="button"
            aria-label={`Delete ${comp.name}`}
            title={
              comp.isSystem
                ? "Core system components cannot be deleted"
                : "Delete"
            }
            disabled={comp.isSystem || componentsQuery.isLoading}
            onClick={() => setDeleteTarget({ kind: "component", item: comp })}
            className="inline-flex size-8 cursor-pointer items-center justify-center rounded-wz-sm border border-wz-border bg-white text-wz-danger hover:bg-wz-hover disabled:cursor-not-allowed disabled:text-wz-text-muted"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>
    );
  };

  const panel = (title: string, tone: PanelTone, rows: ReactNode) => (
    <div
      key={title}
      className="overflow-hidden rounded-wz-md border border-wz-border bg-white"
    >
      <div
        className={cn(
          "flex items-center justify-between px-3 py-2.5 text-xs font-semibold tracking-wide uppercase",
          toneClass[tone],
        )}
      >
        <span>{title}</span>
        <Layers size={15} aria-hidden />
      </div>
      {rows}
    </div>
  );

  const deleteDeleting =
    deleteStructureMutation.isPending || deleteComponentMutation.isPending;

  return (
    <div className="flex flex-col gap-wz-6">
      {listError ? (
        <div
          className="rounded-wz-md border border-wz-error/35 bg-wz-error/8 px-3.5 py-2.5 text-xs text-wz-error"
          role="alert"
        >
          {listError}
        </div>
      ) : null}

      {/* ── Organization Salary Structure ───────────────────── */}
      <Card className="w-full space-y-wz-5">
        <div className="flex flex-wrap items-start justify-between gap-wz-4">
          <div>
            <h2 className="m-0 text-lg font-semibold text-wz-heading">
              Organization Salary Structure
            </h2>
            <p className="m-0 mt-1 text-sm text-wz-text-muted">
              Manage and configure compensation structures for your employees.
            </p>
          </div>
          <Button
            variant="primary"
            size="toolbar"
            type="button"
            disabled={components.length === 0}
            title={
              components.length === 0
                ? "Create salary components first"
                : "Add Structure"
            }
            onClick={() => setStructureTarget({ mode: "create", structure: null })}
          >
            <Plus className="size-4" aria-hidden />
            Add Structure
          </Button>
        </div>

        {structuresQuery.isLoading ? (
          <p className="m-0 text-sm text-wz-text-muted">
            Loading salary structures…
          </p>
        ) : structuresErrorMessage ? (
          <p
            className="m-0 rounded-wz-md bg-[#fef3f2] px-3 py-2 text-sm text-[#b42318]"
            role="alert"
          >
            {structuresErrorMessage}
          </p>
        ) : total === 0 ? (
          <div className="flex flex-col items-center gap-3 rounded-wz-md border border-wz-border bg-wz-neutral-50 px-4 py-8 text-center">
            <Layers size={40} aria-hidden className="text-wz-text-muted" />
            <p className="m-0 text-sm text-wz-text-muted">
              No salary structures have been created yet.
            </p>
            <Button
              variant="primary"
              type="button"
              disabled={components.length === 0}
              onClick={() =>
                setStructureTarget({ mode: "create", structure: null })
              }
            >
              Create Your First Structure
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[820px] border-collapse">
              <thead>
                <tr>
                  {["Name", "Description", "Earnings", "Deductions", "Actions"].map(
                    (label) => (
                      <th key={label} className={thClass}>
                        {label}
                      </th>
                    ),
                  )}
                </tr>
              </thead>
              <tbody>
                {pageRows.map((structure) => (
                  <tr key={structure._id} className="hover:bg-wz-hover/40">
                    <td className={tdClass}>
                      <span className="font-semibold">{structure.name}</span>
                    </td>
                    <td className={tdClass}>
                      {structure.description ? (
                        <span className="text-wz-text-muted">
                          {structure.description}
                        </span>
                      ) : (
                        <span className="text-wz-text-muted">No description</span>
                      )}
                    </td>
                    <td className={tdClass}>
                      {renderPills(structure.earnings, "earning")}
                    </td>
                    <td className={tdClass}>
                      {renderPills(structure.deductions, "deduction")}
                    </td>
                    <td className={tdClass}>
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          aria-label={`Edit ${structure.name}`}
                          title="Edit"
                          onClick={() =>
                            setStructureTarget({ mode: "edit", structure })
                          }
                          className="inline-flex size-8 cursor-pointer items-center justify-center rounded-wz-sm border border-wz-border bg-white text-wz-heading hover:bg-wz-hover"
                        >
                          <SquarePen size={14} />
                        </button>
                        <button
                          type="button"
                          aria-label={`Delete ${structure.name}`}
                          title="Delete"
                          onClick={() =>
                            setDeleteTarget({ kind: "structure", item: structure })
                          }
                          className="inline-flex size-8 cursor-pointer items-center justify-center rounded-wz-sm border border-wz-border bg-white text-wz-danger hover:bg-wz-hover"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <Pagination
              page={pageSafe}
              pages={pages}
              onPageChange={setPage}
              summary={`Showing ${(pageSafe - 1) * PAGE_SIZE + 1}–${Math.min(
                pageSafe * PAGE_SIZE,
                total,
              )} of ${total} entries`}
            />
          </div>
        )}
      </Card>

      {/* ── Salary Components ───────────────────────────────── */}
      <Card className="w-full space-y-wz-5">
        <div className="flex flex-wrap items-start justify-between gap-wz-4">
          <div>
            <h2 className="m-0 text-lg font-semibold text-wz-heading">
              Salary Components
            </h2>
            <p className="m-0 mt-1 text-sm text-wz-text-muted">
              Set up what gets added to salary (earnings) and what gets taken
              out (deductions).
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {templates.length > 0 ? (
              <FilterSelect
                aria-label="Apply Template"
                value=""
                disabled={componentsQuery.isLoading}
                onChange={(e) => {
                  const key = e.target.value;
                  const template = templates.find((t) => t.key === key);
                  if (template) setTemplateTarget(template);
                }}
              >
                <option value="" disabled>
                  Apply Template…
                </option>
                {templates.map((t) => (
                  <option key={t.key} value={t.key}>
                    {t.label}
                  </option>
                ))}
              </FilterSelect>
            ) : null}
            <Button
              variant="primary"
              size="toolbar"
              type="button"
              disabled={componentsQuery.isLoading}
              onClick={() => setComponentTarget({ mode: "create", component: null })}
            >
              <Plus className="size-4" aria-hidden />
              Add Component
            </Button>
          </div>
        </div>

        {componentsQuery.isLoading ? (
          <p className="m-0 text-sm text-wz-text-muted">
            Loading salary components…
          </p>
        ) : componentsErrorMessage ? (
          <p
            className="m-0 rounded-wz-md bg-[#fef3f2] px-3 py-2 text-sm text-[#b42318]"
            role="alert"
          >
            {componentsErrorMessage}
          </p>
        ) : components.length === 0 ? (
          <div className="rounded-wz-md border border-wz-border bg-wz-neutral-50 px-4 py-6 text-center text-sm text-wz-text-muted">
            No salary components defined yet. Apply a template or add your
            first component.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-wz-4 md:grid-cols-2 xl:grid-cols-3">
            {panel(
              "Earnings",
              "earning",
              earnings.length ? (
                <div>{earnings.map(renderComponentRow)}</div>
              ) : (
                <p className="m-0 px-3 py-4 text-sm text-wz-text-muted">
                  No earnings defined
                </p>
              ),
            )}
            {panel(
              "Deductions",
              "deduction",
              deductions.length ? (
                <div>{deductions.map(renderComponentRow)}</div>
              ) : (
                <p className="m-0 px-3 py-4 text-sm text-wz-text-muted">
                  No deductions defined
                </p>
              ),
            )}
            {panel(
              "Employer Contributions",
              "employer",
              employerLines.length ? (
                <div>{employerLines.map(renderComponentRow)}</div>
              ) : (
                <p className="m-0 px-3 py-4 text-sm text-wz-text-muted">
                  No employer contributions defined
                </p>
              ),
            )}
          </div>
        )}
      </Card>

      {/* ── Modals ──────────────────────────────────────────── */}
      <SalaryStructureModal
        key={
          structureTarget
            ? `structure-${structureTarget.mode}-${structureTarget.structure?._id ?? "new"}`
            : "structure-closed"
        }
        open={structureTarget !== null}
        mode={structureTarget?.mode ?? "create"}
        structure={structureTarget?.structure ?? null}
        components={components}
        vendorId={vendorId ?? ""}
        onClose={() => setStructureTarget(null)}
      />

      <SalaryComponentModal
        key={
          componentTarget
            ? `component-${componentTarget.mode}-${componentTarget.component?.code ?? "new"}`
            : "component-closed"
        }
        open={componentTarget !== null}
        mode={componentTarget?.mode ?? "create"}
        component={componentTarget?.component ?? null}
        components={components}
        onClose={() => setComponentTarget(null)}
      />

      <ConfirmDialog
        open={deleteTarget !== null}
        title="Delete Item?"
        message={
          deleteTarget?.kind === "structure"
            ? `Are you sure you want to delete the structure "${deleteTarget.item.name}"? It can only be deleted if it is not currently assigned to any active employees.`
            : deleteTarget?.kind === "component"
              ? `Delete component '${deleteTarget.item.code}'? If it is currently in use, it will be disabled (soft-deleted) to protect historical payslips.`
              : "Are you sure you want to delete the selected item? This cannot be undone."
        }
        tone="destructive"
        confirmLabel={deleteDeleting ? "Deleting…" : "Delete"}
        loading={deleteDeleting}
        onConfirm={() => void confirmDelete()}
        onClose={() => {
          if (!deleteDeleting) setDeleteTarget(null);
        }}
      />

      <ConfirmDialog
        open={disableTarget !== null}
        title="Disable Component?"
        message={`${disableTarget?.name ?? "This component"} will be hidden from new salary structures. Existing payroll and historical payslips keep it.`}
        tone="destructive"
        confirmLabel={
          updateComponentMutation.isPending ? "Disabling…" : "Disable"
        }
        loading={updateComponentMutation.isPending}
        onConfirm={() => void confirmDisable()}
        onClose={() => {
          if (!updateComponentMutation.isPending) setDisableTarget(null);
        }}
      />

      <ConfirmDialog
        open={templateTarget !== null}
        title="Apply Template?"
        message="Applying a template will automatically replace your current non-system components. Do you want to continue?"
        tone="destructive"
        confirmLabel={
          applyTemplateMutation.isPending ? "Applying…" : "Apply Template"
        }
        loading={applyTemplateMutation.isPending}
        onConfirm={() => void confirmApplyTemplate()}
        onClose={() => {
          if (!applyTemplateMutation.isPending) setTemplateTarget(null);
        }}
      />
    </div>
  );
}

export default SalaryTab;
