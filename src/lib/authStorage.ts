const TOKEN_KEY = "token";
const USER_KEY = "user";
const ORGS_KEY = "organisations";

const readJson = (raw: string | null) => {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as unknown;
  } catch {
    return null;
  }
};

const storageForSession = (): Storage =>
  window.sessionStorage.getItem(TOKEN_KEY) &&
  !window.localStorage.getItem(TOKEN_KEY)
    ? window.sessionStorage
    : window.localStorage;

const authClearedListeners = new Set<() => void>();

export const onAuthCleared = (listener: () => void) => {
  authClearedListeners.add(listener);
  return () => {
    authClearedListeners.delete(listener);
  };
};

export const getAuthToken = (): string | null => {
  if (typeof window === "undefined") return null;
  return (
    window.localStorage.getItem(TOKEN_KEY) ||
    window.sessionStorage.getItem(TOKEN_KEY)
  );
};

export const clearAuthToken = (): void => {
  clearAuthData();
};

export const clearAuthData = (): void => {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(TOKEN_KEY);
  window.localStorage.removeItem(USER_KEY);
  window.localStorage.removeItem(ORGS_KEY);
  window.sessionStorage.removeItem(TOKEN_KEY);
  window.sessionStorage.removeItem(USER_KEY);
  window.sessionStorage.removeItem(ORGS_KEY);
  authClearedListeners.forEach((listener) => listener());
};

export const setAuthData = (
  token: string,
  user: unknown,
  rememberMe = false,
): void => {
  const storage = rememberMe ? window.localStorage : window.sessionStorage;
  clearAuthData();
  storage.setItem(TOKEN_KEY, token);
  storage.setItem(USER_KEY, JSON.stringify(user));
};

/** Merge fields into the stored user (same storage it came from) and notify listeners. */
export const updateStoredUser = (patch: Record<string, unknown>): void => {
  if (typeof window === "undefined") return;
  const storage = window.localStorage.getItem(USER_KEY) ? window.localStorage : window.sessionStorage;
  const current = readJson(storage.getItem(USER_KEY));
  if (!current || typeof current !== "object") return;
  storage.setItem(USER_KEY, JSON.stringify({ ...current, ...patch }));
  window.dispatchEvent(new Event("user-updated"));
};

export const getStoredUser = (): unknown | null => {
  if (typeof window === "undefined") return null;
  const user =
    window.localStorage.getItem(USER_KEY) ||
    window.sessionStorage.getItem(USER_KEY);
  return readJson(user);
};

export const getOrganisations = (): unknown[] => {
  if (typeof window === "undefined") return [];
  const raw =
    window.localStorage.getItem(ORGS_KEY) ||
    window.sessionStorage.getItem(ORGS_KEY);
  const parsed = readJson(raw);
  return Array.isArray(parsed) ? parsed : [];
};

export const setOrganisations = (organisations: unknown): void => {
  storageForSession().setItem(
    ORGS_KEY,
    JSON.stringify(Array.isArray(organisations) ? organisations : []),
  );
};
