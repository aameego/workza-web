import { useMemo, useState } from "react";
import { Plus, X } from "lucide-react";
import { Button, Card, FilterSelect, Pagination } from "../../../design-system";
import { useRoles } from "../../../hooks/useRoles";
import { readSessionUser } from "../../../layouts/sessionUser";
import type { RoleOption } from "../../../services/roleService";
import { filterRoles, type Generation } from "../rolePermissions";
import { RoleFormModal, RoleViewModal } from "./RoleModals";
import { RolesDesktopTable, RolesMobileTable } from "./RolesTable";

const PAGE_SIZE = 10;

export function RolesTab() {
  const user = readSessionUser();
  const canManage =
    user?.role === "Admin" || user?.role === "HR" || Boolean(user?.permissions?.includes("roles:manage"));
  const query = useRoles(canManage);

  const [generation, setGeneration] = useState<Generation>("all");
  const [createdOn, setCreatedOn] = useState("");
  const [page, setPage] = useState(1);
  const [form, setForm] = useState<{ open: boolean; role: RoleOption | null }>({ open: false, role: null });
  const [viewing, setViewing] = useState<RoleOption | null>(null);

  const rows = useMemo(
    () => filterRoles(query.data || [], generation, createdOn),
    [query.data, generation, createdOn],
  );
  const pages = Math.max(Math.ceil(rows.length / PAGE_SIZE), 1);
  const pageSafe = Math.min(page, pages);
  const pageRows = rows.slice((pageSafe - 1) * PAGE_SIZE, pageSafe * PAGE_SIZE);
  const summary = `Showing ${(pageSafe - 1) * PAGE_SIZE + 1}–${Math.min(pageSafe * PAGE_SIZE, rows.length)} of ${rows.length} roles`;

  const openEdit = (role: RoleOption) => setForm({ open: true, role });

  if (!canManage) {
    return (
      <Card className="w-full">
        <p className="m-0 text-sm text-wz-text-secondary">Only Administrators and HR can manage roles.</p>
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-wz-6 max-md:gap-4">
      {/* Figma Data/Filter Toolbar: web = filters left, Create Role right; mobile = Create Role under the filters */}
      <div className="flex flex-wrap items-center justify-between gap-wz-3 max-md:flex-col max-md:items-start max-md:gap-2.5">
        <div className="flex flex-wrap items-center gap-wz-3 max-md:gap-1.5">
          <FilterSelect
            aria-label="Generation"
            value={generation}
            onChange={(e) => {
              setGeneration(e.target.value as Generation);
              setPage(1);
            }}
          >
            <option value="all">Generation</option>
            <option value="system">System</option>
            <option value="custom">Custom</option>
          </FilterSelect>
          <div className="relative flex h-10 items-center gap-1.5 rounded-wz-md border border-wz-border bg-white px-3 text-[13px] text-wz-text-muted hover:border-wz-neutral-400">
            <span className="whitespace-nowrap">Created At</span>
            <input
              type="date"
              aria-label="Created At"
              className="min-w-0 border-0 bg-transparent p-0 text-[13px] text-wz-heading outline-none max-md:w-[110px]"
              value={createdOn}
              onChange={(e) => {
                setCreatedOn(e.target.value);
                setPage(1);
              }}
            />
            {createdOn ? (
              <button
                type="button"
                className="inline-flex cursor-pointer border-0 bg-transparent p-0 text-wz-text-muted"
                aria-label="Clear created date"
                onClick={() => setCreatedOn("")}
              >
                <X size={12} />
              </button>
            ) : null}
          </div>
        </div>
        <Button size="toolbar" onClick={() => setForm({ open: true, role: null })}>
          <Plus size={16} />
          Create Role
        </Button>
      </div>

      <div className="overflow-hidden rounded-wz-lg border border-wz-border bg-white">
        {query.isLoading ? (
          <div className="px-6 py-12 text-center text-sm text-wz-text-secondary">Loading roles…</div>
        ) : query.isError ? (
          <div className="px-6 py-12 text-center text-sm text-wz-error">Could not load roles.</div>
        ) : pageRows.length === 0 ? (
          <div className="px-6 py-12 text-center text-sm text-wz-text-secondary">No roles found.</div>
        ) : (
          <>
            {/* One layout per breakpoint, switched in CSS so nothing re-renders on resize. */}
            <div className="max-md:hidden">
              <RolesDesktopTable roles={pageRows} onView={setViewing} onEdit={openEdit} />
              <Pagination page={pageSafe} pages={pages} onPageChange={setPage} summary={summary} />
            </div>
            <div className="md:hidden">
              <RolesMobileTable roles={pageRows} onView={setViewing} onEdit={openEdit} />
              <Pagination page={pageSafe} pages={pages} onPageChange={setPage} summary={summary} variant="compact" />
            </div>
          </>
        )}
      </div>

      {form.open ? (
        // Keyed so each open starts from the chosen role's saved values.
        <RoleFormModal
          key={form.role?._id || "new"}
          open
          role={form.role}
          onClose={() => setForm({ open: false, role: null })}
        />
      ) : null}
      <RoleViewModal key={viewing?._id || "none"} role={viewing} onClose={() => setViewing(null)} />
    </div>
  );
}
