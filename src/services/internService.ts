import { api, type ApiBlobResult } from "../lib/apiClient";
import type {
  ConfigureInternStipendPayload,
  ConvertInternPayload,
  ConvertInternResponse,
  InternByIdResponse,
  InternChecklistItem,
  InternDetail,
  InternDocumentsResponse,
  InternListParams,
  InternMutationResponse,
  InternResendCredentialsResponse,
  InternSearchParams,
  InternSearchResponse,
  InternStats,
  InternStipendResponse,
  InternsListResponse,
} from "./internTypes";

const INTERN_PAYLOAD_FIELDS = [
  "employeeCode",
  "name",
  "email",
  "phone",
  "designation",
  "departmentId",
  "location",
  "photo",
  "dob",
  "gender",
  "bloodGroup",
  "emergencyContact",
  "fatherHusbandName",
  "relationWithMember",
  "nationality",
  "maritalStatus",
  "permanentAddress",
  "aadhaarNumber",
  "nameAsPerAadhaar",
  "panNumber",
  "nameAsPerPan",
  "bankName",
  "accountHolderName",
  "accountNumber",
  "ifscCode",
  "highestQualification",
  "internshipStartDate",
  "internshipEndDate",
  "universityOrInstitute",
  "courseOrProgram",
  "expectedGraduationDate",
  "mentorId",
  "reportingManagerId",
  "stipendAmount",
  "stipendFrequency",
  "evaluationScore",
  "evaluationRemarks",
  "evaluationDate",
  "evaluatedBy",
  "isActive",
  "requiredDocuments",
  "createAppLogin",
  "userRole",
  "userPassword",
  "allowedModules",
] as const;

const idOf = (value: unknown): string | null => {
  if (!value) return null;
  if (typeof value === "object" && value !== null && "_id" in value) {
    const id = (value as { _id?: unknown })._id;
    return id ? String(id) : null;
  }
  return typeof value === "string" ? value : null;
};

export const MAX_MONTHLY_STIPEND = 10_000_000;

export type StipendDraft = {
  monthlyStipend?: string | number | null;
  stipendFrequency?: string;
};

export const hasStipendData = (draft?: StipendDraft | null): boolean => {
  if (!draft) return false;
  return draft.monthlyStipend !== "" && draft.monthlyStipend != null;
};

export const validateStipendDraft = (draft?: StipendDraft | null): string => {
  if (!draft || !hasStipendData(draft)) return "";
  const raw = String(draft.monthlyStipend).trim();
  const amount = Number(raw);
  if (!Number.isFinite(amount)) return "Enter a valid monthly stipend.";
  if (amount <= 0) {
    return "Monthly stipend must be greater than ₹0. Leave it blank for unpaid internships.";
  }
  if (amount > MAX_MONTHLY_STIPEND) {
    return `Monthly stipend cannot exceed ₹${MAX_MONTHLY_STIPEND.toLocaleString("en-IN")}.`;
  }
  return "";
};

export const buildInternPayload = (
  data: Record<string, unknown> = {},
): Record<string, unknown> => {
  const payload: Record<string, unknown> = {};
  INTERN_PAYLOAD_FIELDS.forEach((field) => {
    const value = data[field];
    if (value !== undefined && value !== null && value !== "") {
      payload[field] = value;
    }
  });

  if (data.mentorId === "" || data.mentorId === null) {
    payload.mentorId = null;
  } else if (data.mentorId) {
    payload.mentorId = idOf(data.mentorId);
  }

  if (data.reportingManagerId === "" || data.reportingManagerId === null) {
    payload.reportingManagerId = null;
  } else if (data.reportingManagerId) {
    payload.reportingManagerId = idOf(data.reportingManagerId);
  }

  if (
    data.departmentId &&
    typeof data.departmentId === "object" &&
    data.departmentId !== null &&
    "_id" in data.departmentId
  ) {
    payload.departmentId = (data.departmentId as { _id: string })._id;
  }

  if (data.email) {
    payload.email = String(data.email).trim().toLowerCase();
  }

  if (payload.employeeCode) {
    payload.employeeCode = String(payload.employeeCode).trim().toUpperCase();
    if (!payload.employeeCode) delete payload.employeeCode;
  }
  if (data.ifscCode) {
    payload.ifscCode = String(data.ifscCode).toUpperCase();
  }
  if (data.panNumber) {
    payload.panNumber = String(data.panNumber).toUpperCase();
  }

  if (data.createAppLogin === true) {
    payload.createAppLogin = true;
    payload.userRole = data.userRole || "Intern";
    if (data.userPassword) {
      payload.userPassword = data.userPassword;
    }
    if (Array.isArray(data.allowedModules)) {
      payload.allowedModules = data.allowedModules;
    }
  } else {
    delete payload.createAppLogin;
    delete payload.userRole;
    delete payload.userPassword;
    if (!Array.isArray(data.allowedModules)) {
      delete payload.allowedModules;
    }
  }

  return payload;
};

export const getInterns = async (
  params: InternListParams = {},
): Promise<InternsListResponse> => {
  const isPagination =
    params.isPagination === false || params.isPagination === "false"
      ? "false"
      : "true";

  const data = await api.get<InternsListResponse>("/interns", {
    params: {
      isPagination,
      page: params.page ?? 1,
      limit: params.limit ?? 10,
      search: params.search,
      status: params.status,
      departmentId: params.departmentId,
      mentorId: params.mentorId,
    },
  });

  return {
    interns: Array.isArray(data?.interns) ? data.interns : [],
    pagination: data?.pagination ?? {
      page: 1,
      limit: params.limit ?? 10,
      total: 0,
      pages: 0,
    },
    scope: data?.scope,
  };
};

export const searchInterns = async (
  params: InternSearchParams = {},
): Promise<InternSearchResponse> => {
  const data = await api.get<InternSearchResponse>("/interns/search", {
    params: {
      search: params.search,
      limit: params.limit,
      departmentId: params.departmentId,
      status: params.status,
    },
  });
  return {
    interns: Array.isArray(data?.interns) ? data.interns : [],
  };
};

export const getInternStats = async (): Promise<InternStats> =>
  api.get<InternStats>("/interns/stats");

export const getInternById = async (id: string): Promise<InternDetail | null> => {
  const data = await api.get<InternByIdResponse>(`/interns/${id}`);
  return data?.intern ?? null;
};

export const addIntern = async (
  payload: Record<string, unknown>,
): Promise<InternMutationResponse> =>
  api.post<InternMutationResponse>("/interns", { json: payload });

export const updateIntern = async (
  id: string,
  payload: Record<string, unknown>,
): Promise<InternMutationResponse> =>
  api.put<InternMutationResponse>(`/interns/${id}`, { json: payload });

export const updateInternStatus = async (
  id: string,
  body: { status: string; remark?: string },
): Promise<InternMutationResponse> =>
  api.patch<InternMutationResponse>(`/interns/${id}/status`, { json: body });

export const extendInternship = async (
  id: string,
  body: { newEndDate: string; remark?: string },
): Promise<InternMutationResponse> =>
  api.patch<InternMutationResponse>(`/interns/${id}/extend`, { json: body });

export const getInternStipend = async (id: string): Promise<InternStipendResponse> =>
  api.get<InternStipendResponse>(`/interns/${id}/stipend`);

export const configureInternStipend = async (
  id: string,
  payload: ConfigureInternStipendPayload,
): Promise<InternMutationResponse> =>
  api.post<InternMutationResponse>(`/interns/${id}/stipend`, { json: payload });

export const getInternDocuments = async (
  id: string,
): Promise<InternDocumentsResponse> =>
  api.get<InternDocumentsResponse>(`/interns/${id}/documents`);

export const updateInternChecklist = async (
  id: string,
  items: InternChecklistItem[],
): Promise<InternMutationResponse> =>
  api.patch<InternMutationResponse>(`/interns/${id}/documents-checklist`, {
    json: { items },
  });

export const uploadInternDocument = async (input: {
  internId: string;
  documentType: string;
  file: File;
  fileName?: string;
}): Promise<unknown> => {
  const formData = new FormData();
  formData.append("file", input.file);
  formData.append("internId", input.internId);
  formData.append("documentType", input.documentType);
  if (input.fileName) formData.append("fileName", input.fileName);
  return api.post("/documents/upload", { body: formData });
};

export const convertInternToEmployee = async (
  id: string,
  payload: ConvertInternPayload = {},
): Promise<ConvertInternResponse> =>
  api.post<ConvertInternResponse>(`/interns/${id}/convert-to-employee`, {
    json: payload,
  });

export const deleteIntern = async (id: string): Promise<InternMutationResponse> =>
  api.delete<InternMutationResponse>(`/interns/${id}`);

export const restoreIntern = async (id: string): Promise<InternMutationResponse> =>
  api.patch<InternMutationResponse>(`/interns/${id}/restore`);

export const toggleInternAppLogin = async (
  id: string,
  enable: boolean,
): Promise<InternMutationResponse> =>
  api.patch<InternMutationResponse>(`/interns/${id}/app-login`, {
    json: { isActive: enable },
  });

export const resendInternCredentials = async (
  id: string,
): Promise<InternResendCredentialsResponse> =>
  api.post<InternResendCredentialsResponse>(`/interns/${id}/send-credentials`);

export type InternExportParams = Pick<
  InternListParams,
  "search" | "status" | "departmentId"
>;

export const exportInterns = async (
  params: InternExportParams = {},
): Promise<ApiBlobResult> =>
  api.getBlob("/interns/export", {
    params: {
      search: params.search,
      status: params.status,
      departmentId: params.departmentId,
    },
  });