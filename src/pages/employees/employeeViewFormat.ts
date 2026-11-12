/** Display helpers for the Figma View Employee overview. */

export const displayValue = (value: unknown, fallback = "-"): string => {
  if (value === undefined || value === null) return fallback;
  const str = String(value).trim();
  return str || fallback;
};

export const formatDateIso = (value: unknown): string => {
  if (value === undefined || value === null || value === "") return "—";
  const str = String(value);
  if (/^\d{4}-\d{2}-\d{2}/.test(str)) return str.slice(0, 10);
  const d = new Date(str);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toISOString().slice(0, 10);
};

/** Figma family DOB style: DD-MM-YYYY */
export const formatDateDisplay = (value: unknown): string => {
  const iso = formatDateIso(value);
  if (iso === "—") return iso;
  const [y, m, d] = iso.split("-");
  if (!y || !m || !d) return iso;
  return `${d}-${m}-${y}`;
};

export const maskAadhaar = (value: unknown): string => {
  const digits = String(value || "").replace(/\D/g, "");
  if (!digits) return "—";
  if (digits.length < 4) return digits;
  return `XXXX-XXXX-${digits.slice(-4)}`;
};

export const maskAccountNumber = (value: unknown): string => {
  const digits = String(value || "").replace(/\s/g, "");
  if (!digits) return "—";
  if (digits.length <= 4) return `•••• ${digits}`;
  return `•••• ${digits.slice(-4)}`;
};

export const managerDisplayName = (
  manager:
    | { name?: string; designation?: string; employeeCode?: string }
    | string
    | null
    | undefined,
): string => {
  if (!manager) return "—";
  if (typeof manager === "string") return displayValue(manager);
  const name = displayValue(manager.name, "");
  if (!name) return "—";
  if (manager.designation) return `${name} (${manager.designation})`;
  return name;
};

export const coverageLabel = (coverage: unknown): string => {
  const raw = String(coverage || "").toUpperCase();
  if (raw === "ESIC") return "ESIC";
  if (raw === "MEDICAL") return "Medical Insurance";
  if (raw === "BOTH") return "Both (ESIC & Medical)";
  return displayValue(coverage);
};

export const initialsFromName = (name: unknown): string => {
  const parts = String(name || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return `${parts[0]![0] || ""}${parts[1]![0] || ""}`.toUpperCase();
};
