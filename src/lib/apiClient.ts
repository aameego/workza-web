import { API_BASE_URL } from "../config/api";
import { clearAuthToken, getAuthToken } from "./authStorage";

export class ApiError extends Error {
  status: number;
  data: unknown;

  constructor(message: string, status: number, data: unknown = null) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.data = data;
  }
}

export type ApiQueryValue = string | number | boolean | null | undefined;

export type ApiRequestOptions = Omit<RequestInit, "body"> & {
  /** JSON body — serialized and Content-Type set automatically */
  json?: unknown;
  /** Raw body when not using `json` */
  body?: BodyInit | null;
  /** Query string params (omits null/undefined/empty string) */
  params?: Record<string, ApiQueryValue>;
  /**
   * When true, a 401 does not clear the stored token.
   * Use for login / OTP calls that must surface the error to the form.
   */
  skipAuthRedirect?: boolean;
  /** Return response as Blob (Excel export, file downloads) */
  responseType?: "json" | "blob";
};

export type ApiBlobResult = {
  blob: Blob;
  headers: Headers;
  status: number;
};

async function messageFromBlob(blob: Blob): Promise<string | null> {
  try {
    const text = await blob.text();
    if (!text) return null;
    const parsed = JSON.parse(text) as { message?: unknown };
    return typeof parsed?.message === "string" ? parsed.message : null;
  } catch {
    return null;
  }
}

export const appendQueryParams = (
  url: string,
  params?: Record<string, ApiQueryValue>,
): string => {
  if (!params) return url;
  const qs = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") return;
    qs.set(key, String(value));
  });
  const serialized = qs.toString();
  if (!serialized) return url;
  return `${url}${url.includes("?") ? "&" : "?"}${serialized}`;
};

const buildUrl = (path: string, params?: Record<string, ApiQueryValue>) => {
  if (/^https?:\/\//i.test(path)) return appendQueryParams(path, params);
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return appendQueryParams(`${API_BASE_URL}${normalized}`, params);
};

async function parseBody(res: Response): Promise<unknown> {
  if (res.status === 204) return undefined;
  const text = await res.text();
  if (!text) return undefined;
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return text;
  }
}

export async function apiRequest<T = unknown>(
  path: string,
  options: ApiRequestOptions = {},
): Promise<T> {
  const {
    json,
    skipAuthRedirect,
    headers: initHeaders,
    body,
    params,
    responseType = "json",
    ...init
  } = options;

  const headers = new Headers(initHeaders);
  const token = getAuthToken();
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  let finalBody = body ?? null;
  if (json !== undefined) {
    headers.set("Content-Type", "application/json");
    finalBody = JSON.stringify(json);
  }

  const res = await fetch(buildUrl(path, params), {
    ...init,
    headers,
    body: finalBody,
  });

  if (res.status === 401 && !skipAuthRedirect) {
    clearAuthToken();
  }

  if (responseType === "blob") {
    const blob = await res.blob();
    if (!res.ok) {
      const message =
        (await messageFromBlob(blob)) || `Request failed (${res.status})`;
      throw new ApiError(message, res.status, blob);
    }
    return { blob, headers: res.headers, status: res.status } as T;
  }

  const data = await parseBody(res);

  if (!res.ok) {
    const message =
      data &&
      typeof data === "object" &&
      "message" in data &&
      typeof (data as { message: unknown }).message === "string"
        ? (data as { message: string }).message
        : `Request failed (${res.status})`;
    throw new ApiError(message, res.status, data);
  }

  return data as T;
}

export const api = {
  get: <T = unknown>(path: string, options?: ApiRequestOptions) =>
    apiRequest<T>(path, { ...options, method: "GET" }),
  post: <T = unknown>(path: string, options?: ApiRequestOptions) =>
    apiRequest<T>(path, { ...options, method: "POST" }),
  put: <T = unknown>(path: string, options?: ApiRequestOptions) =>
    apiRequest<T>(path, { ...options, method: "PUT" }),
  patch: <T = unknown>(path: string, options?: ApiRequestOptions) =>
    apiRequest<T>(path, { ...options, method: "PATCH" }),
  delete: <T = unknown>(path: string, options?: ApiRequestOptions) =>
    apiRequest<T>(path, { ...options, method: "DELETE" }),
  getBlob: (path: string, options?: ApiRequestOptions) =>
    apiRequest<ApiBlobResult>(path, {
      ...options,
      method: "GET",
      responseType: "blob",
    }),
};

export default api;
