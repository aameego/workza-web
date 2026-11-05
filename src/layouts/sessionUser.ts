import { getStoredUser } from "../lib/authStorage";

export type SessionUser = {
  _id?: string;
  name?: string;
  employeeName?: string;
  vendorName?: string;
  vendorId?: string;
  role?: string;
  email?: string;
  photoUrl?: string;
  photoDisplayUrl?: string;
};

export const readSessionUser = (): SessionUser | null => {
  const raw = getStoredUser();
  if (!raw || typeof raw !== "object") return null;
  return raw as SessionUser;
};

export const displayNameFor = (user: SessionUser | null): string =>
  user?.name || user?.employeeName || user?.vendorName || "User";

export const roleLabelFor = (user: SessionUser | null): string => {
  const role = user?.role || "User";
  if (role === "HR") return "HR Manager";
  return role;
};

export const initialsFor = (name: string): string => {
  const parts = String(name || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (parts.length === 0) return "U";
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return `${parts[0]![0] || ""}${parts[1]![0] || ""}`.toUpperCase();
};
