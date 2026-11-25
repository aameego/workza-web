import { useEffect, useRef, useState } from "react";
import { ChevronDown, CircleCheck, Eye, Lock, X } from "lucide-react";
import { Badge, Button, Field, Input, Modal, TextArea, cn, showSuccessToast } from "../../../design-system";
import { ApiError } from "../../../lib/apiClient";
import { useSaveRole } from "../../../hooks/useRoles";
import type { RoleOption } from "../../../services/roleService";
import {
  BASELINE_PERMISSIONS,
  ELEVATED_GROUPS,
  elevatedOf,
  permissionsToSave,
  roleLabel,
  roleNameError,
  type PermissionGroup,
} from "../rolePermissions";

function GroupCheckbox({
  checked,
  partial,
  disabled,
  label,
  onChange,
}: {
  checked: boolean;
  partial?: boolean;
  disabled?: boolean;
  label: string;
  onChange?: (checked: boolean) => void;
}) {
  const ref = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (ref.current) ref.current.indeterminate = Boolean(partial);
  }, [partial]);
  return (
    <input
      ref={ref}
      type="checkbox"
      aria-label={label}
      className="mt-[2px] size-3 shrink-0 cursor-pointer accent-wz-primary disabled:cursor-default"
      checked={checked}
      disabled={disabled}
      onChange={(e) => onChange?.(e.target.checked)}
    />
  );
}

function PermissionGroupBlock({
  group,
  selected,
  readOnly,
  open,
  onToggleOpen,
  onChange,
}: {
  group: PermissionGroup;
  selected: Set<string>;
  readOnly: boolean;
  open: boolean;
  onToggleOpen: () => void;
  onChange: (keys: string[], on: boolean) => void;
}) {
  const count = group.perms.filter((p) => selected.has(p.key)).length;
  const all = count === group.perms.length;
  return (
    <div className="flex flex-col gap-2">
      {/* Figma group header: #f6f8fb fill, #e1e6ef border, 5 radius, 6/8 padding */}
      <div className="flex items-center justify-between rounded-[5px] border border-[#e1e6ef] bg-[#f6f8fb] px-2 py-1.5">
        <div className="flex items-center gap-2">
          <GroupCheckbox
            label={`All ${group.label} permissions`}
            checked={all}
            partial={count > 0 && !all}
            disabled={readOnly}
            onChange={(on) => onChange(group.perms.map((p) => p.key), on)}
          />
          <span className="text-xs font-semibold leading-[1.45] text-wz-heading">{group.label}</span>
          <span className="text-[10px] leading-[1.45] text-wz-text-muted">
            ({count}/{group.perms.length})
          </span>
        </div>
        <button
          type="button"
          className="inline-flex cursor-pointer border-0 bg-transparent p-0 text-wz-text-muted"
          aria-label={`${open ? "Collapse" : "Expand"} ${group.label}`}
          aria-expanded={open}
          onClick={onToggleOpen}
        >
          <ChevronDown size={14} className={cn("transition-transform", open && "rotate-180")} />
        </button>
      </div>
      {open ? (
        <div className="grid grid-cols-2 gap-x-3 px-2">
          {group.perms.map((perm) => (
            <label key={perm.key} className="flex cursor-pointer items-start gap-[7px] py-1">
              <GroupCheckbox
                label={perm.label}
                checked={selected.has(perm.key)}
                disabled={readOnly}
                onChange={(on) => onChange([perm.key], on)}
              />
              <span className="text-[11px] leading-[1.45] text-wz-heading">{perm.label}</span>
            </label>
          ))}
        </div>
      ) : null}
    </div>
  );
}

/** Figma permission editor: locked self-service list + HR/Admin feature groups. */
function PermissionEditor({
  selected,
  readOnly = false,
  onChange,
}: {
  selected: Set<string>;
  readOnly?: boolean;
  onChange?: (next: Set<string>) => void;
}) {
  // Groups that already hold a permission start open; on a blank role the first one does.
  const [openGroups, setOpenGroups] = useState<Set<string>>(() => {
    const withPerms = ELEVATED_GROUPS.filter((g) => g.perms.some((p) => selected.has(p.key)));
    return new Set((withPerms.length ? withPerms : ELEVATED_GROUPS.slice(0, 1)).map((g) => g.key));
  });

  const toggle = (keys: string[], on: boolean) => {
    const next = new Set(selected);
    keys.forEach((k) => (on ? next.add(k) : next.delete(k)));
    onChange?.(next);
  };

  return (
    <div className="flex flex-col gap-wz-6">
      <div className="flex flex-col gap-2">
        {/* Figma Self-Service (Auto): #edfdf5 fill, #b5ebcd border, 6 radius */}
        <div className="flex items-center justify-between rounded-[6px] border border-[#b5ebcd] bg-[#edfdf5] px-2 py-1.5">
          <div className="flex items-center gap-2">
            <CircleCheck size={16} className="text-wz-success" />
            <span className="text-[13px] font-semibold leading-[1.45] text-wz-heading">
              Self-Service (Auto)
            </span>
            <span className="text-[10px] leading-[1.45] text-wz-text-muted">
              ({BASELINE_PERMISSIONS.length}/{BASELINE_PERMISSIONS.length})
            </span>
          </div>
          <Badge status="success" size="sm">
            Auto Generated
          </Badge>
        </div>
        <ul className="m-0 grid list-none grid-cols-2 gap-x-2 gap-y-1 p-0">
          {BASELINE_PERMISSIONS.map((key) => (
            <li key={key} className="flex h-[26px] items-center gap-[7px] pl-1.5">
              <Lock size={12} className="shrink-0 text-[#667b96]" aria-hidden />
              <span className="text-[11px] leading-[1.45] text-[#667b96]">{key}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="flex flex-col gap-3.5">
        <p className="m-0 text-xs font-semibold leading-[1.45] text-wz-heading">HR / Admin Features</p>
        {ELEVATED_GROUPS.map((group) => (
          <PermissionGroupBlock
            key={group.key}
            group={group}
            selected={selected}
            readOnly={readOnly}
            open={openGroups.has(group.key)}
            onToggleOpen={() =>
              setOpenGroups((prev) => {
                const next = new Set(prev);
                if (next.has(group.key)) next.delete(group.key);
                else next.add(group.key);
                return next;
              })
            }
            onChange={toggle}
          />
        ))}
      </div>
    </div>
  );
}

/** Figma "Create New Role" / "Edit Role" overlay. */
export function RoleFormModal({
  open,
  role,
  onClose,
}: {
  open: boolean;
  /** null = create */
  role: RoleOption | null;
  onClose: () => void;
}) {
  const save = useSaveRole();
  const [name, setName] = useState(() => (role ? roleLabel(role) : ""));
  const [description, setDescription] = useState(role?.description || "");
  const [selected, setSelected] = useState(() => elevatedOf(role?.permissions || []));
  const [touched, setTouched] = useState(false);
  const [error, setError] = useState("");

  const nameLocked = Boolean(role?.isSystem);
  const nameError = nameLocked ? "" : roleNameError(name);
  const noPermission = selected.size === 0;

  const submit = async () => {
    setTouched(true);
    if (nameError || noPermission) return;
    setError("");
    try {
      await save.mutateAsync({
        id: role?._id,
        input: {
          // System roles keep their key; custom roles use the typed name as key and label.
          roleName: nameLocked && role ? role.roleName : name.trim(),
          displayName: nameLocked && role ? roleLabel(role) : name.trim(),
          description: description.trim(),
          permissions: permissionsToSave(selected),
          baselinePermissions: BASELINE_PERMISSIONS,
        },
      });
      showSuccessToast(role ? "Role updated." : "Role created.");
      onClose();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not save the role.");
    }
  };

  return (
    <Modal
      open={open}
      title={
        role ? (
          "Edit Role"
        ) : (
          // Figma: web says "Create New Role", the mobile sheet "Create Role".
          <>
            <span className="max-md:hidden">Create New Role</span>
            <span className="md:hidden">Create Role</span>
          </>
        )
      }
      onClose={onClose}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={save.isPending}>
            {save.isPending ? "Saving…" : role ? "Save Changes" : "Create Role"}
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-wz-6">
        <Field
          label="Role Name"
          htmlFor="role-name"
          required
          error={touched ? nameError : ""}
          hint={nameLocked ? "Built-in role names cannot be changed." : undefined}
        >
          <Input
            id="role-name"
            placeholder="Enter here"
            value={name}
            maxLength={50}
            disabled={nameLocked}
            invalid={touched && Boolean(nameError)}
            onChange={(e) => setName(e.target.value)}
          />
        </Field>
        <Field label="Description" htmlFor="role-description">
          <TextArea
            id="role-description"
            placeholder="Enter here"
            rows={3}
            value={description}
            maxLength={200}
            onChange={(e) => setDescription(e.target.value)}
          />
        </Field>

        <div className="flex flex-col gap-wz-4">
          <div className="flex items-center gap-1.5 leading-[1.45]">
            <span className="text-[13px] font-semibold text-wz-heading">Permissions</span>
            <span className="text-[10px] text-wz-text-muted">(Employee access already pre-selected)</span>
          </div>
          {touched && noPermission ? (
            <p className="m-0 text-xs text-wz-error" role="alert">
              Select at least one HR / Admin permission.
            </p>
          ) : null}
          <PermissionEditor selected={selected} onChange={setSelected} />
        </div>

        {error ? (
          <p className="m-0 text-sm text-wz-error" role="alert">
            {error}
          </p>
        ) : null}
      </div>
    </Modal>
  );
}

/** Figma "View Role Permissions" overlay; the eye button lists who holds the role. */
export function RoleViewModal({ role, onClose }: { role: RoleOption | null; onClose: () => void }) {
  const [showMembers, setShowMembers] = useState(false);
  if (!role) return null;
  const permissions = role.permissions || [];
  const members = role.members || [];
  return (
    <Modal open title="View Role Permissions" onClose={onClose}>
      <div className="flex flex-col gap-wz-6">
        <div className="flex flex-col gap-wz-4">
          <div className="flex items-center justify-between gap-wz-3 max-md:items-start">
            {/* Web: name and description on one line; mobile sheet stacks them. */}
            <div className="flex min-w-0 flex-wrap items-baseline gap-1.5 max-md:flex-col max-md:items-start max-md:gap-1">
              <span className="text-sm font-semibold text-wz-heading">{roleLabel(role)}</span>
              {role.description ? (
                <span className="text-[11px] text-wz-text-muted">{role.description}</span>
              ) : null}
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <Badge status="blue" size="sm">
                {permissions.length} Permissions
              </Badge>
              <button
                type="button"
                className="inline-flex size-6 cursor-pointer items-center justify-center rounded-wz-sm border-0 bg-transparent p-0 text-wz-primary hover:bg-wz-hover"
                aria-label={showMembers ? "Hide members" : "Show members"}
                aria-expanded={showMembers}
                onClick={() => setShowMembers((v) => !v)}
              >
                {showMembers ? <X size={14} /> : <Eye size={14} />}
              </button>
            </div>
          </div>
          {showMembers ? (
            <div className="rounded-wz-md bg-wz-neutral-50 px-wz-4 py-wz-3">
              {members.length ? (
                <ul className="m-0 grid list-none grid-cols-2 gap-x-wz-4 gap-y-3 p-0">
                  {members.map((m) => (
                    <li key={m._id} className="text-[13px] text-wz-text-secondary">
                      {m.name}
                      {m.employeeCode ? ` (${m.employeeCode})` : ""}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="m-0 text-[13px] text-wz-text-muted">No one has this role yet.</p>
              )}
            </div>
          ) : null}
        </div>
        <PermissionEditor selected={elevatedOf(permissions)} readOnly />
      </div>
    </Modal>
  );
}
