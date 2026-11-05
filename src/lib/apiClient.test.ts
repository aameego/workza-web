import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { api, ApiError } from "./apiClient";
import { clearAuthToken } from "./authStorage";

describe("apiClient", () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        new Response(JSON.stringify({ ok: true }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }),
      ),
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    clearAuthToken();
  });

  it("attaches the Bearer token when present", async () => {
    localStorage.setItem("token", "abc123");
    await api.get("/health");
    expect(fetch).toHaveBeenCalledTimes(1);
    const [, init] = vi.mocked(fetch).mock.calls[0]!;
    const headers = new Headers(init?.headers);
    expect(headers.get("Authorization")).toBe("Bearer abc123");
  });

  it("clears the token on 401 unless skipAuthRedirect is set", async () => {
    localStorage.setItem("token", "stale");
    vi.mocked(fetch).mockResolvedValueOnce(
      new Response(JSON.stringify({ message: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      }),
    );

    await expect(api.get("/auth/me")).rejects.toBeInstanceOf(ApiError);
    expect(localStorage.getItem("token")).toBeNull();
  });

  it("keeps the token on 401 when skipAuthRedirect is true", async () => {
    localStorage.setItem("token", "keep-me");
    vi.mocked(fetch).mockResolvedValueOnce(
      new Response(JSON.stringify({ message: "Invalid credentials" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      }),
    );

    await expect(
      api.post("/auth/login", {
        json: { email: "a@b.com", password: "x" },
        skipAuthRedirect: true,
      }),
    ).rejects.toBeInstanceOf(ApiError);
    expect(localStorage.getItem("token")).toBe("keep-me");
  });
});
