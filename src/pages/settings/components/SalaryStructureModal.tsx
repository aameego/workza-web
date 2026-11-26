import { useRef, useState } from "react";
import { Layers, SlidersHorizontal } from "lucide-react";
import {
  Badge,
  Button,
  Field,
  Input,
  Modal,
  TextArea,
  cn,
  showSuccessToast,
} from "../../../design-system";
import { ApiError } from "../../../lib/apiClient";
import {
  useCreateSalaryStructure,
  useUpdateSalaryStructure,
} from "../../../hooks/useSalarySettings";
import type { SalaryComponent } from "../../../services/salaryComponentService";
import {
  structureItemId,
  type SalaryStructure,
  type StructureItem,
} from "../../../services/salaryStructureService";
import AdjustComponentOverrideModal from "./AdjustComponentOverrideModal";

type StructureForm = {
  name: string;
  description: string;
  earnings: StructureItem[];
  deductions: StructureItem[];
};

export type SalaryStructureModalProps = {
  open: boolean;
  mode: "create" | "edit";
  structure: SalaryStructure | null;
  components: SalaryComponent[];
  vendorId: string;
  onClose: () => void;
};

/** Keep only real component ids (the API populates them on read). */
const parseItems = (items?: StructureItem[]): StructureItem[] =>
  (items || [])
    .filter((item) => Boolean(structureItemId(item)))
    .map((item) => ({ ...item, componentId: structureItemId(item) as string }));

const sortBySortOrder = (
  items: StructureItem[],
  components: SalaryComponent[],
): StructureItem[] =>
  [...items].sort((a, b) => {
    const ca = components.find((c) => c._id === structureItemId(a));
    const cb = components.find((c) => c._id === structureItemId(b));
    return (ca?.sortOrder ?? 999) - (cb?.sortOrder ?? 999);
  });

const hasOverrides = (entry?: StructureItem): boolean => {
  if (!entry) return false;
  return (
    entry.calculationTypeOverride != null ||
    entry.rateOverride != null ||
    entry.fixedAmountOverride != null ||
    entry.formulaOverride != null ||
    entry.baseComponentOverride != null ||
    entry.capOverride != null ||
    entry.thresholdOverride != null
  );
};

/**
 * Add / Edit Salary Structure — pick which components the structure includes,
 * with a per-structure override ("Adjust Basic Salary") for any selected row.
 */
export function SalaryStructureModal({
  open,
  mode,
  structure,
  components,
  vendorId,
  onClose,
}: SalaryStructureModalProps) {
  const basic = components.find((c) => c.code === "BASIC");

  const [form, setForm] = useState<StructureForm>(() => {
    if (mode === "edit" && structure) {
      let earnings = sortBySortOrder(parseItems(structure.earnings), components);
      const deductions = sortBySortOrder(
        parseItems(structure.deductions),
        components,
      );
      if (basic && !earnings.some((e) => structureItemId(e) === basic._id)) {
        earnings = [...earnings, { componentId: basic._id }];
      }
      return {
        name: structure.name || "",
        description: structure.description || "",
        earnings,
        deductions,
      };
    }
    return {
      name: "",
      description: "",
      earnings: basic ? [{ componentId: basic._id }] : [],
      deductions: [],
    };
  });

  const [nameError, setNameError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const createMutation = useCreateSalaryStructure();
  const updateMutation = useUpdateSalaryStructure();
  const saving = createMutation.isPending || updateMutation.isPending;
  const submittingRef = useRef(false);

  const [overrideTarget, setOverrideTarget] = useState<{
    comp: SalaryComponent;
    category: "Earning" | "Deduction";
  } | null>(null);

  const listKey = (category: "Earning" | "Deduction") =>
    category === "Earning" ? "earnings" : "deductions";

  const toggleComponent = (comp: SalaryComponent) => {
    if (submitError) setSubmitError(null);
    if (comp.code === "BASIC") return; // required in every structure
    const key = listKey(comp.category);
    setForm((prev) => {
      const exists = prev[key].some((e) => structureItemId(e) === comp._id);
      return {
        ...prev,
        [key]: exists
          ? prev[key].filter((e) => structureItemId(e) !== comp._id)
          : [...prev[key], { componentId: comp._id }],
      };
    });
  };

  const entryFor = (
    comp: SalaryComponent,
    category: "Earning" | "Deduction",
  ): StructureItem | undefined =>
    form[listKey(category)].find((e) => structureItemId(e) === comp._id);

  const replaceEntry = (
    comp: SalaryComponent,
    category: "Earning" | "Deduction",
    entry: StructureItem,
  ) => {
    const key = listKey(category);
    setForm((prev) => ({
      ...prev,
      [key]: prev[key].map((e) =>
        structureItemId(e) === comp._id ? entry : e,
      ),
    }));
  };

  const handleClose = () => {
    if (saving || overrideTarget) return;
    onClose();
  };

  const handleSubmit = async () => {
    if (submittingRef.current || saving) return;

    const name = form.name.trim();
    if (!name) {
      setNameError("Structure Name is required.");
      return;
    }
    if (name.length > 100) {
      setNameError("Structure Name cannot exceed 100 characters.");
      return;
    }
    if (form.description.trim().length > 500) {
      setSubmitError("Description cannot exceed 500 characters.");
      return;
    }
    if (form.earnings.length === 0 && form.deductions.length === 0) {
      setSubmitError("Please select at least one Earning or Deduction component.");
      return;
    }
    if (!vendorId) {
      setSubmitError(
        "Could not identify your organization. Please log in again.",
      );
      return;
    }

    setNameError(null);
    setSubmitError(null);

    const payload = {
      vendorId,
      name,
      description: form.description.trim(),
      earnings: sortBySortOrder(form.earnings, components),
      deductions: sortBySortOrder(form.deductions, components),
    };

    submittingRef.current = true;
    try {
      if (mode === "edit" && structure) {
        await updateMutation.mutateAsync({
          structureId: structure._id,
          vendorId,
          data: payload,
        });
        showSuccessToast("Salary structure updated.");
      } else {
        await createMutation.mutateAsync(payload);
        showSuccessToast("Salary structure created.");
      }
      onClose();
    } catch (err) {
      setSubmitError(
        err instanceof ApiError
          ? err.message
          : "Could not save salary structure.",
      );
    } finally {
      submittingRef.current = false;
    }
  };

  const availableEarnings = components.filter((c) => c.category === "Earning");
  const availableDeductions = components.filter(
    (c) => c.category === "Deduction",
  );

  const renderRow = (
    comp: SalaryComponent,
    category: "Earning" | "Deduction",
  ) => {
    const isBasic = comp.code === "BASIC";
    const entry = entryFor(comp, category);
    const selected = isBasic || Boolean(entry);
    const modified = hasOverrides(entry);

    return (
      <div
        key={comp._id}
        className="flex items-center justify-between gap-2 border-b border-wz-border px-3 py-2 last:border-b-0"
      >
        <label
          className={cn(
            "flex flex-1 cursor-pointer items-center gap-2 text-sm text-wz-heading",
            isBasic && "cursor-not-allowed",
          )}
        >
          <input
            type="checkbox"
            className="size-4 shrink-0 cursor-pointer accent-wz-primary disabled:cursor-not-allowed"
            checked={selected}
            disabled={isBasic || saving}
            onChange={() => toggleComponent(comp)}
          />
          <span className="flex flex-wrap items-center gap-1.5">
            {comp.name}
            {isBasic ? (
              <span className="text-[11px] font-semibold text-wz-error">
                *Required
              </span>
            ) : null}
            {modified ? (
              <Badge status="warning" size="sm">
                Modified
              </Badge>
            ) : null}
          </span>
        </label>
        {selected ? (
          <button
            type="button"
            title="Adjust for this structure"
            aria-label={`Adjust ${comp.name} for this structure`}
            disabled={saving}
            onClick={() => setOverrideTarget({ comp, category })}
            className="inline-flex size-8 shrink-0 cursor-pointer items-center justify-center rounded-wz-sm border border-wz-border bg-white text-wz-heading hover:bg-wz-hover disabled:cursor-not-allowed"
          >
            <SlidersHorizontal size={14} />
          </button>
        ) : null}
      </div>
    );
  };

  const panelClass =
    "overflow-hidden rounded-wz-md border border-wz-border bg-white";

  const headerClass = (tone: "earning" | "deduction") =>
    cn(
      "flex items-center justify-between px-3 py-2.5 text-xs font-semibold tracking-wide uppercase",
      tone === "earning"
        ? "bg-wz-badge-success-bg text-wz-badge-success-fg"
        : "bg-wz-badge-error-bg text-wz-badge-error-fg",
    );

  return (
    <>
      <Modal
        open={open}
        title={mode === "edit" ? "Edit Structure" : "Add Structure"}
        onClose={handleClose}
        size="lg"
        footer={
          <>
            <Button
              variant="secondary"
              type="button"
              onClick={handleClose}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              type="button"
              onClick={() => void handleSubmit()}
              disabled={saving || !form.name.trim()}
            >
              {saving
                ? "Saving…"
                : mode === "edit"
                  ? "Update Structure"
                  : "Add Structure"}
            </Button>
          </>
        }
      >
        <div className="flex flex-col gap-wz-4">
          {submitError ? (
            <div
              className="rounded-wz-md border border-wz-error/35 bg-wz-error/8 px-3.5 py-2.5 text-xs text-wz-error"
              role="alert"
            >
              {submitError}
            </div>
          ) : null}

          <Field
            label="Structure Name"
            htmlFor="structure-name"
            required
            error={nameError ?? undefined}
          >
            <Input
              id="structure-name"
              maxLength={100}
              placeholder="e.g. Standard Tier, Marketing Team"
              value={form.name}
              disabled={saving}
              invalid={Boolean(nameError)}
              onChange={(e) => {
                setForm((prev) => ({ ...prev, name: e.target.value }));
                if (nameError) setNameError(null);
                if (submitError) setSubmitError(null);
              }}
            />
          </Field>

          <Field label="Description" htmlFor="structure-desc">
            <TextArea
              id="structure-desc"
              rows={2}
              maxLength={500}
              placeholder="Enter reason here"
              value={form.description}
              disabled={saving}
              onChange={(e) => {
                setForm((prev) => ({ ...prev, description: e.target.value }));
                if (submitError) setSubmitError(null);
              }}
            />
          </Field>

          {components.length === 0 ? (
            <p className="m-0 text-sm text-wz-text-muted">
              Loading salary components…
            </p>
          ) : (
            <div className="grid grid-cols-1 gap-wz-4 lg:grid-cols-2">
              <div className={panelClass}>
                <div className={headerClass("earning")}>
                  <span>Select Earnings</span>
                  <Layers size={15} aria-hidden />
                </div>
                <div className="max-h-[300px] overflow-y-auto">
                  {availableEarnings.length ? (
                    availableEarnings.map((c) => renderRow(c, "Earning"))
                  ) : (
                    <p className="m-0 px-3 py-4 text-sm text-wz-text-muted">
                      No earnings available.
                    </p>
                  )}
                </div>
              </div>

              <div className={panelClass}>
                <div className={headerClass("deduction")}>
                  <span>Select Deductions</span>
                  <Layers size={15} aria-hidden />
                </div>
                <div className="max-h-[300px] overflow-y-auto">
                  {availableDeductions.length ? (
                    availableDeductions.map((c) => renderRow(c, "Deduction"))
                  ) : (
                    <p className="m-0 px-3 py-4 text-sm text-wz-text-muted">
                      No deductions available.
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </Modal>

      {overrideTarget ? (
        <AdjustComponentOverrideModal
          key={`adjust-${overrideTarget.category}-${overrideTarget.comp._id}`}
          open
          component={overrideTarget.comp}
          entry={
            entryFor(overrideTarget.comp, overrideTarget.category) ?? {
              componentId: overrideTarget.comp._id,
            }
          }
          components={components}
          onClose={() => setOverrideTarget(null)}
          onReset={() => {
            replaceEntry(
              overrideTarget.comp,
              overrideTarget.category,
              { componentId: overrideTarget.comp._id },
            );
            setOverrideTarget(null);
          }}
          onSave={(next) => {
            replaceEntry(overrideTarget.comp, overrideTarget.category, next);
            setOverrideTarget(null);
          }}
        />
      ) : null}
    </>
  );
}

export default SalaryStructureModal;
