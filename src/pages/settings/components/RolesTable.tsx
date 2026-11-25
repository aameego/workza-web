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

/** Figma Action/Employee Row Actions: borderless 12px icons, 8 radius (web 6px padding, 8 apart). */
function RowActions({ role, onView, onEdit, compact = false }: RowHandlers & { role: RoleOption; compact?: boolean }) {
  const label = roleLabel(role);
  const buttonClass = cn(
    "inline-flex cursor-pointer items-center justify-center rounded-wz-md border-0 bg-transparent text-wz-heading hover:bg-wz-hover",
    compact ? "px-1 py-1.5" : "p-1.5",
  );
  return (
    <div className={cn("flex h-8 items-center justify-center", !compact && "gap-2")}>
      <button type="button" className={buttonClass} aria-label={`View ${label}`} onClick={() => onView(role)}>
        <Eye size={12} />
      </button>
      <button type="button" className={buttonClass} aria-label={`Edit ${label}`} onClick={() => onEdit(role)}>
        <SquarePen size={12} />
      </button>
    </div>
  );
}

/** Figma header: #f8f9fa, 16/12 padding, 12px semibold; rows 16/14 padding, #e9ecef rules. */
const thClass =
  "border-b border-wz-neutral-200 bg-wz-neutral-50 px-4 py-3 text-left align-middle text-xs leading-[normal] font-semibold text-wz-heading";
const tdClass =
  "border-b border-wz-neutral-200 px-4 py-3.5 align-middle text-xs leading-[normal] text-wz-heading [tr:last-child>&]:border-b-0";

/** Figma column widths: fixed 100px for short values, 80px centred actions, the rest share the space. */
const DESKTOP_COLUMNS: { label: string; width?: string; center?: boolean }[] = [
  { label: "Role Name" },
  { label: "Description" },
  { label: "Modules", width: "w-[100px]" },
  { label: "Members Assigned" },
  { label: "Generation", width: "w-[100px]" },
  { label: "Created By (HR/Admin)" },
  { label: "Actions", width: "w-[80px]", center: true },
];

/** Web table (Figma Data/Employee Table 288:154039). */
export function RolesDesktopTable({ roles, onView, onEdit }: RolesTableProps) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[960px] table-fixed border-collapse">
        <thead>
          <tr>
            {DESKTOP_COLUMNS.map((col) => (
              <th key={col.label} className={cn(thClass, col.width, col.center && "text-center")}>
                {col.label}
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
                <td className={tdClass}>{role.description || "—"}</td>
                <td className={tdClass}>{moduleCount(role.permissions || [])}</td>
                <td className={tdClass}>{role.memberCount ?? role.members?.length ?? 0}</td>
                <td className={tdClass}>{generationLabel(role)}</td>
                <td className={tdClass}>
                  <div className="flex flex-col gap-0.5">
                    <span>{role.createdByName || (role.isSystem ? "System" : "—")}</span>
                    {stamp ? <span className="text-[10px] text-wz-text-muted">{stamp}</span> : null}
                  </div>
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
        className="flex items-center gap-2 border-b border-wz-neutral-200 bg-wz-neutral-50 px-4 py-3 text-[10px] leading-[normal] font-semibold text-wz-heading"
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
          className="flex items-center gap-2 border-b border-wz-neutral-200 px-4 py-3.5 text-[10px] leading-[normal] text-wz-heading last:border-b-0"
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
