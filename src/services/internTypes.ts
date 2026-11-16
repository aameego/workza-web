import type { EmployeeListItem, EmployeeManagerRef } from "./employeeTypes";

export type InternStatus =
  | "active"
  | "on-hold"
  | "completed"
  | "converted"
  | "terminated";

export type StipendFrequency = "monthly" | "weekly" | "daily" | "lump-sum";

export type InternDepartmentRef = {
  _id: string;
  name?: string;
  departmentUniqueId?: string;
} | null;

export type InternSupervisorRef = EmployeeManagerRef & {
  email?: string;
  phone?: string;
};

export type InternRequiredDocumentItem = {
  documentType: string;
  label?: string;
  isRequired?: boolean;
  isCollected?: boolean;
  collectedAt?: string | null;
  documentId?: string | null;
  fileName?: string | null;
  filePath?: string | null;
};

export type InternHistoryEntry = {
  action?: string;
  date?: string;
  previousValue?: unknown;
  newValue?: unknown;
  remark?: string;
  by?: string | null;
};

export type InternListItem = {
  _id: string;
  employeeType?: "intern";
  employeeCode?: string;
  name?: string;
  email?: string;
  phone?: string;
  designation?: string;
  department?: string | InternDepartmentRef;
  departmentId?: string | null;
  location?: string;
  internStatus?: InternStatus | string;
  internshipStartDate?: string | null;
  internshipEndDate?: string | null;
  universityOrInstitute?: string;
  courseOrProgram?: string;
  expectedGraduationDate?: string | null;
  stipendAmount?: number | string | null;
  stipendFrequency?: StipendFrequency | string;
  mentorId?: string | InternSupervisorRef | null;
  reportingManagerId?: string | InternSupervisorRef | null;
  evaluationScore?: number | null;
  evaluationRemarks?: string;
  evaluationDate?: string | null;
  isActive?: boolean;
  isDeleted?: boolean;
  hasAppLogin?: boolean;
  hasLoginEnabled?: boolean;
  photo?: string | null;
  photoUrl?: string | null;
  dob?: string | null;
  gender?: string;
  bloodGroup?: string;
  conversionEmployeeId?: string | null;
  conversionEmployeeCode?: string | null;
};

export type InternDetail = InternListItem &
  Pick<
    EmployeeListItem,
    | "emergencyContact"
    | "fatherHusbandName"
    | "relationWithMember"
    | "nationality"
    | "maritalStatus"
    | "permanentAddress"
    | "aadhaarNumber"
    | "nameAsPerAadhaar"
    | "panNumber"
    | "nameAsPerPan"
    | "bankName"
    | "accountHolderName"
    | "accountNumber"
    | "ifscCode"
    | "highestQualification"
    | "linkedUser"
    | "userRole"
  > & {
    requiredDocuments?: InternRequiredDocumentItem[];
    documents?: unknown[];
    documentsComplete?: boolean;
    documentsMissing?: string[];
    internHistory?: InternHistoryEntry[];
    history?: InternHistoryEntry[];
    internshipCompletionDate?: string | null;
    convertedToFullTimeAt?: string | null;
    evaluatedBy?: string | null;
  };

export type InternListParams = {
  page?: number;
  limit?: number;
  search?: string;
  /** Backend query `status` — active, on-hold, completed, converted, terminated, expiring-soon, deleted, inactive */
  status?: string;
  departmentId?: string;
  mentorId?: string;
  isPagination?: boolean | string;
};

export type InternPagination = {
  page: number;
  limit: number;
  total: number;
  pages: number;
};

export type InternsListResponse = {
  interns: InternListItem[];
  pagination: InternPagination;
  scope?: string;
};

export type InternByIdResponse = {
  intern: InternDetail;
  hasAppLogin?: boolean;
  hasLoginEnabled?: boolean;
};

export type InternMutationResponse = {
  message?: string;
  intern?: InternDetail;
  hasAppLogin?: boolean;
  loginInfo?: InternCredentials | null;
};

export type InternCredentials = {
  id?: string;
  name?: string;
  email?: string;
  phone?: string;
  role?: string;
  created?: boolean;
  temporaryPassword?: string;
  linkedExisting?: boolean;
  organizationCode?: string | null;
};

export type InternResendCredentialsResponse = {
  message?: string;
  emailSent?: boolean;
  hasAppLogin?: boolean;
  loginInfo?: InternCredentials;
};

export type ConvertInternPayload = {
  dateOfJoining?: string;
  designation?: string;
  departmentId?: string;
  employmentStatus?: string;
  createSalaryStructure?: boolean;
  ctcAnnual?: number;
};

export type ConvertInternResponse = {
  message?: string;
  intern?: InternDetail;
  /** New full-time employee record — use `employee._id` for navigation */
  employee?: { _id: string; employeeCode?: string } & Record<string, unknown>;
  salaryStructure?: unknown;
  loginRolePromoted?: boolean;
};

export type InternStipendResponse = {
  internId?: string;
  employeeCode?: string;
  stipendAmount?: number | null;
  stipendFrequency?: StipendFrequency | string;
};

export type ConfigureInternStipendPayload = {
  stipendAmount: number | string;
  stipendFrequency?: StipendFrequency | string;
  templateId?: string;
  components?: unknown[];
  effectiveFrom?: string;
  revisionReason?: string;
};

export type InternDocumentsResponse = {
  internId?: string;
  employeeCode?: string;
  documents?: unknown[];
  requiredDocuments?: InternRequiredDocumentItem[];
  documentsComplete?: boolean;
  documentsMissing?: string[];
};

export type InternChecklistItem = {
  documentType: string;
  label?: string;
  isRequired?: boolean;
};

export type InternStats = {
  total?: number;
  active?: number;
  completed?: number;
  terminated?: number;
  converted?: number;
  onHold?: number;
  expiringSoon?: number;
};

export type InternSearchParams = {
  search?: string;
  limit?: number;
  departmentId?: string;
  status?: string;
};

export type InternSearchResponse = {
  interns: InternListItem[];
};