import type { EmployeeDetail } from "../../services/employeeTypes";
import {
  familyMembersToForm,
  type FamilyMemberForm,
} from "./familyMembers";

const refId = (value: unknown): string => {
  if (!value) return "";
  if (typeof value === "string") return value;
  if (typeof value === "object" && value !== null && "_id" in value) {
    const id = (value as { _id?: unknown })._id;
    return id ? String(id) : "";
  }
  return "";
};

const dateOnly = (value: unknown): string => {
  if (value === undefined || value === null || value === "") return "";
  const str = String(value);
  if (/^\d{4}-\d{2}-\d{2}/.test(str)) return str.slice(0, 10);
  return "";
};

const strOrEmpty = (value: unknown): string =>
  value === undefined || value === null ? "" : String(value);

/** Form state aligned with CRA Employees.jsx initialForm + Figma add-employee sections */
export type EmployeeFormValues = {
  employeeCode: string;
  name: string;
  email: string;
  phone: string;
  designation: string;
  departmentId: string;
  location: string;
  managerId: string;
  peopleManagerId: string;
  dateOfJoining: string;
  dob: string;
  gender: string;
  fatherHusbandName: string;
  relationWithMember: string;
  nationality: string;
  maritalStatus: string;
  bloodGroup: string;
  emergencyContact: string;
  emergencyContactName: string;
  familyMembers: FamilyMemberForm[];
  permanentAddress: string;
  aadhaarNumber: string;
  nameAsPerAadhaar: string;
  panNumber: string;
  nameAsPerPan: string;
  uan: string;
  pfNumber: string;
  esicNumber: string;
  bankName: string;
  accountHolderName: string;
  accountNumber: string;
  ifscCode: string;
  highestQualification: string;
  client: string;
  probationEndDate: string;
  relievingDate: string;
  payType: "MONTHLY" | "DAILY" | "CALENDAR_DAILY";
  isConsultancy: boolean;
  monthlyConsultancyPay: string;
  tdsPercent: string;
  createAppLogin: boolean;
  userRole: string;
  userPassword: string;
};

export const createEmptyEmployeeForm = (
  overrides: Partial<EmployeeFormValues> = {},
): EmployeeFormValues => ({
  employeeCode: "",
  name: "",
  email: "",
  phone: "",
  designation: "",
  departmentId: "",
  location: "",
  managerId: "",
  peopleManagerId: "",
  dateOfJoining: "",
  dob: "",
  gender: "",
  fatherHusbandName: "",
  relationWithMember: "",
  nationality: "",
  maritalStatus: "",
  bloodGroup: "",
  emergencyContact: "",
  emergencyContactName: "",
  familyMembers: [],
  permanentAddress: "",
  aadhaarNumber: "",
  nameAsPerAadhaar: "",
  panNumber: "",
  nameAsPerPan: "",
  uan: "",
  pfNumber: "",
  esicNumber: "",
  bankName: "",
  accountHolderName: "",
  accountNumber: "",
  ifscCode: "",
  highestQualification: "",
  client: "",
  probationEndDate: "",
  relievingDate: "",
  payType: "MONTHLY",
  isConsultancy: false,
  monthlyConsultancyPay: "",
  tdsPercent: "",
  createAppLogin: false,
  userRole: "Employee",
  userPassword: "",
  ...overrides,
});

const EMPLOYEE_PAYLOAD_FIELDS = [
  "employeeCode",
  "name",
  "email",
  "phone",
  "designation",
  "departmentId",
  "location",
  "dob",
  "bloodGroup",
  "emergencyContact",
  "emergencyContactName",
  "gender",
  "fatherHusbandName",
  "relationWithMember",
  "nationality",
  "maritalStatus",
  "permanentAddress",
  "aadhaarNumber",
  "nameAsPerAadhaar",
  "panNumber",
  "nameAsPerPan",
  "uan",
  "pfNumber",
  "esicNumber",
  "bankName",
  "accountHolderName",
  "accountNumber",
  "ifscCode",
  "highestQualification",
  "dateOfJoining",
  "relievingDate",
  "managerId",
  "peopleManagerId",
  "client",
  "isConsultancy",
  "monthlyConsultancyPay",
  "tdsPercent",
  "payType",
  "probationEndDate",
] as const;

export type EmployeeCreatePayload = Record<string, unknown>;

export type BuildEmployeePayloadExtras = {
  /** Create a brand-new app login (create or first-time enable on edit). */
  createAppLogin?: boolean;
  /** Employee already has a linked login — sync role/password without createAppLogin. */
  hasAppLogin?: boolean;
};

/**
 * Maps a directory employee document into add/edit form values
 * (same rules as CRA normalizeEmployeeForForm).
 */
export const employeeDetailToForm = (
  emp: EmployeeDetail,
): EmployeeFormValues => {
  const role = emp.linkedUser?.role || emp.userRole || "Employee";
  const payType =
    emp.payType === "DAILY" || emp.payType === "CALENDAR_DAILY"
      ? emp.payType
      : "MONTHLY";

  return createEmptyEmployeeForm({
    employeeCode: emp.employeeCode || "",
    name: emp.name || "",
    email: emp.email || "",
    phone: emp.phone || "",
    designation: emp.designation || "",
    departmentId: String(emp.departmentId || emp.department || ""),
    location: emp.location || "",
    managerId: refId(emp.managerId),
    peopleManagerId: refId(emp.peopleManagerId),
    dateOfJoining: dateOnly(emp.dateOfJoining),
    dob: dateOnly(emp.dob),
    gender: emp.gender || "",
    fatherHusbandName: emp.fatherHusbandName || emp.fatherName || "",
    relationWithMember: emp.relationWithMember || emp.relation || "",
    nationality: emp.nationality || "",
    maritalStatus: emp.maritalStatus || "",
    bloodGroup: emp.bloodGroup || "",
    emergencyContact: emp.emergencyContact || "",
    emergencyContactName: emp.emergencyContactName || "",
    familyMembers: familyMembersToForm(emp.familyMembers),
    permanentAddress: emp.permanentAddress || emp.address || "",
    aadhaarNumber: emp.aadhaarNumber || "",
    nameAsPerAadhaar: emp.nameAsPerAadhaar || "",
    panNumber: emp.panNumber || "",
    nameAsPerPan: emp.nameAsPerPan || "",
    uan: emp.uan || "",
    pfNumber: emp.pfNumber || "",
    esicNumber: emp.esicNumber || "",
    bankName: emp.bankName || "",
    accountHolderName: emp.accountHolderName || "",
    accountNumber: emp.accountNumber || "",
    ifscCode: emp.ifscCode || "",
    highestQualification: emp.highestQualification || "",
    client: emp.client || emp.clientName || "",
    probationEndDate: dateOnly(emp.probationEndDate),
    relievingDate: dateOnly(emp.relievingDate),
    payType,
    isConsultancy: Boolean(emp.isConsultancy),
    monthlyConsultancyPay: strOrEmpty(emp.monthlyConsultancyPay),
    tdsPercent: strOrEmpty(emp.tdsPercent),
    createAppLogin: Boolean(emp.hasAppLogin || emp.hasLoginEnabled),
    userRole: role,
    userPassword: "",
  });
};

/** Mirrors AameegoGig-Frontend buildEmployeePayload for create + update */
export const buildEmployeePayload = (
  data: EmployeeFormValues,
  extras: BuildEmployeePayloadExtras = {},
): EmployeeCreatePayload => {
  const payload: EmployeeCreatePayload = {};

  for (const field of EMPLOYEE_PAYLOAD_FIELDS) {
    const value = data[field];
    if (value !== undefined && value !== null && value !== "") {
      payload[field] = value;
    }
  }

  if (data.managerId === "" || data.managerId === null) {
    payload.managerId = null;
  } else if (data.managerId) {
    payload.managerId = data.managerId;
  }

  if (data.peopleManagerId === "" || data.peopleManagerId === null) {
    payload.peopleManagerId = null;
  } else if (data.peopleManagerId) {
    payload.peopleManagerId = data.peopleManagerId;
  }

  const shouldCreateLogin =
    extras.createAppLogin === true ||
    (data.createAppLogin === true && !extras.hasAppLogin);

  if (shouldCreateLogin) {
    payload.createAppLogin = true;
    payload.userRole = data.userRole || "Employee";
    if (data.userPassword) {
      payload.userPassword = data.userPassword;
    }
  } else if (extras.hasAppLogin) {
    // Sync role / optional password reset without reopening loginInfo modal.
    if (data.userRole) {
      payload.userRole = data.userRole;
    }
    if (data.userPassword?.trim()) {
      payload.userPassword = data.userPassword.trim();
    }
  }

  if (Array.isArray(data.familyMembers)) {
    payload.familyMembers = data.familyMembers;
  }

  if (data.email) {
    payload.email = String(data.email).trim().toLowerCase();
  }

  if (payload.employeeCode) {
    payload.employeeCode = String(payload.employeeCode).trim().toUpperCase();
    if (!payload.employeeCode) delete payload.employeeCode;
  }

  if (data.isConsultancy) {
    payload.isConsultancy = true;
    if (data.monthlyConsultancyPay !== "") {
      payload.monthlyConsultancyPay = Number(data.monthlyConsultancyPay);
    }
    if (data.tdsPercent !== "") {
      payload.tdsPercent = Number(data.tdsPercent);
    }
  }

  return payload;
};

export const GENDER_OPTIONS = ["Male", "Female", "Other"] as const;
export const MARITAL_OPTIONS = ["Single", "Married"] as const;
export const RELATION_OPTIONS = [
  "Father",
  "Mother",
  "Husband",
  "Wife",
  "Spouse",
  "Son",
  "Daughter",
  "Brother",
  "Sister",
  "Grandfather",
  "Grandmother",
  "Uncle",
  "Aunt",
  "Guardian",
  "Other",
] as const;
export const BLOOD_GROUP_OPTIONS = [
  "A+",
  "A-",
  "B+",
  "B-",
  "AB+",
  "AB-",
  "O+",
  "O-",
] as const;
export const PAY_TYPE_OPTIONS = [
  { value: "MONTHLY", label: "Monthly" },
  { value: "DAILY", label: "Daily" },
] as const;
export const APP_ROLE_OPTIONS = [
  { value: "Employee", label: "Employee" },
  { value: "Intern", label: "Intern" },
  { value: "Manager", label: "Manager" },
  { value: "HR", label: "HR" },
] as const;
