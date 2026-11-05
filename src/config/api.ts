/**
 * Which backend to talk to.
 *
 * NORMAL LEVER — set the environment NAME per deployment:
 *   VITE_API_ENV = local | development | production
 *
 * Resolution order (first match wins):
 *   1. VITE_API_BASE_URL — explicit full URL; overrides everything.
 *   2. VITE_API_ENV      — named preset. ← use this.
 *   3. Browser hostname  — fallback if neither var is set.
 *   4. Default           — production.
 */

export type ApiEnvName = "local" | "development" | "production";

export const PRODUCTION_API_URL = "https://backend-gig.aameego.com/api";
export const DEVELOPMENT_API_URL = "https://dev-gig.aameego.com/api";
export const LOCAL_API_URL = "http://localhost:5001/api";

export const API_ENVIRONMENTS: Record<ApiEnvName, string> = {
  production: PRODUCTION_API_URL,
  development: DEVELOPMENT_API_URL,
  local: LOCAL_API_URL,
};

export const DEFAULT_API_ENV: ApiEnvName = "production";

const trimTrailingSlash = (url: string) => url.replace(/\/$/, "");

/** Every backend route lives under /api — tolerate a host entered without the suffix. */
export const ensureApiSuffix = (url: string) => {
  const trimmed = trimTrailingSlash(url);
  return /\/api$/i.test(trimmed) ? trimmed : `${trimmed}/api`;
};

export const envFromHostname = (hostname: string): ApiEnvName => {
  if (hostname === "localhost" || hostname === "127.0.0.1") return "local";
  if (
    hostname === "dev.workza.ai" ||
    hostname.endsWith(".dev.workza.ai") ||
    hostname.includes("gig-dev")
  ) {
    return "development";
  }
  return "production";
};

export type ResolveApiInput = {
  baseUrl?: string | null;
  apiEnv?: string | null;
  hostname?: string | null;
};

export type ResolvedApi = {
  url: string;
  source: "env-url" | "env-preset" | "hostname" | "default";
  envName: ApiEnvName | null;
};

export const resolveApiBaseUrl = (input: ResolveApiInput = {}): ResolvedApi => {
  const fromUrl = input.baseUrl?.trim();
  if (fromUrl) {
    return { url: trimTrailingSlash(fromUrl), source: "env-url", envName: null };
  }

  const envName = input.apiEnv?.trim();
  if (envName && envName in API_ENVIRONMENTS) {
    const name = envName as ApiEnvName;
    return {
      url: trimTrailingSlash(API_ENVIRONMENTS[name]),
      source: "env-preset",
      envName: name,
    };
  }

  if (input.hostname) {
    const inferred = envFromHostname(input.hostname);
    return {
      url: trimTrailingSlash(API_ENVIRONMENTS[inferred]),
      source: "hostname",
      envName: inferred,
    };
  }

  return {
    url: trimTrailingSlash(PRODUCTION_API_URL),
    source: "default",
    envName: "production",
  };
};

const resolved = resolveApiBaseUrl({
  baseUrl: import.meta.env.VITE_API_BASE_URL,
  apiEnv: import.meta.env.VITE_API_ENV,
  hostname:
    typeof window !== "undefined" ? window.location.hostname : null,
});

/** Used by the API client and all services */
export const API_BASE_URL = ensureApiSuffix(resolved.url);

export const API_CONFIG = {
  baseUrl: API_BASE_URL,
  environments: API_ENVIRONMENTS,
  defaultEnv: DEFAULT_API_ENV,
  activeEnv: resolved.envName,
  source: resolved.source,
};

export const getApiUrl = (path = "") => {
  if (!path) return API_BASE_URL;
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${API_BASE_URL}${normalizedPath}`;
};

if (import.meta.env.DEV) {
  console.info(
    `[API] env=${API_CONFIG.activeEnv} → ${API_BASE_URL} (via ${resolved.source})`,
  );
}
