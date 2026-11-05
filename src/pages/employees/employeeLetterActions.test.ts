import { describe, expect, it } from "vitest";
import { employeeLetterActions } from "./employeeLetterActions";
import type { LetterAccess } from "./letterAccess";

const VIEW_ONLY: LetterAccess = {
  canView: true,
  canEdit: false,
  canIssue: false,
  canManageOffers: false,
  canIssueConsultancyAgreement: false,
};

const FULL: LetterAccess = {
  canView: true,
  canEdit: true,
  canIssue: true,
  canManageOffers: true,
  canIssueConsultancyAgreement: true,
};

const CONSULTANCY_ONLY: LetterAccess = {
  canView: false,
  canEdit: false,
  canIssue: false,
  canManageOffers: false,
  canIssueConsultancyAgreement: true,
};

describe("employeeLetterActions", () => {
  it("exposes view issued for view-only access", () => {
    expect(employeeLetterActions(VIEW_ONLY, {})).toMatchObject({
      issue: false,
      viewIssued: true,
      any: true,
    });
  });

  it("exposes issue for full access", () => {
    expect(employeeLetterActions(FULL, {})).toMatchObject({
      issue: true,
      viewIssued: true,
      consultancyAgreement: false,
    });
  });

  it("shows consultancy agreement only for consultants without issue rights", () => {
    expect(
      employeeLetterActions(CONSULTANCY_ONLY, { isConsultancy: true }),
    ).toMatchObject({
      consultancyAgreement: true,
      any: true,
    });
    expect(
      employeeLetterActions(CONSULTANCY_ONLY, { isConsultancy: false }),
    ).toMatchObject({ consultancyAgreement: false, any: false });
  });

  it("includes termination when allowed", () => {
    expect(
      employeeLetterActions(
        {
          canView: false,
          canEdit: false,
          canIssue: false,
          canManageOffers: false,
          canIssueConsultancyAgreement: false,
        },
        {},
        { canTerminate: true },
      ),
    ).toMatchObject({
      termination: true,
      any: true,
    });
  });
});
