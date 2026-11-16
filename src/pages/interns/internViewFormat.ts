import type { BadgeStatus } from "../../design-system";
import type { InternListItem, InternStatus } from "../../services/internTypes";
import { formatDateDisplay } from "../employees/employeeViewFormat";
import { NEXT_STATUS } from "./internConstants";

export const internDeptName = (intern: Pick<InternListItem, "department">): string => {
  const dept = intern.department;
  if (!dept) return "—";
  if (typeof dept === "object") return dept.name || "—";
  return dept || "—";
};

export const internPersonName = (
  person: InternListItem["mentorId"] | InternListItem["reportingManagerId"],
): string => {
  if (!person) return "—";
  if (typeof person === "object") return person.name || "—";
  return String(person);
};

export const internStatusLabel = (status?: string | null): string => {
  if (!status) return "—";
  if (status === "on-hold") return "On Hold";
  if (status === "expiring-soon") return "Ending Soon";
  return status.charAt(0).toUpperCase() + status.slice(1).replace(/-/g, " ");
};

export const internStatusBadge = (status?: string | null): BadgeStatus => {
  switch (status) {
    case "active":
      return "success";
    case "on-hold":
      return "info";
    case "completed":
      return "neutral";
    case "converted":
      return "extra";
    case "terminated":
      return "error";
    default:
      return "warning";
  }
};

export const internAppLoginLabel = (intern: InternListItem): string => {
  if (!intern.hasAppLogin) return "No Login";
  return intern.hasLoginEnabled !== false ? "Enabled" : "Disabled";
};

export const internAppLoginBadge = (intern: InternListItem): BadgeStatus => {
  if (!intern.hasAppLogin) return "neutral";
  return intern.hasLoginEnabled !== false ? "success" : "warning";
};

export const formatInternStipend = (
  amount?: number | string | null,
  frequency?: string | null,
): string => {
  const n = Number(amount);
  if (!Number.isFinite(n) || n <= 0) return "Unpaid";
  return `₹${n.toLocaleString("en-IN")} (${frequency || "monthly"})`;
};

export const formatInternDate = (value?: string | null): string =>
  formatDateDisplay(value);

export const toDateInput = (value?: string | null): string => {
  if (!value) return "";
  const str = String(value);
  if (/^\d{4}-\d{2}-\d{2}/.test(str)) return str.slice(0, 10);
  const d = new Date(str);
  if (Number.isNaN(d.getTime())) return "";
  return d.toISOString().slice(0, 10);
};

export const addDaysInput = (value?: string | null, days = 1): string => {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
};

export const canChangeInternStatus = (status?: string | null): boolean => {
  const key = (status || "active") as InternStatus;
  return (NEXT_STATUS[key] || []).length > 0;
};

export const canExtendInternship = (intern: InternListItem): boolean =>
  !intern.isDeleted &&
  intern.internStatus !== "converted" &&
  intern.internStatus !== "terminated" &&
  Boolean(intern.internshipEndDate);

export const canConvertIntern = (intern: InternListItem): boolean =>
  !intern.isDeleted &&
  intern.internStatus !== "converted" &&
  (intern.internStatus === "active" ||
    intern.internStatus === "completed" ||
    intern.internStatus === "on-hold");

export const canEditInternRecord = (intern: InternListItem): boolean =>
  !intern.isDeleted && intern.internStatus !== "converted";