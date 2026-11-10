import { describe, expect, it } from "vitest";
import { cameraAccessErrorMessage } from "./selfieCaptureCopy";

describe("cameraAccessErrorMessage", () => {
  it("explains permission denial", () => {
    expect(cameraAccessErrorMessage({ name: "NotAllowedError" })).toMatch(
      /permission denied/i,
    );
  });

  it("falls back for unknown errors", () => {
    expect(cameraAccessErrorMessage(null)).toMatch(/Unable to access camera/i);
  });
});
