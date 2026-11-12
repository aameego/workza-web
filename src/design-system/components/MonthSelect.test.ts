import { describe, expect, it } from "vitest";
import { monthOptions } from "./monthOptions";

describe("monthOptions", () => {
  const today = new Date(2026, 10, 12); // Nov 2026

  it("spans two years back to one year ahead, newest first", () => {
    const opts = monthOptions(2026, 11, today);
    expect(opts[0].label).toBe("November 2027");
    expect(opts.at(-1)?.label).toBe("November 2024");
    expect(opts).toHaveLength(37);
  });

  it("always includes an out-of-range selected month", () => {
    const opts = monthOptions(2020, 3, today);
    expect(opts.at(-1)?.label).toBe("March 2020");
  });
});
