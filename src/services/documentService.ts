import { api } from "../lib/apiClient";
import { getApiUrl } from "../config/api";
import { getAuthToken, getStoredUser } from "../lib/authStorage";
import type { EmployeeDocument } from "../pages/employees/documentTypes";

type EmployeeDocumentsResponse = {
  documents?: EmployeeDocument[];
};

export const getEmployeeDocuments = async (
  employeeId: string,
): Promise<EmployeeDocument[]> => {
  const data = await api.get<EmployeeDocumentsResponse>(
    `/documents/employee/${employeeId}`,
  );
  return Array.isArray(data?.documents) ? data.documents : [];
};

export const uploadEmployeeDocument = async (input: {
  employeeId: string;
  documentType: string;
  file: File;
}): Promise<unknown> => {
  const formData = new FormData();
  formData.append("file", input.file);
  formData.append("employeeId", input.employeeId);
  formData.append("documentType", input.documentType);
  return api.post("/documents/upload", { body: formData });
};

export const getDocumentViewUrl = (id: string): string => {
  const token = getAuthToken() || "";
  const user = getStoredUser() as { vendor_code?: string; vendorCode?: string } | null;
  const vendorCode = user?.vendor_code || user?.vendorCode || "";
  const vendorQs = vendorCode
    ? `&vendorCode=${encodeURIComponent(vendorCode)}`
    : "";
  return getApiUrl(
    `/documents/view/${id}?token=${encodeURIComponent(token)}${vendorQs}`,
  );
};
