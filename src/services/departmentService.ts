import { api } from "../lib/apiClient";

export type DepartmentNameOption = {
  _id: string;
  name: string;
};

export type DepartmentRef = {
  _id?: string;
  name?: string;
  shiftName?: string;
  policyName?: string;
  email?: string;
  employeeCode?: string;
};

export type Department = {
  _id: string;
  name: string;
  description?: string;
  shift?: string | DepartmentRef | null;
  otPolicy?: string | DepartmentRef | null;
  departmentHead?: string | DepartmentRef | null;
  vendorId?: string;
  departmentUniqueId?: string;
  sitePayoutRule?: string | null;
  stateName?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  geofenceRadiusMeters?: number | null;
  allowOutsideGeofence?: boolean;
};

export type ShiftOption = {
  _id: string;
  name?: string;
  shiftName?: string;
};

export type OtPolicyOption = {
  _id: string;
  name?: string;
  policyName?: string;
};

export type DepartmentPayload = {
  vendorId: string;
  name: string;
  description?: string;
  shift?: string | null;
  otPolicy?: string | null;
  departmentHead?: string | null;
  sitePayoutRule?: string | null;
  stateName?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  geofenceRadiusMeters?: number | null;
  allowOutsideGeofence?: boolean;
};

type DepartmentNameResponse =
  | DepartmentNameOption[]
  | {
      departments?: Array<{ _id?: string; name?: string }>;
      data?: Array<{ _id?: string; name?: string }>;
    };

const asArray = <T>(data: unknown): T[] =>
  Array.isArray(data) ? (data as T[]) : [];

/** Lightweight department list for filters (same as CRA getDepartmentName). */
export const getDepartmentNames = async (
  vendorId: string,
): Promise<DepartmentNameOption[]> => {
  if (!vendorId) return [];
  const data = await api.get<DepartmentNameResponse>(
    `/department/getDepartmentName/${vendorId}`,
  );

  const raw = Array.isArray(data)
    ? data
    : Array.isArray(data?.departments)
      ? data.departments
      : Array.isArray(data?.data)
        ? data.data
        : [];

  return raw
    .filter((d): d is { _id: string; name: string } =>
      Boolean(d?._id && d?.name),
    )
    .map((d) => ({ _id: d._id, name: d.name }));
};

export const getDepartments = async (
  vendorId: string,
): Promise<Department[]> => {
  if (!vendorId) return [];
  const data = await api.get<Department[] | { data?: Department[] }>(
    `/department/getDepartments/${vendorId}`,
  );
  if (Array.isArray(data)) return data;
  return asArray<Department>(data?.data);
};

export const createDepartment = async (
  payload: DepartmentPayload,
): Promise<Department> =>
  api.post<Department>("/department/createDepartment", { json: payload });

export const updateDepartment = async (
  id: string,
  payload: DepartmentPayload,
): Promise<Department> =>
  api.put<Department>(`/department/updateDepartment/${id}`, { json: payload });

export const deleteDepartment = async (
  id: string,
): Promise<{ message?: string }> =>
  api.delete<{ message?: string }>(`/department/deleteDepartment/${id}`);

export const getShifts = async (vendorId: string): Promise<ShiftOption[]> => {
  if (!vendorId) return [];
  const data = await api.get<ShiftOption[] | { data?: ShiftOption[] }>(
    `/department/getShifts/${vendorId}`,
  );
  return Array.isArray(data) ? data : asArray<ShiftOption>(data?.data);
};

export const getOtPolicies = async (
  vendorId: string,
): Promise<OtPolicyOption[]> => {
  if (!vendorId) return [];
  const data = await api.get<OtPolicyOption[] | { data?: OtPolicyOption[] }>(
    `/department/getOtPolicies/${vendorId}`,
  );
  return Array.isArray(data) ? data : asArray<OtPolicyOption>(data?.data);
};
