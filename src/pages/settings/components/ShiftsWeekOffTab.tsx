import { useMemo, useState } from "react";
import { ArrowRight, Plus, SquarePen, Trash2 } from "lucide-react";
import {
  Badge,
  Button,
  Card,
  ConfirmDialog,
  Field,
  Select,
  cn,
  showSuccessToast,
} from "../../../design-system";
import { ApiError } from "../../../lib/apiClient";
import { readSessionUser } from "../../../layouts/sessionUser";
import { useDepartments } from "../../../hooks/useDepartments";
import {
  useCreateWeekOff,
  useDeleteShift,
  useDeleteWeekOff,
  useShiftSettings,
  useUpdateWeekOff,
  useWeekOffs,
} from "../../../hooks/useShiftWeekOff";
import {
  WEEKDAYS,
  type Shift,
  type WeekOffPolicy,
  type Weekday,
} from "../../../services/shiftService";
import CreateShiftModal from "./CreateShiftModal";

const thClass =
  "h-[54px] border-b border-wz-border bg-white px-4 text-left align-middle text-xs leading-[normal] font-semibold text-wz-heading";
const tdClass =
  "h-[60px] border-b border-wz-border px-4 py-0 align-middle text-xs leading-[normal] text-wz-heading";

const SHORT_DAY: Record<Weekday, string> = {
  Monday: "Mon",
  Tuesday: "Tue",
  Wednesday: "Wed",
  Thursday: "Thu",
  Friday: "Fri",
  Saturday: "Sat",
  Sunday: "Sun",
};

type DeleteTarget =
  | { kind: "shift"; item: Shift }
  | { kind: "weekOff"; item: WeekOffPolicy };

export function ShiftsWeekOffTab() {
  const vendorId = readSessionUser()?.vendorId ?? null;

  const shiftsQuery = useShiftSettings(vendorId);
  const weekOffsQuery = useWeekOffs(vendorId);
  const createWeekOffMutation = useCreateWeekOff();
  const updateWeekOffMutation = useUpdateWeekOff();
  const deleteWeekOffMutation = useDeleteWeekOff();
  const deleteShiftMutation = useDeleteShift();

  const { data: departments = [] } = useDepartments(vendorId);

  const shifts = shiftsQuery.data ?? [];

  // ── Create/Edit shift modal ─────────────────────────────
  const [shiftModalOpen, setShiftModalOpen] = useState(false);
  const [shiftModalMode, setShiftModalMode] = useState<"create" | "edit">(
    "create",
  );
  const [selectedShift, setSelectedShift] = useState<Shift | null>(null);

  // ── Week-off form ───────────────────────────────────────
  const [weekOffDepartment, setWeekOffDepartment] = useState("");
  const [weekOffDays, setWeekOffDays] = useState<Weekday[]>([
    "Saturday",
    "Sunday",
  ]);
  const [editingWeekOffId, setEditingWeekOffId] = useState<string | null>(null);
  const [weekOffError, setWeekOffError] = useState<string | null>(null);

  // ── Delete confirm ──────────────────────────────────────
  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget | null>(null);
  const [listError, setListError] = useState<string | null>(null);

  const savingWeekOff =
    createWeekOffMutation.isPending || updateWeekOffMutation.isPending;

  const openCreateShift = () => {
    setShiftModalMode("create");
    setSelectedShift(null);
    setShiftModalOpen(true);
    setListError(null);
  };

  const openEditShift = (shift: Shift) => {
    setShiftModalMode("edit");
    setSelectedShift(shift);
    setShiftModalOpen(true);
    setListError(null);
  };

  const toggleDay = (day: Weekday) => {
    setWeekOffDays((prev) =>
      prev.includes(day)
        ? prev.filter((d) => d !== day)
        : [...prev, day],
    );
    if (weekOffError) setWeekOffError(null);
  };

  const startEditWeekOff = (config: WeekOffPolicy) => {
    setEditingWeekOffId(config._id);
    setWeekOffDepartment(config.department || "");
    setWeekOffDays(
      Array.isArray(config.weekOffDays) && config.weekOffDays.length > 0
        ? config.weekOffDays
        : ["Sunday"],
    );
    setWeekOffError(null);
    setListError(null);
  };

  const resetWeekOffForm = () => {
    setEditingWeekOffId(null);
    setWeekOffDepartment("");
    setWeekOffDays(["Saturday", "Sunday"]);
    setWeekOffError(null);
  };

  const handleWeekOffSave = async () => {
    if (savingWeekOff) return;
    setWeekOffError(null);

    if (!vendorId) {
      setWeekOffError(
        "Could not identify your organization. Please log in again.",
      );
      return;
    }
    // Backend rejects an all-7-days selection — at least one working day must remain.
    if (weekOffDays.length >= 7) {
      setWeekOffError("At least one working day must remain.");
      return;
    }

    const payload = {
      vendorId,
      department: weekOffDepartment || null,
      weekOffDays,
    };

    try {
      if (editingWeekOffId) {
        await updateWeekOffMutation.mutateAsync({
          weekOffId: editingWeekOffId,
          data: payload,
        });
        showSuccessToast("Week-off configuration updated.");
      } else {
        await createWeekOffMutation.mutateAsync(payload);
        showSuccessToast("Week-off configuration created.");
      }
      resetWeekOffForm();
    } catch (err) {
      setWeekOffError(
        err instanceof ApiError
          ? err.message
          : "Could not save week-off configuration.",
      );
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      if (deleteTarget.kind === "shift") {
        await deleteShiftMutation.mutateAsync(deleteTarget.item._id);
        showSuccessToast("Shift deleted.");
      } else {
        await deleteWeekOffMutation.mutateAsync(deleteTarget.item._id);
        showSuccessToast("Week-off configuration deleted.");
        if (editingWeekOffId === deleteTarget.item._id) resetWeekOffForm();
      }
      setDeleteTarget(null);
    } catch (err) {
      setListError(
        err instanceof ApiError
          ? err.message
          : deleteTarget.kind === "shift"
            ? "Could not delete shift."
            : "Could not delete week-off configuration.",
      );
      setDeleteTarget(null);
    }
  };

  /** Org default first, then alphabetical by department. */
  const sortedWeekOffs = useMemo(() => {
    const weekOffs = weekOffsQuery.data ?? [];
    return [...weekOffs].sort((a, b) => {
      if (!a.department && b.department) return -1;
      if (a.department && !b.department) return 1;
      return String(a.department || "").localeCompare(
        String(b.department || ""),
      );
    });
  }, [weekOffsQuery.data]);

  const deleting =
    deleteShiftMutation.isPending || deleteWeekOffMutation.isPending;

  const shiftsErrorMessage = shiftsQuery.error
    ? shiftsQuery.error instanceof ApiError
      ? shiftsQuery.error.message
      : "Could not load shifts."
    : null;
  const weekOffsErrorMessage = weekOffsQuery.error
    ? weekOffsQuery.error instanceof ApiError
      ? weekOffsQuery.error.message
      : "Could not load week-off policies."
    : null;

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

      {/* ── Existing Shifts ─────────────────────────────────── */}
      <Card className="w-full">
        <div className="flex flex-wrap items-center justify-between gap-wz-4">
          <h2 className="m-0 text-lg font-semibold text-wz-heading">
            Existing Shifts ({shifts.length})
          </h2>
          <Button
            variant="primary"
            size="toolbar"
            type="button"
            onClick={openCreateShift}
          >
            <Plus className="size-4" aria-hidden />
            Create Shift
          </Button>
        </div>

        {shiftsQuery.isLoading ? (
          <p className="m-0 text-sm text-wz-text-muted">
            Loading shift profiles…
          </p>
        ) : shiftsErrorMessage ? (
          <p
            className="m-0 rounded-wz-md bg-[#fef3f2] px-3 py-2 text-sm text-[#b42318]"
            role="alert"
          >
            {shiftsErrorMessage}
          </p>
        ) : shifts.length === 0 ? (
          <div className="rounded-wz-md border border-wz-border bg-wz-neutral-50 px-4 py-6 text-center text-sm text-wz-text-muted">
            No shifts configured yet.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-wz-4 md:grid-cols-2 xl:grid-cols-3">
            {shifts.map((shift) => (
              <div
                key={shift._id}
                className="flex flex-col rounded-wz-lg border border-wz-border bg-white p-wz-5"
              >
                <div className="mb-3 flex items-center justify-between gap-2">
                  <span className="text-base font-semibold text-wz-heading">
                    {shift.shiftName}
                  </span>
                  {/* Backend has no isActive yet — defaults to Active when absent. */}
                  <Badge
                    status={shift.isActive === false ? "error" : "success"}
                  >
                    {shift.isActive === false ? "Inactive" : "Active"}
                  </Badge>
                </div>

                <div className="mb-4 flex items-center justify-between rounded-wz-md bg-wz-neutral-50 px-3 py-2.5">
                  <div className="flex flex-col">
                    <span className="text-[10px] font-semibold tracking-wide text-wz-text-muted uppercase">
                      Start
                    </span>
                    <span className="text-base font-bold text-wz-heading">
                      {shift.startTime}
                    </span>
                  </div>
                  <ArrowRight
                    size={16}
                    aria-hidden
                    className="text-wz-text-muted"
                  />
                  <div className="flex flex-col items-end">
                    <span className="text-[10px] font-semibold tracking-wide text-wz-text-muted uppercase">
                      End
                    </span>
                    <span className="text-base font-bold text-wz-heading">
                      {shift.endTime}
                    </span>
                  </div>
                </div>

                <div className="mb-2 flex items-center justify-between text-xs">
                  <span className="text-wz-text-muted">Grace Period:</span>
                  <span className="font-semibold text-wz-danger">
                    {shift.graceTime} mins
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-wz-text-muted">Late Mark Policy:</span>
                  <span className="font-semibold text-wz-heading">
                    {shift.status}
                  </span>
                </div>

                <div className="mt-4 flex items-center justify-between border-t border-wz-border pt-3">
                  <span className="text-xs text-wz-text-muted">Action:</span>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      className="inline-flex size-8 cursor-pointer items-center justify-center rounded-wz-sm border border-wz-border bg-white text-wz-heading hover:bg-wz-hover"
                      aria-label={`Edit ${shift.shiftName}`}
                      onClick={() => openEditShift(shift)}
                    >
                      <SquarePen size={14} />
                    </button>
                    <button
                      type="button"
                      className="inline-flex size-8 cursor-pointer items-center justify-center rounded-wz-sm border border-wz-border bg-white text-wz-danger hover:bg-wz-hover"
                      aria-label={`Delete ${shift.shiftName}`}
                      onClick={() => setDeleteTarget({ kind: "shift", item: shift })}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* ── Add / Edit Week-Off Policy form ─────────────────── */}
      <Card className="w-full">
        <div className="flex flex-col gap-wz-4">
          <h2 className="m-0 text-lg font-semibold text-wz-heading">
            {editingWeekOffId ? "Edit Week-Off Policy" : "Add Week-Off Policy"}
          </h2>

          {weekOffError ? (
            <div
              className="rounded-wz-md border border-wz-error/35 bg-wz-error/8 px-3.5 py-2.5 text-xs text-wz-error"
              role="alert"
            >
              {weekOffError}
            </div>
          ) : null}

          <Field
            label="Department"
            htmlFor="weekoff-department"
            hint="Leave blank for org-wide default. It can have Saturday–Sunday off while others keep only Sunday."
          >
            <Select
              id="weekoff-department"
              value={weekOffDepartment}
              onChange={(e) => {
                setWeekOffDepartment(e.target.value);
                if (weekOffError) setWeekOffError(null);
              }}
              disabled={Boolean(editingWeekOffId)}
            >
              <option value="">All Departments (Default)</option>
              {departments.map((dept) => (
                <option key={dept._id || dept.name} value={dept.name}>
                  {dept.name}
                </option>
              ))}
            </Select>
          </Field>

          <div className="flex flex-wrap items-center justify-between gap-wz-4">
            <h3 className="m-0 text-sm font-bold text-wz-heading">
              Week-Off Days
            </h3>
            <div className="flex items-center gap-wz-3">
              {editingWeekOffId ? (
                <Button
                  variant="secondary"
                  type="button"
                  onClick={resetWeekOffForm}
                  disabled={savingWeekOff}
                >
                  Cancel
                </Button>
              ) : null}
              <Button
                variant="primary"
                type="button"
                onClick={() => void handleWeekOffSave()}
                disabled={savingWeekOff}
              >
                {savingWeekOff ? "Saving…" : "Save Changes"}
              </Button>
            </div>
          </div>

          <div className="flex flex-wrap gap-4">
            {WEEKDAYS.map((day) => {
              const selected = weekOffDays.includes(day);
              return (
                <button
                  key={day}
                  type="button"
                  aria-pressed={selected}
                  onClick={() => toggleDay(day)}
                  className={cn(
                    "cursor-pointer rounded-wz-md border px-4 py-2.5 text-sm font-semibold transition-colors",
                    selected
                      ? "border-wz-primary bg-wz-primary text-white"
                      : "border-wz-border bg-white text-wz-heading hover:bg-wz-neutral-50",
                  )}
                >
                  {SHORT_DAY[day]}
                </button>
              );
            })}
          </div>
        </div>
      </Card>

      {/* ── Week-Off Policy table ───────────────────────────── */}
      <Card className="w-full">
        <div>
          <h2 className="m-0 text-lg font-semibold text-wz-heading">
            Week-Off Policy
          </h2>
          <p className="m-0 mt-1 text-sm text-wz-text-muted">
            Configure weekly off days by department. Department rules override
            the organization default.
          </p>
        </div>

        {weekOffsQuery.isLoading ? (
          <p className="m-0 text-sm text-wz-text-muted">
            Loading week-off configurations…
          </p>
        ) : weekOffsErrorMessage ? (
          <p
            className="m-0 rounded-wz-md bg-[#fef3f2] px-3 py-2 text-sm text-[#b42318]"
            role="alert"
          >
            {weekOffsErrorMessage}
          </p>
        ) : sortedWeekOffs.length === 0 ? (
          <div className="rounded-wz-md border border-wz-border bg-wz-neutral-50 px-4 py-6 text-center text-sm text-wz-text-muted">
            No week-off policies yet. Create an organization default (e.g.
            Sunday off), then add department-specific rules if needed.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] border-collapse">
              <thead>
                <tr>
                  {["Scope", "Description", "Weekly Off Days", "Actions"].map(
                    (label) => (
                      <th key={label} className={thClass}>
                        {label}
                      </th>
                    ),
                  )}
                </tr>
              </thead>
              <tbody>
                {sortedWeekOffs.map((config) => (
                  <tr key={config._id} className="hover:bg-wz-hover/40">
                    <td className={tdClass}>
                      <span className="font-semibold">
                        {config.department || "All Departments (Default)"}
                      </span>
                    </td>
                    <td className={tdClass}>
                      <span className="text-wz-text-muted">
                        {config.department
                          ? "Department-specific policy"
                          : "Fallback for departments without their own policy"}
                      </span>
                    </td>
                    <td className={tdClass}>
                      {config.weekOffDays?.length ? (
                        config.weekOffDays.join(", ")
                      ) : (
                        <span className="text-wz-text-muted">No week-off</span>
                      )}
                    </td>
                    <td className={tdClass}>
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          className="inline-flex size-8 cursor-pointer items-center justify-center rounded-wz-sm border border-wz-border bg-white text-wz-heading hover:bg-wz-hover"
                          aria-label={`Edit ${config.department || "default"} week-off policy`}
                          onClick={() => startEditWeekOff(config)}
                        >
                          <SquarePen size={14} />
                        </button>
                        <button
                          type="button"
                          className="inline-flex size-8 cursor-pointer items-center justify-center rounded-wz-sm border border-wz-border bg-white text-wz-danger hover:bg-wz-hover"
                          aria-label={`Delete ${config.department || "default"} week-off policy`}
                          onClick={() =>
                            setDeleteTarget({ kind: "weekOff", item: config })
                          }
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
      </Card>

      <CreateShiftModal
        key={
          shiftModalOpen
            ? `shift-${shiftModalMode}-${selectedShift?._id ?? "new"}`
            : "shift-closed"
        }
        open={shiftModalOpen}
        mode={shiftModalMode}
        shift={selectedShift}
        vendorId={vendorId ?? ""}
        onClose={() => {
          setShiftModalOpen(false);
          setSelectedShift(null);
        }}
      />

      <ConfirmDialog
        open={deleteTarget !== null}
        title="Delete Item?"
        message="Are you sure you want to delete the selected item? This cannot be undone."
        tone="destructive"
        confirmLabel={deleting ? "Deleting…" : "Delete"}
        loading={deleting}
        onConfirm={() => void confirmDelete()}
        onClose={() => {
          if (!deleting) setDeleteTarget(null);
        }}
      />
    </div>
  );
}

export default ShiftsWeekOffTab;
