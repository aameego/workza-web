import { describe, expect, it } from "vitest";
import { createEmptyEmployeeForm } from "./employeeForm";
import { collectEmployeeFormErrors } from "./employeeValidation";

const base = () =>
  createEmptyEmployeeForm({
    name: "Priya Sharma",
    departmentId: "dept1",
    designation: "Engineer",
    dateOfJoining: "2024-01-15",
  });

describe("app login contact rules on edit vs create", () => {
  it("blocks create login without email and phone", () => {
    const errors = collectEmployeeFormErrors({
      ...base(),
      createAppLogin: true,
      email: "",
      phone: "",
    });
    expect(errors.email).toMatch(/email or phone/i);
  });

  it("allows create login with phone only", () => {
    const errors = collectEmployeeFormErrors({
      ...base(),
      createAppLogin: true,
      email: "",
      phone: "9876543210",
    });
    expect(errors.email).toBeUndefined();
  });

  it("allows edit of existing login without contact on the form", () => {
    const errors = collectEmployeeFormErrors(
      {
        ...base(),
        createAppLogin: true,
        email: "",
        phone: "",
        userRole: "Manager",
      },
      { hasExistingAppLogin: true },
    );
    expect(errors.email).toBeUndefined();
    expect(errors.phone).toBeUndefined();
  });

  it("still validates other required fields on edit with existing login", () => {
    const errors = collectEmployeeFormErrors(
      createEmptyEmployeeForm({
        createAppLogin: true,
        name: "",
        departmentId: "",
      }),
      { hasExistingAppLogin: true },
    );
    expect(errors.name).toBeTruthy();
    expect(errors.departmentId).toBeTruthy();
    expect(errors.email).toBeUndefined();
  });
});
