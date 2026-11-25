import { Eye, SquarePen } from "lucide-react";
import { cn } from "../../../design-system";
import type { RoleOption } from "../../../services/roleService";
import { formatCreatedAt, moduleCount, roleLabel } from "../rolePermissions";

type RowHandlers = {
  onView: (role: RoleOption) => void;
  onEdit: (role: RoleOption) => void;
};

type RolesTableProps = RowHandlers & { roles: RoleOption[] };

const rowKey = (role: RoleOption) => role._id || role.roleName;
const generationLabel = (role: RoleOption) => (role.isSystem ? "System" : "Custom");

/** View + Edit buttons; `compact` is the Figma mobile row action (borderless, 12px icons). */
function RowActions({ role, onView, onEdit, compact = false }: RowHandlers & { role: RoleOption; compact?: boolean }) {
  const label = roleLabel(role);
  const buttonClass = compact
    ? "inline-flex cursor-pointer items-center justify-center rounded-wz-md border-0 bg-transparent px-1 py-1.5 text-wz-heading hover:bg-wz-hover"
    : "inline-flex size-8 cursor-pointer items-center justify-center rounded-wz-sm border border-wz-border bg-white text-wz-heading hover:bg-wz-hover";
  const iconSize = compact ? 12 : 14;
  return (
    <div className={cn("flex items-center", compact ? "h-8" : "gap-1.5")}>
      <button type="button" className={buttonClass} aria-label={`View ${label}`} onClick={() => onView(role)}>
        <Eye size={iconSize} />
      </button>
      <button type="button" className={buttonClass} aria-label={`Edit ${label}`} onClick={() => onEdit(role)}>
        <SquarePen size={iconSize} />
      </button>
    </div>
  );
}

const thClass =
  "h-[54px] border-b border-wz-border bg-white px-4 text-left align-middle text-xs leading-[normal] font-semibold text-wz-heading";
const tdClass =
  "h-[60px] border-b border-wz-border px-4 py-0 align-middle text-xs leading-[normal] text-wz-heading";

const DESKTOP_COLUMNS = [
  "Role Name",
  "Description",
  "Modules",
  "Members Assigned",
  "Generation",
  "Created By (HR/Admin)",
  "Actions",
];

/** Web table (Figma 288:154023). */
export function RolesDesktopTable({ roles, onView, onEdit }: RolesTableProps) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[960px] border-collapse">
        <thead>
          <tr>
            {DESKTOP_COLUMNS.map((label) => (
              <th key={label} className={thClass}>
                {label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {roles.map((role) => {
            const stamp = formatCreatedAt(role.createdAt);
            return (
              <tr key={rowKey(role)} className="hover:bg-wz-hover/40">
                <td className={tdClass}>{roleLabel(role)}</td>
                <td className={cn(tdClass, "max-w-[240px]")}>
                  <span className="line-clamp-2">{role.description || "—"}</span>
                </td>
                <td className={tdClass}>{moduleCount(role.permissions || [])}</td>
                <td className={tdClass}>{role.memberCount ?? role.members?.length ?? 0}</td>
                <td className={tdClass}>{generationLabel(role)}</td>
                <td className={tdClass}>
                  <div>{role.createdByName || (role.isSystem ? "System" : "—")}</div>
                  {stamp ? <div className="mt-0.5 text-[11px] text-wz-text-muted">{stamp}</div> : null}
                </td>
                <td className={tdClass}>
                  <RowActions role={role} onView={onView} onEdit={onEdit} />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

const MOBILE_COLUMNS = ["Role Name", "Description", "Generation"];

/**
 * Mobile table (Figma 288:154266): three flexible columns plus actions,
 * 10px text, #f8f9fa header — no horizontal scroll at 402 wide.
 */
export function RolesMobileTable({ roles, onView, onEdit }: RolesTableProps) {
  return (
    <div role="table" aria-label="Roles">
      <div
        role="row"
        className="flex items-center gap-2 border-b border-[#e9ecef] bg-wz-neutral-50 px-4 py-3 text-[10px] leading-[normal] font-semibold text-wz-heading"
      >
        {MOBILE_COLUMNS.map((label) => (
          <span key={label} role="columnheader" className="min-w-0 flex-1">
            {label}
          </span>
        ))}
        <span role="columnheader" className="w-12 shrink-0 text-center">
          Actions
        </span>
      </div>
      {roles.map((role) => (
        <div
          key={rowKey(role)}
          role="row"
          className="flex items-center gap-2 border-b border-[#e9ecef] px-4 py-3.5 text-[10px] leading-[normal] text-wz-heading last:border-b-0"
        >
          <span role="cell" className="min-w-0 flex-1 break-words">
            {roleLabel(role)}
          </span>
          <span role="cell" className="min-w-0 flex-1 break-words">
            {role.description || "—"}
          </span>
          <span role="cell" className="min-w-0 flex-1">
            {generationLabel(role)}
          </span>
          <div role="cell" className="flex w-12 shrink-0 justify-center">
            <RowActions role={role} onView={onView} onEdit={onEdit} compact />
          </div>
        </div>
      ))}
    </div>
  );
}
