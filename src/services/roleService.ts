import { api } from "../lib/apiClient";

export type RoleOption = {
  _id?: string;
  roleName: string;
  displayName?: string;
  isAdmin?: boolean;
};

type RolesResponse = {
  roles?: RoleOption[];
};

export const getRoles = async (): Promise<RoleOption[]> => {
  const data = await api.get<RolesResponse | RoleOption[]>("/roles");
  if (Array.isArray(data)) return data;
  return Array.isArray(data?.roles) ? data.roles : [];
};
