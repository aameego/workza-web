import { expect, it } from "vitest";
import { createEmptyEmployeeForm } from "./employeeForm";
import { collectEmployeeFormErrors } from "./employeeValidation";
import { createEmptyFamilyMember } from "./familyMembers";

const base = () => ({
  ...createEmptyEmployeeForm(),
  name: "Priya Sharma",
  designation: "Engineer",
  departmentId: "d1",
  dateOfJoining: "2026-01-01",
});

it("rejects letters in the emergency contact (EMP-FN-01)", () => {
  expect(collectEmployeeFormErrors({ ...base(), emergencyContact: "12ab" }).emergencyContact).toBeTruthy();
  expect(collectEmployeeFormErrors({ ...base(), emergencyContact: "9876543210" }).emergencyContact).toBeUndefined();
});

it("rejects a relieving date before joining (EMP-FN-02)", () => {
  expect(collectEmployeeFormErrors({ ...base(), relievingDate: "2025-12-31" }).relievingDate).toBeTruthy();
  expect(collectEmployeeFormErrors({ ...base(), relievingDate: "2026-06-30" }).relievingDate).toBeUndefined();
});

it("rejects a blank family member row instead of dropping it (EMP-FN-04)", () => {
  const errors = collectEmployeeFormErrors({ ...base(), familyMembers: [createEmptyFamilyMember()] });
  expect(Object.keys(errors).some((k) => k.startsWith("familyMembers"))).toBe(true);
});

it("rejects an unrealistic date of birth (EMP-FN-07)", () => {
  expect(collectEmployeeFormErrors({ ...base(), dob: "1900-01-01" }).dob).toBeTruthy();
});

it("explains the account number rule (EMP-FN-09)", () => {
  expect(collectEmployeeFormErrors({ ...base(), accountNumber: "12" }).accountNumber).toBe(
    "Account number must be 9 to 18 digits",
  );
});

it("rejects a probation end date before joining (EMP-FN-03)", () => {
  expect(collectEmployeeFormErrors({ ...base(), probationEndDate: "2025-01-01" }).probationEndDate).toBeTruthy();
});
