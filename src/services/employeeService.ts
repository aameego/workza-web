import { api, type ApiBlobResult } from "../lib/apiClient";
import type { BulkUploadResult } from "../pages/employees/employeeBulkTemplate";
import type { EmployeeCreatePayload } from "../pages/employees/employeeForm";
import type {
  EmployeeCreateResponse,
  EmployeeDetail,
  EmployeeExportParams,
  EmployeeListParams,
  EmployeesListResponse,
} from "./employeeTypes";

const consultancyParam = (
  value: boolean | string | undefined,
): string | undefined => {
  if (value === undefined) return undefined;
  return value === true || value === "true" ? "true" : "false";
};

export const getEmployees = async (
  params: EmployeeListParams = {},
): Promise<EmployeesListResponse> => {
  const isPagination =
    params.isPagination === false || params.isPagination === "false"
      ? "false"
      : "true";

  const data = await api.get<EmployeesListResponse>("/employees", {
    params: {
      isPagination,
      page: params.page ?? 1,
      limit: params.limit ?? 10,
      search: params.search,
      status: params.status,
      departmentId: params.departmentId,
      role: params.role,
      appLogin: params.appLogin,
      isConsultancy: consultancyParam(params.isConsultancy),
    },
  });

  return {
    employees: Array.isArray(data?.employees) ? data.employees : [],
    pagination: data?.pagination ?? {
      page: 1,
      limit: params.limit ?? 10,
      total: 0,
      pages: 0,
    },
    scope: data?.scope,
  };
};

export const addEmployee = async (
  payload: EmployeeCreatePayload,
): Promise<EmployeeCreateResponse> => {
  return api.post<EmployeeCreateResponse>("/employees", { json: payload });
};

export const updateEmployee = async (
  id: string,
  payload: EmployeeCreatePayload,
): Promise<EmployeeCreateResponse> => {
  return api.put<EmployeeCreateResponse>(`/employees/${id}`, { json: payload });
};

/**
 * Backend has no GET /employees/:id — load the unpaginated directory (employee +
 * consultancy) and pick the match, same source of truth as the CRA view modal.
 */
export const getEmployeeById = async (
  id: string,
): Promise<EmployeeDetail | null> => {
  const [employees, consultants] = await Promise.all([
    getEmployees({ isPagination: "false", isConsultancy: false }),
    getEmployees({ isPagination: "false", isConsultancy: true }),
  ]);
  const all = [...employees.employees, ...consultants.employees];
  return all.find((emp) => emp._id === id) ?? null;
};

/** Backend-generated Excel for current filters (complete employee details). */
export const exportEmployees = async (
  params: EmployeeExportParams = {},
): Promise<ApiBlobResult> => {
  return api.getBlob("/employees/export", {
    params: {
      search: params.search,
      status: params.status,
      departmentId: params.departmentId,
      role: params.role,
      appLogin: params.appLogin,
      isConsultancy: consultancyParam(params.isConsultancy),
    },
  });
};

export const bulkUploadEmployees = async (
  file: File,
): Promise<BulkUploadResult> => {
  const formData = new FormData();
  formData.append("file", file);
  return api.post<BulkUploadResult>("/employees/bulk-upload", {
    body: formData,
  });
};

export const deleteEmployee = async (id: string): Promise<unknown> =>
  api.delete(`/employees/${id}`);

export const toggleAppLogin = async (
  id: string,
  enable: boolean,
): Promise<unknown> =>
  api.patch(`/employees/${id}/app-login`, { json: { isActive: enable } });

export const resendCredentials = async (id: string): Promise<unknown> =>
  api.post(`/employees/${id}/send-credentials`);

export const convertToEmployee = async (id: string): Promise<unknown> =>
  api.patch(`/employees/${id}/convert-to-employee`);

export const convertToConsultant = async (
  id: string,
  payload: Record<string, unknown> = {},
): Promise<unknown> =>
  api.patch(`/employees/${id}/convert-to-consultant`, { json: payload });

export const confirmProbation = async (
  employeeId: string,
  remark = "",
): Promise<unknown> =>
  api.patch(`/probation/employees/${employeeId}/confirm`, {
    json: { remark },
  });

export const extendProbation = async (
  employeeId: string,
  extraMonths: number,
  remark = "",
): Promise<unknown> =>
  api.patch(`/probation/employees/${employeeId}/extend`, {
    json: { extraMonths, remark },
  });
