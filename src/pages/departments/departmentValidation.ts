import type { DepartmentFormValues } from "./departmentViewModel";

export type DepartmentFieldErrors = Partial<
  Record<keyof DepartmentFormValues | "form", string>
>;

const isSet = (v: string | boolean | null | undefined): boolean =>
  v !== "" && v !== null && v !== undefined;

const hasUnsafeMarkup = (value: string): boolean =>
  /[<>]|javascript:|on\w+\s*=|\{\{|\}\}/i.test(value);

/** Geofence is all-or-nothing: lat + lng + radius together, or all empty. */
export const validateGeofence = (
  values: Pick<
    DepartmentFormValues,
    "latitude" | "longitude" | "geofenceRadiusMeters"
  >,
): { errors: DepartmentFieldErrors; message: string } => {
  const errors: DepartmentFieldErrors = {};
  const anySet =
    isSet(values.latitude) ||
    isSet(values.longitude) ||
    isSet(values.geofenceRadiusMeters);
  if (!anySet) return { errors, message: "" };

  const lat = Number(values.latitude);
  const lng = Number(values.longitude);
  const rad = Number(values.geofenceRadiusMeters);

  if (!isSet(values.latitude) || !Number.isFinite(lat)) {
    errors.latitude = "Latitude is required when a geofence is set.";
  } else if (lat < -90 || lat > 90) {
    errors.latitude = "Latitude must be between -90 and 90.";
  }

  if (!isSet(values.longitude) || !Number.isFinite(lng)) {
    errors.longitude = "Longitude is required when a geofence is set.";
  } else if (lng < -180 || lng > 180) {
    errors.longitude = "Longitude must be between -180 and 180.";
  }

  if (!isSet(values.geofenceRadiusMeters) || !Number.isFinite(rad)) {
    errors.geofenceRadiusMeters =
      "Radius is required when a location is set.";
  } else if (rad <= 0) {
    errors.geofenceRadiusMeters =
      "Geofence radius must be greater than 0 meters.";
  } else if (rad > 100000) {
    errors.geofenceRadiusMeters = "Radius cannot exceed 100,000 meters.";
  }

  const missing: string[] = [];
  if (errors.latitude) missing.push("location");
  if (errors.geofenceRadiusMeters) missing.push("radius");
  const message = Object.keys(errors).length
    ? `Geofence incomplete: ${missing.join(" + ")} required together.`
    : "";
  return { errors, message };
};

export const validateDepartmentForm = (
  values: DepartmentFormValues,
): DepartmentFieldErrors => {
  const errors: DepartmentFieldErrors = {};
  const name = values.name.trim();

  if (!name) {
    errors.name = "Department Name is required.";
  } else if (name.length > 120) {
    errors.name = "Department Name must be at most 120 characters.";
  } else if (hasUnsafeMarkup(name)) {
    errors.name = "Department Name contains invalid characters.";
  }

  const description = values.description.trim();
  if (description) {
    if (description.length > 2000) {
      errors.description =
        "Department Description must be at most 2000 characters.";
    } else if (hasUnsafeMarkup(description)) {
      errors.description =
        "Department Description contains invalid characters.";
    }
  }

  if (!values.shift) {
    errors.shift = "Assigned Operational Shift is required.";
  }

  const { errors: geoErrors, message } = validateGeofence(values);
  Object.assign(errors, geoErrors);
  if (message) errors.form = message;

  return errors;
};

export const formHasErrors = (errors: DepartmentFieldErrors): boolean =>
  Object.keys(errors).length > 0;
