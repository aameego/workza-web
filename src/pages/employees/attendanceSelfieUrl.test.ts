import { describe, expect, it } from "vitest";
import { resolveAttendanceSelfieUrl } from "./attendanceSelfieUrl";

describe("resolveAttendanceSelfieUrl", () => {
  it("returns null for empty path", () => {
    expect(resolveAttendanceSelfieUrl(null)).toBeNull();
    expect(resolveAttendanceSelfieUrl("")).toBeNull();
  });

  it("prefixes relative API paths and appends token", () => {
    const url = resolveAttendanceSelfieUrl(
      "/attendance/selfie/rec1/0?type=checkin",
      {
        getToken: () => "tok123",
        resolveApiPath: (p) => `https://api.example.com/api${p}`,
      },
    );
    expect(url).toBe(
      "https://api.example.com/api/attendance/selfie/rec1/0?type=checkin&token=tok123",
    );
  });

  it("uses & when path already has query and encodes token", () => {
    const url = resolveAttendanceSelfieUrl(
      "https://cdn.example.com/img.jpg?x=1",
      {
        getToken: () => "a b",
        resolveApiPath: (p) => p,
      },
    );
    expect(url).toBe("https://cdn.example.com/img.jpg?x=1&token=a%20b");
  });

  it("returns bare URL when no auth token", () => {
    const url = resolveAttendanceSelfieUrl("/attendance/selfie/1/0", {
      getToken: () => null,
      resolveApiPath: (p) => `https://api.example.com/api${p}`,
    });
    expect(url).toBe("https://api.example.com/api/attendance/selfie/1/0");
  });
});
