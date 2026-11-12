import type {
  Department,
  DepartmentRef,
  OtPolicyOption,
  ShiftOption,
} from "../../services/departmentService";

export const STATE_OPTIONS = [
  "Andhra Pradesh",
  "Delhi",
  "Gujarat",
  "Haryana",
  "Karnataka",
  "Madhya Pradesh",
  "Maharashtra",
  "Punjab",
  "Rajasthan",
  "Tamil Nadu",
  "Telangana",
  "Uttar Pradesh",
  "West Bengal",
] as const;

export const PAYOUT_RULE_OPTIONS = ["Daily", "Monthly"] as const;

export type DepartmentTab = "departments" | "designations" | "location";

export type DepartmentFormValues = {
  name: string;
  description: string;
  shift: string;
  otPolicy: string;
  departmentHead: string;
  sitePayoutRule: string;
  stateName: string;
  latitude: string;
  longitude: string;
  geofenceRadiusMeters: string;
  allowOutsideGeofence: boolean;
};

export const emptyDepartmentForm = (): DepartmentFormValues => ({
  name: "",
  description: "",
  shift: "",
  otPolicy: "",
  departmentHead: "",
  sitePayoutRule: "",
  stateName: "",
  latitude: "",
  longitude: "",
  geofenceRadiusMeters: "",
  allowOutsideGeofence: true,
});

const refId = (value?: string | DepartmentRef | null): string => {
  if (!value) return "";
  if (typeof value === "string") return value;
  return value._id || "";
};

const refName = (value?: string | DepartmentRef | null): string => {
  if (!value || typeof value === "string") return "";
  return value.name || value.shiftName || value.policyName || "";
};

export const departmentToForm = (dep: Department): DepartmentFormValues => ({
  name: dep.name || "",
  description: dep.description || "",
  shift: refId(dep.shift),
  otPolicy: refId(dep.otPolicy),
  departmentHead: refId(dep.departmentHead),
  sitePayoutRule: dep.sitePayoutRule || "",
  stateName: dep.stateName || "",
  latitude:
    dep.latitude == null || Number.isNaN(Number(dep.latitude))
      ? ""
      : String(dep.latitude),
  longitude:
    dep.longitude == null || Number.isNaN(Number(dep.longitude))
      ? ""
      : String(dep.longitude),
  geofenceRadiusMeters:
    dep.geofenceRadiusMeters == null ||
    Number.isNaN(Number(dep.geofenceRadiusMeters))
      ? ""
      : String(dep.geofenceRadiusMeters),
  allowOutsideGeofence: dep.allowOutsideGeofence !== false,
});

export const shiftLabel = (
  value?: string | DepartmentRef | null,
  options: ShiftOption[] = [],
): string => {
  const fromRef = refName(value);
  if (fromRef) return fromRef;
  const id = refId(value);
  const match = options.find((s) => s._id === id);
  return match?.name || match?.shiftName || "—";
};

export const otPolicyLabel = (
  value?: string | DepartmentRef | null,
  options: OtPolicyOption[] = [],
): string => {
  const fromRef = refName(value);
  if (fromRef) return fromRef;
  const id = refId(value);
  const match = options.find((p) => p._id === id);
  return match?.policyName || match?.name || "—";
};

export const headDisplay = (
  value?: string | DepartmentRef | null,
): { name: string; code: string; initials: string } => {
  if (!value || typeof value === "string") {
    return { name: "—", code: "", initials: "?" };
  }
  const name = value.name || "—";
  const initials = name
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  return {
    name,
    code: value.employeeCode || "",
    initials: initials || "?",
  };
};

export const filterDepartments = (
  rows: Department[],
  search: string,
): Department[] => {
  const q = search.trim().toLowerCase();
  if (!q) return rows;
  return rows.filter((dep) => {
    const head =
      dep.departmentHead && typeof dep.departmentHead === "object"
        ? dep.departmentHead.name || ""
        : "";
    return [
      dep.name,
      dep.description,
      dep.stateName,
      dep.sitePayoutRule,
      dep.departmentUniqueId,
      head,
      shiftLabel(dep.shift),
      otPolicyLabel(dep.otPolicy),
    ]
      .join(" ")
      .toLowerCase()
      .includes(q);
  });
};

export const departmentsWithGeofence = (rows: Department[]): Department[] =>
  rows.filter(
    (d) =>
      d.latitude != null &&
      d.longitude != null &&
      d.geofenceRadiusMeters != null,
  );

export const toNullableNumber = (
  value: string | number | null | undefined,
): number | null => {
  if (value === "" || value === null || value === undefined) return null;
  const num = Number(value);
  return Number.isFinite(num) ? num : null;
};

export const buildDepartmentCsv = (rows: Department[]): string => {
  const header = [
    "Department Name",
    "Department ID",
    "Description",
    "Default Shift",
    "Overtime Rule",
    "State Name",
    "Payout Rule",
    "Department Head",
    "Latitude",
    "Longitude",
    "Geofence Radius (m)",
  ];
  const escape = (value: string) => {
    if (/[",\n]/.test(value)) return `"${value.replace(/"/g, '""')}"`;
    return value;
  };
  const lines = rows.map((dep) => {
    const head = headDisplay(dep.departmentHead);
    return [
      dep.name || "",
      dep.departmentUniqueId || dep._id || "",
      dep.description || "",
      shiftLabel(dep.shift),
      otPolicyLabel(dep.otPolicy),
      dep.stateName || "",
      dep.sitePayoutRule || "",
      head.name === "—" ? "" : head.name,
      dep.latitude == null ? "" : String(dep.latitude),
      dep.longitude == null ? "" : String(dep.longitude),
      dep.geofenceRadiusMeters == null
        ? ""
        : String(dep.geofenceRadiusMeters),
    ]
      .map((v) => escape(String(v)))
      .join(",");
  });
  return [header.join(","), ...lines].join("\n");
};

export const pageWindowLabel = (
  page: number,
  limit: number,
  total: number,
): string => {
  if (total <= 0) return "Showing 0 of 0 departments";
  const start = (page - 1) * limit + 1;
  const end = Math.min(page * limit, total);
  return `Showing ${start}–${end} of ${total} departments`;
};

export const sanitizeGeoValue = (name: string, value: string): string => {
  const str = String(value ?? "");
  if (name === "geofenceRadiusMeters") {
    let v = str.replace(/[^0-9.]/g, "");
    const dot = v.indexOf(".");
    if (dot !== -1) v = v.slice(0, dot + 1) + v.slice(dot + 1).replace(/\./g, "");
    return v;
  }
  let v = str.replace(/[^0-9.-]/g, "");
  const negative = v.startsWith("-");
  v = v.replace(/-/g, "");
  const dot = v.indexOf(".");
  if (dot !== -1) v = v.slice(0, dot + 1) + v.slice(dot + 1).replace(/\./g, "");
  return (negative ? "-" : "") + v;
};
