import { api } from "../lib/apiClient";

export type RoleMember = {
  _id: string;
  name: string;
  employeeCode?: string;
};

export type RoleOption = {
  _id?: string;
  roleName: string;
  displayName?: string;
  description?: string;
  permissions?: string[];
  baselinePermissions?: string[];
  isAdmin?: boolean;
  isSystem?: boolean;
  createdByName?: string;
  createdAt?: string | null;
  members?: RoleMember[];
  memberCount?: number;
};

export type RoleInput = {
  roleName: string;
  displayName: string;
  description: string;
  permissions: string[];
  baselinePermissions: string[];
};

type RolesResponse = {
  roles?: RoleOption[];
};

export const getRoles = async (): Promise<RoleOption[]> => {
  const data = await api.get<RolesResponse | RoleOption[]>("/roles");
  if (Array.isArray(data)) return data;
  return Array.isArray(data?.roles) ? data.roles : [];
};

export const createRole = (input: RoleInput) =>
  api.post<{ role: RoleOption }>("/roles", { json: input });

export const updateRole = (id: string, input: RoleInput) =>
  api.put<{ role: RoleOption }>(`/roles/${id}`, { json: input });
