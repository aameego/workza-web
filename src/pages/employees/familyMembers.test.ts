import { describe, expect, it } from "vitest";
import {
  createEmptyFamilyMember,
  familyMembersToForm,
  toDateOnly,
  validateFamilyMembers,
} from "./familyMembers";

describe("toDateOnly", () => {
  it("normalizes ISO timestamps to YYYY-MM-DD", () => {
    expect(toDateOnly("1992-02-02T18:30:00.000Z")).toBe("1992-02-02");
    expect(toDateOnly("1992-02-02")).toBe("1992-02-02");
    expect(toDateOnly("")).toBe("");
    expect(toDateOnly(null)).toBe("");
  });
});

describe("familyMembersToForm", () => {
  it("maps API members and tolerates null/non-array", () => {
    expect(familyMembersToForm(null)).toEqual([]);
    expect(familyMembersToForm(undefined)).toEqual([]);
    expect(
      familyMembersToForm([
        {
          name: "Asha",
          relation: "Spouse",
          dob: "1992-02-02T00:00:00.000Z",
          coverage: "ESIC",
        },
      ]),
    ).toEqual([
      {
        name: "Asha",
        relation: "Spouse",
        dob: "1992-02-02",
        coverage: "ESIC",
      },
    ]);
  });
});

describe("validateFamilyMembers", () => {
  it("drops blank rows and accepts a valid member", () => {
    const { members, errors } = validateFamilyMembers(
      [
        createEmptyFamilyMember(),
        {
          name: "Asha",
          relation: "Spouse",
          dob: "1992-02-02",
          coverage: "ESIC",
        },
      ],
      { today: "2026-11-05" },
    );
    expect(errors).toEqual([]);
    expect(members).toHaveLength(1);
    expect(members[0].name).toBe("Asha");
  });

  it("rejects future DOB", () => {
    const { errors } = validateFamilyMembers(
      [
        {
          name: "Kid",
          relation: "Son",
          dob: "2099-01-01",
          coverage: "",
        },
      ],
      { today: "2026-11-05" },
    );
    expect(errors.some((e) => /future|dob|date/i.test(e.message))).toBe(true);
  });
});
