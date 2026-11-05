import { api } from "../lib/apiClient";

export type DepartmentNameOption = {
  _id: string;
  name: string;
};

type DepartmentNameResponse = {
  departments?: Array<{ _id?: string; name?: string }>;
  data?: Array<{ _id?: string; name?: string }>;
};

/** Lightweight department list for filters (same as CRA getDepartmentName). */
export const getDepartmentNames = async (
  vendorId: string,
): Promise<DepartmentNameOption[]> => {
  if (!vendorId) return [];
  const data = await api.get<DepartmentNameResponse | Array<{ _id?: string; name?: string }>>(
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
    .filter((d): d is { _id: string; name: string } => Boolean(d?._id && d?.name))
    .map((d) => ({ _id: d._id, name: d.name }));
};
