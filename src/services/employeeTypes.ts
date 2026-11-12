export type EmployeeListParams = {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  departmentId?: string;
  role?: string;
  /** enabled | disabled | none */
  appLogin?: string;
  isConsultancy?: boolean | string;
  isPagination?: boolean | string;
};

export type EmployeeManagerRef = {
  _id?: string;
  name?: string;
  employeeCode?: string;
  designation?: string;
} | null;

export type EmployeeListItem = {
  _id: string;
  employeeCode?: string;
  name?: string;
  email?: string;
  phone?: string;
  designation?: string;
  department?: string | null;
  departmentId?: string | null;
  stateName?: string | null;
  managerId?: EmployeeManagerRef;
  peopleManagerId?: EmployeeManagerRef;
  isActive?: boolean;
  isDeleted?: boolean;
  isExited?: boolean;
  isConsultancy?: boolean;
  employmentStatus?: string;
  hasAppLogin?: boolean;
  hasLoginEnabled?: boolean;
  probationEndDate?: string | null;
  photo?: string | null;
  photoUrl?: string | null;
  photoDisplayUrl?: string | null;
  dob?: string | null;
  dateOfJoining?: string | null;
  bloodGroup?: string;
  gender?: string;
  nationality?: string;
  maritalStatus?: string;
  permanentAddress?: string;
  address?: string;
  fatherHusbandName?: string;
  relationWithMember?: string;
  emergencyContact?: string;
  emergencyContactName?: string;
  location?: string;
  aadhaarNumber?: string;
  nameAsPerAadhaar?: string;
  panNumber?: string;
  nameAsPerPan?: string;
  uan?: string;
  esicNumber?: string;
  pfNumber?: string;
  bankName?: string;
  accountHolderName?: string;
  accountNumber?: string;
  ifscCode?: string;
  familyMembers?: Array<{
    name?: string;
    relation?: string;
    dob?: string | null;
    coverage?: string;
  }>;
  linkedUser?: {
    id?: string;
    email?: string;
    role?: string;
    isActive?: boolean;
    allowedModules?: string[] | null;
  } | null;
  userRole?: string;
  client?: string;
  clientName?: string;
  payType?: "MONTHLY" | "DAILY" | "CALENDAR_DAILY" | string;
  highestQualification?: string;
  relievingDate?: string | null;
  monthlyConsultancyPay?: number | string | null;
  tdsPercent?: number | string | null;
  fatherName?: string;
  relation?: string;
};

/** Full directory row — list API returns the complete employee document. */
export type EmployeeDetail = EmployeeListItem;

export type EmployeePagination = {
  page: number;
  limit: number;
  total: number;
  pages: number;
};

export type EmployeesListResponse = {
  employees: EmployeeListItem[];
  pagination: EmployeePagination;
  scope?: string;
};

export type EmployeeCreateResponse = {
  message?: string;
  employee?: EmployeeListItem & Record<string, unknown>;
  loginInfo?: {
    email?: string;
    phone?: string;
    password?: string;
    temporaryPassword?: string;
  };
};

export type EmployeeExportParams = {
  search?: string;
  status?: string;
  departmentId?: string;
  role?: string;
  appLogin?: string;
  isConsultancy?: boolean | string;
};
