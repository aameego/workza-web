import { getApiUrl } from "../../config/api";
import { getAuthToken } from "../../lib/authStorage";

/**
 * Resolve attendance selfie path (relative API path or absolute URL) into a
 * browser-loadable URL, attaching the auth token query param when present
 * (same pattern as AameegoGig-Frontend getCheckInSelfieUrl).
 */
export const resolveAttendanceSelfieUrl = (
  path?: string | null,
  options: {
    getToken?: () => string | null;
    resolveApiPath?: (path: string) => string;
  } = {},
): string | null => {
  if (!path) return null;
  const getToken = options.getToken ?? getAuthToken;
  const resolveApiPath = options.resolveApiPath ?? getApiUrl;
  const token = getToken();
  const base = path.startsWith("http")
    ? path
    : resolveApiPath(path.startsWith("/") ? path : `/${path}`);
  if (!token) return base;
  return `${base}${base.includes("?") ? "&" : "?"}token=${encodeURIComponent(token)}`;
};
