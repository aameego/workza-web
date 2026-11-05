import { describe, expect, it } from "vitest";
import {
  buildLetterRequest,
  validateRequiredLetterValues,
} from "./buildLetterRequest";

const template = {
  _id: "tmpl-1",
  recipientType: "employee" as const,
  inputFields: [
    { key: "reason", label: "Reason", required: true, kind: "text" },
    { key: "note", label: "Note", required: false, kind: "text" },
  ],
};

describe("buildLetterRequest", () => {
  it("maps employee recipient and values", () => {
    expect(
      buildLetterRequest({
        template,
        recipient: { _id: "emp-1" },
        values: { reason: "Transfer", note: "" },
        sendEmail: true,
      }),
    ).toEqual({
      templateId: "tmpl-1",
      recipientType: "employee",
      employeeId: "emp-1",
      values: { reason: "Transfer", note: "" },
      sendEmail: true,
    });
  });
});

describe("validateRequiredLetterValues", () => {
  it("requires filled required fields", () => {
    expect(validateRequiredLetterValues(template, { reason: "" })).toMatch(
      /Reason/,
    );
    expect(
      validateRequiredLetterValues(template, { reason: "Ok" }),
    ).toBeNull();
  });
});
