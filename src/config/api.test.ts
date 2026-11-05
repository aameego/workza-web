import { describe, expect, it } from "vitest";
import {
  ensureApiSuffix,
  envFromHostname,
  resolveApiBaseUrl,
} from "./api";

describe("envFromHostname", () => {
  it("treats the Workza development site as the development API", () => {
    expect(envFromHostname("dev.workza.ai")).toBe("development");
    expect(envFromHostname("preview.dev.workza.ai")).toBe("development");
    expect(envFromHostname("gig-dev.aameego.com")).toBe("development");
  });

  it("treats localhost as local and workza.ai as production", () => {
    expect(envFromHostname("localhost")).toBe("local");
    expect(envFromHostname("127.0.0.1")).toBe("local");
    expect(envFromHostname("workza.ai")).toBe("production");
    expect(envFromHostname("www.workza.ai")).toBe("production");
  });
});

describe("ensureApiSuffix", () => {
  it("adds /api when missing and leaves it when present", () => {
    expect(ensureApiSuffix("http://localhost:5001")).toBe(
      "http://localhost:5001/api",
    );
    expect(ensureApiSuffix("http://localhost:5001/api")).toBe(
      "http://localhost:5001/api",
    );
    expect(ensureApiSuffix("http://localhost:5001/api/")).toBe(
      "http://localhost:5001/api",
    );
  });
});

describe("resolveApiBaseUrl", () => {
  it("prefers an explicit base URL", () => {
    const resolved = resolveApiBaseUrl({
      baseUrl: "https://custom.example.com/api",
      apiEnv: "local",
      hostname: "localhost",
    });
    expect(resolved).toEqual({
      url: "https://custom.example.com/api",
      source: "env-url",
      envName: null,
    });
  });

  it("uses the named preset when set", () => {
    const resolved = resolveApiBaseUrl({
      apiEnv: "local",
      hostname: "workza.ai",
    });
    expect(resolved.source).toBe("env-preset");
    expect(resolved.envName).toBe("local");
    expect(resolved.url).toBe("http://localhost:5001/api");
  });

  it("falls back to hostname inference", () => {
    const resolved = resolveApiBaseUrl({ hostname: "localhost" });
    expect(resolved).toEqual({
      url: "http://localhost:5001/api",
      source: "hostname",
      envName: "local",
    });
  });

  it("defaults to production when nothing is provided", () => {
    const resolved = resolveApiBaseUrl({});
    expect(resolved).toEqual({
      url: "https://backend-gig.aameego.com/api",
      source: "default",
      envName: "production",
    });
  });
});
