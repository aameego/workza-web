import { describe, expect, it } from "vitest";
import { visibleMenuSections } from "./employeeRowMenuSections";
import type { LetterAccess } from "./letterAccess";

const FULL: LetterAccess = {
  canView: true,
  canEdit: true,
  canIssue: true,
  canManageOffers: true,
  canIssueConsultancyAgreement: true,
};

const NONE: LetterAccess = {
  canView: false,
  canEdit: false,
  canIssue: false,
  canManageOffers: false,
  canIssueConsultancyAgreement: false,
};

describe("visibleMenuSections", () => {
  it("matches Figma accordion order for a managing HR on a probation employee", () => {
    expect(
      visibleMenuSections({
        directory: "employee",
        canManage: true,
        canManageProbation: true,
        letterAccess: FULL,
        employee: {
          _id: "1",
          employmentStatus: "probation",
          hasAppLogin: true,
        },
      }),
    ).toEqual([
      "general",
      "probation",
      "letters",
      "convert",
      "access",
      "danger",
    ]);
  });

  it("hides manage-only sections for viewers", () => {
    expect(
      visibleMenuSections({
        directory: "employee",
        canManage: false,
        canManageProbation: false,
        letterAccess: NONE,
        employee: { _id: "1", hasAppLogin: true },
      }),
    ).toEqual(["general"]);
  });

  it("shows letters when view-issued is allowed", () => {
    expect(
      visibleMenuSections({
        directory: "employee",
        canManage: false,
        canManageProbation: false,
        letterAccess: { ...NONE, canView: true },
        employee: { _id: "1" },
      }),
    ).toEqual(["general", "letters"]);
  });
});
