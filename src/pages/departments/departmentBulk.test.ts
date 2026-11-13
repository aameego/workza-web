import { describe, expect, it } from "vitest";
import {
  buildDepartmentBulkTemplateCsv,
  employeeCountLabel,
  flattenOrgDesignations,
  parseDepartmentBulkCsv,
  resolveShiftId,
  toBulkPayload,
} from "./departmentBulk";

describe("departmentBulk", () => {
  it("builds a template with required headers", () => {
    const csv = buildDepartmentBulkTemplateCsv();
    expect(csv).toContain("Department Name");
    expect(csv).toContain("Shift Name");
  });

  it("parses valid rows and flags bad payout", () => {
    const csv = [
      "Department Name,Description,State Name,Payout Rule,Latitude,Longitude,Geofence Radius (m),Allow Outside Geofence,Shift Name",
      "IT,Ops,Haryana,Weekly,,,,,General Shift",
      "HR,,,,,, ,yes,Afternoon Shift",
    ].join("\n");
    const result = parseDepartmentBulkCsv(csv);
    expect(result.rows).toHaveLength(2);
    expect(result.errors.some((e) => /Payout Rule/.test(e))).toBe(true);
    expect(result.rows[1]?.name).toBe("HR");
  });

  it("resolves shift by name and builds payload", () => {
    const shiftId = resolveShiftId("General Shift", [
      { _id: "s1", name: "General Shift" },
    ]);
    expect(shiftId).toBe("s1");
    const payload = toBulkPayload(
      {
        name: "IT",
        description: "",
        stateName: "Delhi",
        sitePayoutRule: "Monthly",
        latitude: "",
        longitude: "",
        geofenceRadiusMeters: "",
        allowOutsideGeofence: true,
        shiftName: "General Shift",
      },
      "v1",
      shiftId,
    );
    expect(payload.shift).toBe("s1");
    expect(payload.vendorId).toBe("v1");
  });

  it("flattens designations and formats employee labels", () => {
    expect(
      flattenOrgDesignations([
        {
          linkedDesignations: [
            { name: "Dev", employeeCount: 2 },
            { name: "QA", employeeCount: 1 },
          ],
        },
        { linkedDesignations: [{ name: "Dev", employeeCount: 1 }] },
      ]),
    ).toEqual([
      { name: "Dev", employeeCount: 3, departmentCount: 2 },
      { name: "QA", employeeCount: 1, departmentCount: 1 },
    ]);
    expect(employeeCountLabel(1)).toBe("1 EMPLOYEE");
    expect(employeeCountLabel(2)).toBe("2 EMPLOYEES");
  });
});
