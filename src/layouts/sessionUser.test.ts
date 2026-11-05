import { describe, expect, it } from "vitest";
import { displayNameFor, initialsFor, roleLabelFor } from "./sessionUser";

describe("sessionUser helpers", () => {
  it("builds display name, role label, and initials", () => {
    expect(
      displayNameFor({ name: "Ankit Kumar", role: "HR" }),
    ).toBe("Ankit Kumar");
    expect(roleLabelFor({ role: "HR" })).toBe("HR Manager");
    expect(initialsFor("Ankit Kumar")).toBe("AK");
  });
});
