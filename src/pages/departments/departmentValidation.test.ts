import { describe, expect, it } from "vitest";
import {
  formHasErrors,
  validateDepartmentForm,
  validateGeofence,
} from "./departmentValidation";
import { emptyDepartmentForm } from "./departmentViewModel";

describe("validateGeofence", () => {
  it("allows all empty", () => {
    const result = validateGeofence({
      latitude: "",
      longitude: "",
      geofenceRadiusMeters: "",
    });
    expect(result.errors).toEqual({});
    expect(result.message).toBe("");
  });

  it("requires all three when any is set", () => {
    const result = validateGeofence({
      latitude: "28.6",
      longitude: "",
      geofenceRadiusMeters: "",
    });
    expect(result.errors.longitude).toBeTruthy();
    expect(result.errors.geofenceRadiusMeters).toBeTruthy();
    expect(result.message).toMatch(/Geofence incomplete/);
  });

  it("rejects out-of-range latitude", () => {
    const result = validateGeofence({
      latitude: "99",
      longitude: "77",
      geofenceRadiusMeters: "100",
    });
    expect(result.errors.latitude).toMatch(/-90 and 90/);
  });
});

describe("validateDepartmentForm", () => {
  it("requires name and shift", () => {
    const errors = validateDepartmentForm(emptyDepartmentForm());
    expect(errors.name).toMatch(/required/i);
    expect(errors.shift).toMatch(/required/i);
    expect(formHasErrors(errors)).toBe(true);
  });

  it("accepts a valid minimal form", () => {
    const errors = validateDepartmentForm({
      ...emptyDepartmentForm(),
      name: "Engineering",
      shift: "shift-1",
    });
    expect(errors).toEqual({});
  });

  it("blocks unsafe markup in name", () => {
    const errors = validateDepartmentForm({
      ...emptyDepartmentForm(),
      name: "<script>x</script>",
      shift: "shift-1",
    });
    expect(errors.name).toMatch(/invalid/i);
  });
});
