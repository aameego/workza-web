import { describe, expect, it } from "vitest";
import {
  buildEmployeePayload,
  createEmptyEmployeeForm,
  employeeDetailToForm,
} from "./employeeForm";
import { collectEmployeeFormErrors } from "./employeeValidation";
import type { EmployeeDetail } from "../../services/employeeTypes";

describe("createEmptyEmployeeForm", () => {
  it("defaults consultancy and app login off", () => {
    const form = createEmptyEmployeeForm();
    expect(form.isConsultancy).toBe(false);
    expect(form.createAppLogin).toBe(false);
    expect(form.payType).toBe("MONTHLY");
    expect(form.familyMembers).toEqual([]);
  });

  it("applies consultancy override from list deep-link", () => {
    const form = createEmptyEmployeeForm({ isConsultancy: true });
    expect(form.isConsultancy).toBe(true);
  });
});

describe("collectEmployeeFormErrors", () => {
  it("requires name, department, designation, and date of joining", () => {
    const errors = collectEmployeeFormErrors(createEmptyEmployeeForm());
    expect(errors.name).toBeTruthy();
    expect(errors.departmentId).toBeTruthy();
    expect(errors.designation).toBeTruthy();
    expect(errors.dateOfJoining).toBeTruthy();
  });

  it("passes a minimal valid employee", () => {
    const errors = collectEmployeeFormErrors(
      createEmptyEmployeeForm({
        name: "Priya Sharma",
        departmentId: "dept1",
        designation: "Engineer",
        dateOfJoining: "2024-01-15",
      }),
    );
    expect(errors).toEqual({});
  });

  it("requires email or phone when creating app login", () => {
    const errors = collectEmployeeFormErrors(
      createEmptyEmployeeForm({
        name: "Priya Sharma",
        departmentId: "dept1",
        designation: "Engineer",
        dateOfJoining: "2024-01-15",
        createAppLogin: true,
      }),
    );
    expect(errors.email).toMatch(/email or phone/i);
  });
});

describe("buildEmployeePayload", () => {
  it("sends null managers and omits blank optionals", () => {
    const payload = buildEmployeePayload(
      createEmptyEmployeeForm({
        name: "Priya Sharma",
        departmentId: "dept1",
        designation: "Engineer",
        dateOfJoining: "2024-01-15",
        email: "  Priya@Workza.COM ",
      }),
    );
    expect(payload.name).toBe("Priya Sharma");
    expect(payload.email).toBe("priya@workza.com");
    expect(payload.managerId).toBeNull();
    expect(payload.peopleManagerId).toBeNull();
    expect(payload).not.toHaveProperty("phone");
    expect(payload.createAppLogin).toBeUndefined();
  });

  it("includes app login fields when enabled", () => {
    const payload = buildEmployeePayload(
      createEmptyEmployeeForm({
        name: "Priya Sharma",
        departmentId: "dept1",
        designation: "Engineer",
        dateOfJoining: "2024-01-15",
        email: "priya@workza.com",
        createAppLogin: true,
        userRole: "Manager",
        userPassword: "secret12",
      }),
      { createAppLogin: true },
    );
    expect(payload.createAppLogin).toBe(true);
    expect(payload.userRole).toBe("Manager");
    expect(payload.userPassword).toBe("secret12");
  });

  it("coerces consultancy pay numbers", () => {
    const payload = buildEmployeePayload(
      createEmptyEmployeeForm({
        name: "Consultant",
        departmentId: "dept1",
        designation: "Advisor",
        dateOfJoining: "2024-01-15",
        isConsultancy: true,
        monthlyConsultancyPay: "50000",
        tdsPercent: "10",
      }),
    );
    expect(payload.isConsultancy).toBe(true);
    expect(payload.monthlyConsultancyPay).toBe(50000);
    expect(payload.tdsPercent).toBe(10);
  });

  it("syncs role without createAppLogin when hasAppLogin", () => {
    const payload = buildEmployeePayload(
      createEmptyEmployeeForm({
        name: "Priya Sharma",
        departmentId: "dept1",
        designation: "Engineer",
        dateOfJoining: "2024-01-15",
        createAppLogin: true,
        userRole: "HR",
        userPassword: "  resetme  ",
      }),
      { hasAppLogin: true },
    );
    expect(payload.createAppLogin).toBeUndefined();
    expect(payload.userRole).toBe("HR");
    expect(payload.userPassword).toBe("resetme");
  });
});

describe("employeeDetailToForm", () => {
  it("normalizes nested refs, dates, and family members", () => {
    const emp = {
      _id: "e1",
      employeeCode: "EMP-0142",
      name: "Priya Sharma",
      email: "priya@workza.com",
      departmentId: "dept1",
      managerId: { _id: "m1", name: "Boss" },
      peopleManagerId: { _id: "pm1", name: "PM" },
      dob: "1990-05-01T00:00:00.000Z",
      dateOfJoining: "2024-01-15T12:00:00.000Z",
      probationEndDate: "2024-07-15T00:00:00.000Z",
      fatherName: "Ramesh",
      address: "Legacy address",
      clientName: "Acme",
      hasAppLogin: true,
      linkedUser: { role: "Manager" },
      familyMembers: [
        {
          name: "Asha",
          relation: "Spouse",
          dob: "1992-02-02T00:00:00.000Z",
          coverage: "ESIC",
        },
      ],
      isConsultancy: false,
      payType: "MONTHLY",
    } as EmployeeDetail;

    const form = employeeDetailToForm(emp);
    expect(form.employeeCode).toBe("EMP-0142");
    expect(form.managerId).toBe("m1");
    expect(form.peopleManagerId).toBe("pm1");
    expect(form.dob).toBe("1990-05-01");
    expect(form.dateOfJoining).toBe("2024-01-15");
    expect(form.probationEndDate).toBe("2024-07-15");
    expect(form.fatherHusbandName).toBe("Ramesh");
    expect(form.permanentAddress).toBe("Legacy address");
    expect(form.client).toBe("Acme");
    expect(form.createAppLogin).toBe(true);
    expect(form.userRole).toBe("Manager");
    expect(form.familyMembers).toEqual([
      {
        name: "Asha",
        relation: "Spouse",
        dob: "1992-02-02",
        coverage: "ESIC",
      },
    ]);
  });
});
