import type { DepartmentPayload } from "../../services/departmentService";
import { PAYOUT_RULE_OPTIONS, STATE_OPTIONS } from "./departmentViewModel";

export const DEPARTMENT_BULK_HEADERS = [
  "Department Name",
  "Description",
  "State Name",
  "Payout Rule",
  "Latitude",
  "Longitude",
  "Geofence Radius (m)",
  "Allow Outside Geofence",
  "Shift Name",
] as const;

export type DepartmentBulkRow = {
  name: string;
  description: string;
  stateName: string;
  sitePayoutRule: string;
  latitude: string;
  longitude: string;
  geofenceRadiusMeters: string;
  allowOutsideGeofence: boolean;
  shiftName: string;
};

export type DepartmentBulkParseResult = {
  rows: DepartmentBulkRow[];
  errors: string[];
};

const splitCsvLine = (line: string): string[] => {
  const cells: string[] = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i += 1) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }
    if (ch === "," && !inQuotes) {
      cells.push(current.trim());
      current = "";
      continue;
    }
    current += ch;
  }
  cells.push(current.trim());
  return cells;
};

export const buildDepartmentBulkTemplateCsv = (): string => {
  const sample = [
    "Engineering",
    "Core product engineering",
    "Haryana",
    "Monthly",
    "",
    "",
    "",
    "yes",
    "General Shift",
  ];
  return [DEPARTMENT_BULK_HEADERS.join(","), sample.join(",")].join("\n");
};

export const parseDepartmentBulkCsv = (text: string): DepartmentBulkParseResult => {
  const lines = String(text || "")
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
  if (lines.length < 2) {
    return { rows: [], errors: ["CSV must include a header row and at least one data row."] };
  }

  const header = splitCsvLine(lines[0] || "").map((h) => h.toLowerCase());
  const idx = (label: string) =>
    header.findIndex((h) => h === label.toLowerCase());

  const nameIdx = idx("Department Name");
  if (nameIdx < 0) {
    return {
      rows: [],
      errors: ['Missing required column "Department Name".'],
    };
  }

  const descIdx = idx("Description");
  const stateIdx = idx("State Name");
  const payoutIdx = idx("Payout Rule");
  const latIdx = idx("Latitude");
  const lngIdx = idx("Longitude");
  const radiusIdx = idx("Geofence Radius (m)");
  const allowIdx = idx("Allow Outside Geofence");
  const shiftIdx = idx("Shift Name");

  const rows: DepartmentBulkRow[] = [];
  const errors: string[] = [];

  lines.slice(1).forEach((line, i) => {
    const cells = splitCsvLine(line);
    const name = (cells[nameIdx] || "").trim();
    if (!name) {
      errors.push(`Row ${i + 2}: Department Name is required.`);
      return;
    }
    const stateName = stateIdx >= 0 ? (cells[stateIdx] || "").trim() : "";
    if (
      stateName &&
      !(STATE_OPTIONS as readonly string[]).includes(stateName)
    ) {
      errors.push(`Row ${i + 2}: Unknown State Name "${stateName}".`);
    }
    const sitePayoutRule =
      payoutIdx >= 0 ? (cells[payoutIdx] || "").trim() : "";
    if (
      sitePayoutRule &&
      !(PAYOUT_RULE_OPTIONS as readonly string[]).includes(sitePayoutRule)
    ) {
      errors.push(`Row ${i + 2}: Payout Rule must be Daily or Monthly.`);
    }
    const allowRaw =
      allowIdx >= 0 ? (cells[allowIdx] || "").trim().toLowerCase() : "yes";
    rows.push({
      name,
      description: descIdx >= 0 ? (cells[descIdx] || "").trim() : "",
      stateName,
      sitePayoutRule,
      latitude: latIdx >= 0 ? (cells[latIdx] || "").trim() : "",
      longitude: lngIdx >= 0 ? (cells[lngIdx] || "").trim() : "",
      geofenceRadiusMeters:
        radiusIdx >= 0 ? (cells[radiusIdx] || "").trim() : "",
      allowOutsideGeofence: !(
        allowRaw === "no" ||
        allowRaw === "false" ||
        allowRaw === "0"
      ),
      shiftName: shiftIdx >= 0 ? (cells[shiftIdx] || "").trim() : "",
    });
  });

  return { rows, errors };
};

export const toBulkPayload = (
  row: DepartmentBulkRow,
  vendorId: string,
  shiftId: string | null,
): DepartmentPayload => {
  const toNum = (v: string): number | null => {
    if (!v) return null;
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
  };
  return {
    vendorId,
    name: row.name,
    description: row.description || undefined,
    shift: shiftId,
    otPolicy: null,
    departmentHead: null,
    sitePayoutRule: row.sitePayoutRule || null,
    stateName: row.stateName || null,
    latitude: toNum(row.latitude),
    longitude: toNum(row.longitude),
    geofenceRadiusMeters: toNum(row.geofenceRadiusMeters),
    allowOutsideGeofence: row.allowOutsideGeofence,
  };
};

export const resolveShiftId = (
  shiftName: string,
  shifts: Array<{ _id: string; name?: string; shiftName?: string }>,
): string | null => {
  const needle = shiftName.trim().toLowerCase();
  if (!needle) return null;
  const match = shifts.find((s) => {
    const label = (s.name || s.shiftName || "").trim().toLowerCase();
    return label === needle;
  });
  return match?._id || null;
};

export const flattenOrgDesignations = (
  departments: Array<{
    linkedDesignations?: Array<{ name: string; employeeCount: number }>;
  }>,
): Array<{ name: string; employeeCount: number; departmentCount: number }> => {
  const byName = new Map<
    string,
    { name: string; employeeCount: number; departmentCount: number }
  >();
  for (const dep of departments) {
    for (const item of dep.linkedDesignations || []) {
      const name = String(item?.name || "").trim();
      if (!name) continue;
      const current = byName.get(name) || {
        name,
        employeeCount: 0,
        departmentCount: 0,
      };
      current.employeeCount += Number(item.employeeCount) || 0;
      current.departmentCount += 1;
      byName.set(name, current);
    }
  }
  return [...byName.values()].sort((a, b) => a.name.localeCompare(b.name));
};

export const employeeCountLabel = (count: number): string =>
  `${count} ${count === 1 ? "EMPLOYEE" : "EMPLOYEES"}`;
