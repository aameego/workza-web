import { api } from "../lib/apiClient";

export type SalaryStructureOption = {
  _id: string;
  name: string;
};

type StructureListResponse = {
  success?: boolean;
  data?: SalaryStructureOption[];
};

export const getSalaryStructures = async (
  vendorId: string,
): Promise<SalaryStructureOption[]> => {
  const data = await api.get<StructureListResponse | SalaryStructureOption[]>(
    `/salary-components/structure/${vendorId}/salary-structure`,
  );
  if (Array.isArray(data)) return data;
  return Array.isArray(data?.data) ? data.data : [];
};
