import { describe, expect, it } from "vitest";
import {
  buildDepartmentCsv,
  departmentToForm,
  filterDepartments,
  headDisplay,
  sanitizeGeoValue,
} from "./departmentViewModel";
import type { Department } from "../../services/departmentService";

const sample: Department = {
  _id: "d1",
  name: "IT",
  description: "Ops",
  stateName: "Haryana",
  sitePayoutRule: "Monthly",
  departmentUniqueId: "DEP-1",
  shift: { _id: "s1", name: "General Shift" },
  otPolicy: null,
  departmentHead: {
    _id: "e1",
    name: "Raghav Kumar",
    employeeCode: "EMP-0016",
  },
  latitude: 28.6,
  longitude: 77.2,
  geofenceRadiusMeters: 200,
};

describe("departmentViewModel", () => {
  it("maps department to form values", () => {
    const form = departmentToForm(sample);
    expect(form.name).toBe("IT");
    expect(form.shift).toBe("s1");
    expect(form.departmentHead).toBe("e1");
    expect(form.latitude).toBe("28.6");
    expect(form.allowOutsideGeofence).toBe(true);
  });

  it("filters by search across name and head", () => {
    const rows = filterDepartments([sample], "raghav");
    expect(rows).toHaveLength(1);
    expect(filterDepartments([sample], "xyz")).toHaveLength(0);
  });

  it("builds head display with initials and code", () => {
    expect(headDisplay(sample.departmentHead)).toEqual({
      name: "Raghav Kumar",
      code: "EMP-0016",
      initials: "RK",
    });
  });

  it("sanitizes geo inputs", () => {
    expect(sanitizeGeoValue("latitude", "12.3abc-4")).toBe("12.34");
    expect(sanitizeGeoValue("latitude", "-12.5.6")).toBe("-12.56");
    expect(sanitizeGeoValue("geofenceRadiusMeters", "-12.5")).toBe("12.5");
  });

  it("builds csv with header", () => {
    const csv = buildDepartmentCsv([sample]);
    expect(csv.split("\n")[0]).toContain("Department Name");
    expect(csv).toContain("IT");
    expect(csv).toContain("Raghav Kumar");
  });
});
