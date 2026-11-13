import type { ReactNode } from "react";
import { Avatar, Modal } from "../../design-system";
import type { Department } from "../../services/departmentService";
import { employeeCountLabel } from "./departmentBulk";
import {
  headDisplay,
  otPolicyLabel,
  shiftLabel,
} from "./departmentViewModel";

export type DepartmentViewModalProps = {
  open: boolean;
  department: Department | null;
  onClose: () => void;
};

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-[10px] font-semibold tracking-[0.04em] text-wz-text-muted uppercase">
        {label}
      </span>
      <span className="text-sm font-semibold text-wz-heading">
        {value || "—"}
      </span>
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="border-b border-wz-border pb-wz-5 last:border-b-0 last:pb-0">
      <h3 className="m-0 mb-wz-4 text-sm font-bold text-wz-heading">{title}</h3>
      {children}
    </section>
  );
}

export default function DepartmentViewModal({
  open,
  department,
  onClose,
}: DepartmentViewModalProps) {
  if (!department) {
    return (
      <Modal open={open} title="Department" onClose={onClose} size="md">
        <p className="m-0 text-sm text-wz-text-muted">Department not found.</p>
      </Modal>
    );
  }

  const head = headDisplay(department.departmentHead);
  const dash = (v?: string | number | null) =>
    v === null || v === undefined || v === "" ? "—" : String(v);
  const linked = department.linkedDesignations || [];

  return (
    <Modal
      open={open}
      title={`Department – ${department.name || "—"}`}
      onClose={onClose}
      size="md"
    >
      <div className="flex flex-col gap-wz-5">
        <Section title="Primary Details">
          <div className="grid grid-cols-1 gap-wz-4 sm:grid-cols-2">
            <DetailRow
              label="Payout Rule"
              value={dash(department.sitePayoutRule)}
            />
            <DetailRow label="State Name" value={dash(department.stateName)} />
            <div className="sm:col-span-2">
              <DetailRow
                label="Description"
                value={dash(department.description)}
              />
            </div>
          </div>
        </Section>

        <Section title="Attendance Geofence">
          <div className="grid grid-cols-1 gap-wz-4 sm:grid-cols-3">
            <DetailRow label="Latitude" value={dash(department.latitude)} />
            <DetailRow label="Longitude" value={dash(department.longitude)} />
            <DetailRow
              label="Geofence Radius (Meters)"
              value={dash(department.geofenceRadiusMeters)}
            />
          </div>
        </Section>

        <Section title="Operational Rules & Leadership">
          <div className="grid grid-cols-1 gap-wz-4 sm:grid-cols-2">
            <DetailRow
              label="Assigned Operational Shift"
              value={shiftLabel(department.shift)}
            />
            <DetailRow
              label="Overtime Policy Rule"
              value={otPolicyLabel(department.otPolicy)}
            />
            <div className="sm:col-span-2 flex flex-col gap-1">
              <span className="text-[10px] font-semibold tracking-[0.04em] text-wz-text-muted uppercase">
                Department Head / Manager
              </span>
              {head.name === "—" ? (
                <span className="text-sm font-semibold text-wz-heading">—</span>
              ) : (
                <div className="flex items-center gap-2.5">
                  <Avatar initials={head.initials} size="sm" />
                  <div className="min-w-0">
                    <div className="truncate text-sm font-semibold text-wz-heading">
                      {head.name}
                    </div>
                    {head.code ? (
                      <div className="text-xs text-wz-text-muted">
                        {head.code}
                      </div>
                    ) : null}
                  </div>
                </div>
              )}
            </div>
          </div>
        </Section>

        <Section title="Linked Designations">
          {linked.length === 0 ? (
            <p className="m-0 text-sm text-wz-text-muted">
              No designations linked yet.
            </p>
          ) : (
            <ul className="m-0 flex list-none flex-col gap-wz-3 p-0">
              {linked.map((item) => (
                <li
                  key={item.name}
                  className="flex items-center justify-between gap-3"
                >
                  <span className="text-sm font-semibold text-wz-heading">
                    {item.name}
                  </span>
                  <span className="text-[10px] font-semibold tracking-[0.04em] text-wz-text-muted uppercase">
                    {employeeCountLabel(item.employeeCount)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Section>
      </div>
    </Modal>
  );
}
