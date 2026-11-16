import { describe, expect, it } from "vitest";
import { createEmptyInternForm } from "./internForm";
import { MIN_INTERN_AGE, validateInternForm } from "./internValidation";

const future = (daysFromNow: number): string => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + daysFromNow);
  return d.toISOString().slice(0, 10);
};

const maxInternDob = (): string => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setFullYear(d.getFullYear() - MIN_INTERN_AGE);
  return d.toISOString().slice(0, 10);
};

describe("validateInternForm", () => {
  it("requires name, department, and internship dates", () => {
    const { valid, errors } = validateInternForm(createEmptyInternForm());
    expect(valid).toBe(false);
    expect(errors.name).toBeTruthy();
    expect(errors.departmentId).toBeTruthy();
    expect(errors.internshipStartDate).toBeTruthy();
    expect(errors.internshipEndDate).toBeTruthy();
  });

  it("rejects DOB for interns younger than minimum age", () => {
    const tooYoung = future(-(MIN_INTERN_AGE * 365 - 30));
    const { errors } = validateInternForm(
      createEmptyInternForm({
        name: "Riya Sharma",
        departmentId: "dept-1",
        internshipStartDate: future(1),
        internshipEndDate: future(90),
        dob: tooYoung,
      }),
    );
    expect(errors.dob).toMatch(/at least/);
  });

  it("accepts DOB at minimum age boundary", () => {
    const { valid, errors } = validateInternForm(
      createEmptyInternForm({
        name: "Riya Sharma",
        departmentId: "dept-1",
        internshipStartDate: future(1),
        internshipEndDate: future(90),
        dob: maxInternDob(),
      }),
    );
    expect(errors.dob).toBeUndefined();
    expect(valid).toBe(true);
  });

  it("requires end date after start date", () => {
    const start = future(10);
    const { errors } = validateInternForm(
      createEmptyInternForm({
        name: "Riya Sharma",
        departmentId: "dept-1",
        internshipStartDate: start,
        internshipEndDate: start,
      }),
    );
    expect(errors.internshipEndDate).toMatch(/after the start date/);
  });

  it("rejects mentor and reporting manager being the same", () => {
    const { errors } = validateInternForm(
      createEmptyInternForm({
        name: "Riya Sharma",
        departmentId: "dept-1",
        internshipStartDate: future(1),
        internshipEndDate: future(90),
        mentorId: "emp-42",
        reportingManagerId: "emp-42",
      }),
    );
    expect(errors.reportingManagerId).toMatch(/must be different/);
  });

  it("validates phone pattern when provided", () => {
    const { errors } = validateInternForm(
      createEmptyInternForm({
        name: "Riya Sharma",
        departmentId: "dept-1",
        internshipStartDate: future(1),
        internshipEndDate: future(90),
        phone: "12345",
      }),
    );
    expect(errors.phone).toMatch(/10 digits/);
  });
});