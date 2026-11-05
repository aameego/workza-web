import { describe, expect, it } from "vitest";
import { filterIssuableTemplates } from "./letterCatalog";

describe("filterIssuableTemplates", () => {
  const templates = [
    {
      _id: "1",
      name: "Offer",
      recipientType: "candidate" as const,
      status: "active",
    },
    {
      _id: "2",
      name: "Experience",
      recipientType: "employee" as const,
      status: "active",
    },
    {
      _id: "3",
      name: "Consultancy",
      recipientType: "employee" as const,
      recipientRule: "consultancy",
      status: "active",
    },
    {
      _id: "4",
      name: "Old",
      recipientType: "employee" as const,
      archived: true,
    },
  ];

  it("filters by recipient type and skips archived", () => {
    expect(
      filterIssuableTemplates(templates, { recipientType: "employee" }).map(
        (t) => t._id,
      ),
    ).toEqual(["2", "3"]);
  });

  it("filters by recipient rule", () => {
    expect(
      filterIssuableTemplates(templates, {
        recipientType: "employee",
        recipientRule: "consultancy",
      }).map((t) => t._id),
    ).toEqual(["3"]);
  });
});
