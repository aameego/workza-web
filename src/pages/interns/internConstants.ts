import type { InternStatus } from "../../services/internTypes";

export const NEXT_STATUS: Record<InternStatus, InternStatus[]> = {
  active: ["completed", "terminated", "on-hold"],
  "on-hold": ["active", "terminated"],
  completed: [],
  terminated: [],
  converted: [],
};

export const INTERN_STATUS_FILTER_OPTIONS = [
  { value: "", label: "All Interns" },
  { value: "active", label: "Active Interns" },
  { value: "on-hold", label: "On-Hold Interns" },
  { value: "completed", label: "Completed Interns" },
  { value: "converted", label: "Converted Interns" },
  { value: "terminated", label: "Terminated Interns" },
  { value: "expiring-soon", label: "Ending Soon (30 days)" },
  { value: "deleted", label: "Archived Interns" },
] as const;

/** Backend documentType values for intern checklist / uploads (CRA InternsTab). */
export const INTERN_DOC_TYPES = [
  "INTERNSHIP_OFFER_LETTER",
  "INTERNSHIP_AGREEMENT",
  "UNIVERSITY_NOC",
  "INTERNSHIP_COMPLETION_CERTIFICATE",
  "INTERNSHIP_EVALUATION_REPORT",
  "STIPEND_RECEIPT",
  "CONVERSION_OFFER_LETTER",
  "PHOTO",
  "AADHAAR",
  "PAN",
  "EDUCATION",
  "BANK",
] as const;

export type InternDocType = (typeof INTERN_DOC_TYPES)[number];

export const STIPEND_FREQUENCY_OPTIONS = [
  { value: "monthly", label: "Monthly" },
  { value: "weekly", label: "Weekly" },
  { value: "daily", label: "Daily" },
  { value: "lump-sum", label: "Lump sum" },
] as const;