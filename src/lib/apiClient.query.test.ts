import { describe, expect, it } from "vitest";
import { appendQueryParams } from "./apiClient";

describe("appendQueryParams", () => {
  it("omits empty values", () => {
    expect(
      appendQueryParams("/employees", {
        page: 1,
        search: "",
        status: undefined,
        role: null,
        limit: 10,
      }),
    ).toBe("/employees?page=1&limit=10");
  });

  it("appends to existing query", () => {
    expect(appendQueryParams("/employees?x=1", { page: 2 })).toBe(
      "/employees?x=1&page=2",
    );
  });
});
