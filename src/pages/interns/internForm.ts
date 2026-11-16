import { buildInternPayload } from "../../services/internService";
import type { InternDetail } from "../../services/internTypes";

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

export type InternFormValues = {
  employeeCode: string;
  name: string;
  email: string;
  phone: string;
  designation: string;
  departmentId: string;
  location: string;
  dob: string;
  gender: string;
  bloodGroup: string;
  emergencyContact: string;
  fatherHusbandName: string;
  relationWithMember: string;
  nationality: string;
  maritalStatus: string;
  permanentAddress: string;
  aadhaarNumber: string;
  nameAsPerAadhaar: string;
  panNumber: string;
  nameAsPerPan: string;
  bankName: string;
  accountHolderName: string;
  accountNumber: string;
  ifscCode: string;
  highestQualification: string;
  internshipStartDate: string;
  internshipEndDate: string;
  universityOrInstitute: string;
  courseOrProgram: string;
  expectedGraduationDate: string;
  mentorId: string;
  reportingManagerId: string;
  stipendAmount: string;
  stipendFrequency: string;
  createAppLogin: boolean;
  userRole: string;
  userPassword: string;
  allowedModules: string[];
};

export const createEmptyInternForm = (
  overrides: Partial<InternFormValues> = {},
): InternFormValues => ({
  employeeCode: "",
  name: "",
  email: "",
  phone: "",
  designation: "Intern",
  departmentId: "",
  location: "",
  dob: "",
  gender: "",
  bloodGroup: "",
  emergencyContact: "",
  fatherHusbandName: "",
  relationWithMember: "",
  nationality: "",
  maritalStatus: "",
  permanentAddress: "",
  aadhaarNumber: "",
  nameAsPerAadhaar: "",
  panNumber: "",
  nameAsPerPan: "",
  bankName: "",
  accountHolderName: "",
  accountNumber: "",
  ifscCode: "",
  highestQualification: "",
  internshipStartDate: "",
  internshipEndDate: "",
  universityOrInstitute: "",
  courseOrProgram: "",
  expectedGraduationDate: "",
  mentorId: "",
  reportingManagerId: "",
  stipendAmount: "",
  stipendFrequency: "monthly",
  createAppLogin: false,
  userRole: "Intern",
  userPassword: "",
  allowedModules: [],
  ...overrides,
});

export const mapInternToForm = (intern: InternDetail): InternFormValues => ({
  ...createEmptyInternForm(),
  employeeCode: intern.employeeCode ?? "",
  name: intern.name ?? "",
  email: intern.email ?? "",
  phone: intern.phone ?? "",
  designation: intern.designation ?? "Intern",
  departmentId:
    refId(intern.department) ||
    (typeof intern.department === "string" ? intern.department : "") ||
    refId(intern.departmentId),
  location: intern.location ?? "",
  dob: dateOnly(intern.dob),
  gender: intern.gender ?? "",
  bloodGroup: intern.bloodGroup ?? "",
  emergencyContact: intern.emergencyContact ?? "",
  fatherHusbandName: intern.fatherHusbandName ?? "",
  relationWithMember: intern.relationWithMember ?? "",
  nationality: intern.nationality ?? "",
  maritalStatus: intern.maritalStatus ?? "",
  permanentAddress: intern.permanentAddress ?? "",
  aadhaarNumber: intern.aadhaarNumber ?? "",
  nameAsPerAadhaar: intern.nameAsPerAadhaar ?? "",
  panNumber: intern.panNumber ?? "",
  nameAsPerPan: intern.nameAsPerPan ?? "",
  bankName: intern.bankName ?? "",
  accountHolderName: intern.accountHolderName ?? "",
  accountNumber: intern.accountNumber ?? "",
  ifscCode: intern.ifscCode ?? "",
  highestQualification: intern.highestQualification ?? "",
  internshipStartDate: dateOnly(intern.internshipStartDate),
  internshipEndDate: dateOnly(intern.internshipEndDate),
  universityOrInstitute: intern.universityOrInstitute ?? "",
  courseOrProgram: intern.courseOrProgram ?? "",
  expectedGraduationDate: dateOnly(intern.expectedGraduationDate),
  mentorId: refId(intern.mentorId),
  reportingManagerId: refId(intern.reportingManagerId),
  stipendAmount:
    intern.stipendAmount === null || intern.stipendAmount === undefined
      ? ""
      : String(intern.stipendAmount),
  stipendFrequency: intern.stipendFrequency || "monthly",
  createAppLogin: false,
  userRole: intern.userRole || intern.linkedUser?.role || "Intern",
  userPassword: "",
  allowedModules: intern.linkedUser?.allowedModules
    ? [...intern.linkedUser.allowedModules]
    : [],
});

export const buildInternFormPayload = (
  values: InternFormValues,
  extras: {
    hasAppLogin?: boolean;
    createAppLogin?: boolean;
  } = {},
): Record<string, unknown> => {
  const data: Record<string, unknown> = { ...values };

  if (values.stipendAmount !== "" && values.stipendAmount != null) {
    data.stipendAmount = Number(values.stipendAmount);
  } else {
    delete data.stipendAmount;
  }

  if (extras.createAppLogin === true) {
    data.createAppLogin = true;
  } else if (!extras.hasAppLogin) {
    data.createAppLogin = values.createAppLogin;
  }

  return buildInternPayload(data);
};