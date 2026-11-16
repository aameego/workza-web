import { describe, expect, it } from "vitest";
import { NEXT_STATUS } from "./internConstants";

describe("NEXT_STATUS", () => {
  it("allows active interns to complete, terminate, or hold", () => {
    expect(NEXT_STATUS.active).toEqual(
      expect.arrayContaining(["completed", "terminated", "on-hold"]),
    );
  });

  it("allows on-hold interns to resume or terminate", () => {
    expect(NEXT_STATUS["on-hold"]).toEqual(["active", "terminated"]);
  });

  it("blocks further transitions after completion, conversion, or termination", () => {
    expect(NEXT_STATUS.completed).toEqual([]);
    expect(NEXT_STATUS.converted).toEqual([]);
    expect(NEXT_STATUS.terminated).toEqual([]);
  });
});