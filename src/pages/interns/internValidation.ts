import {
  EMPLOYEE_CODE_HINT,
  EMPLOYEE_CODE_MAX_LENGTH,
  EMPLOYEE_CODE_PATTERN,
} from "../employees/employeeCodeFormat";
import { validateEmployeeField } from "../employees/employeeValidation";
import type { EmployeeFormValues } from "../employees/employeeForm";
import type { InternFormValues } from "./internForm";
import {
  hasStipendData,
  MAX_MONTHLY_STIPEND,
  validateStipendDraft,
} from "../../services/internService";

export const MIN_INTERN_AGE = 14;

const PATTERNS = {
  EMAIL: /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/,
  PHONE_IN: /^[0-9]{10}$/,
  PERSON_NAME: /^[A-Za-z][\sA-Za-z.]*$/,
};

const isNotAllZeros = (value: string): boolean => {
  const digits = String(value).replace(/\D/g, "");
  if (!digits) return true;
  return !/^0+$/.test(digits);
};

const isValidEmailFormat = (value: string): boolean => {
  const v = value.trim().toLowerCase();
  if (!v || v.length > 254 || /\s/.test(v)) return false;
  if (!PATTERNS.EMAIL.test(v)) return false;
  const [, domain] = v.split("@");
  if (!domain || !domain.includes(".")) return false;
  const tld = domain.split(".").pop() || "";
  return tld.length >= 2;
};

const todayStart = (): Date => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
};

export const getMaxInternDobInputValue = (): string => {
  const maxDob = todayStart();
  maxDob.setFullYear(maxDob.getFullYear() - MIN_INTERN_AGE);
  return maxDob.toISOString().slice(0, 10);
};

export const getMinInternshipEndInputValue = (startDate: string): string => {
  const today = todayStart();
  const start = startDate ? new Date(startDate) : null;
  const min =
    start && !Number.isNaN(start.getTime()) && start > today ? start : today;
  return min.toISOString().slice(0, 10);
};

export type InternFormErrors = Partial<Record<keyof InternFormValues, string>>;

export const validateInternField = (
  name: keyof InternFormValues,
  values: InternFormValues,
): string | null => {
  const v = values[name];

  switch (name) {
    case "employeeCode": {
      const code = String(v ?? "").trim().toUpperCase();
      if (!code) return null;
      if (code.length > EMPLOYEE_CODE_MAX_LENGTH) {
        return `Employee Code must be at most ${EMPLOYEE_CODE_MAX_LENGTH} characters`;
      }
      if (!EMPLOYEE_CODE_PATTERN.test(code)) return EMPLOYEE_CODE_HINT;
      const digits = code.replace(/\D/g, "");
      if (!digits.length || /^0+$/.test(digits)) {
        return "Employee Code must contain at least one non-zero digit";
      }
      return null;
    }
    case "name": {
      const nameVal = String(v ?? "").trim();
      if (!nameVal) return "Full name is required";
      if (nameVal.length > 100) return "Name must be at most 100 characters";
      if (!PATTERNS.PERSON_NAME.test(nameVal)) {
        return "Name must start with a letter and contain no numbers";
      }
      return null;
    }
    case "email": {
      const email = String(v ?? "").trim().toLowerCase();
      if (!email) return null;
      if (!isValidEmailFormat(email)) return "Enter a valid email";
      return null;
    }
    case "phone": {
      const phone = String(v ?? "").trim();
      if (!phone) return null;
      if (!PATTERNS.PHONE_IN.test(phone)) {
        return "Phone number must be exactly 10 digits";
      }
      if (!isNotAllZeros(phone)) return "Phone number cannot be all zeros";
      return null;
    }
    case "departmentId":
      return String(v ?? "").trim() ? null : "Department is required";
    case "mentorId":
      return null;
    case "reportingManagerId": {
      const manager = String(v ?? "").trim();
      const mentor = String(values.mentorId ?? "").trim();
      if (manager && mentor && manager === mentor) {
        return "Mentor and reporting manager must be different";
      }
      return null;
    }
    case "dob": {
      const dob = String(v ?? "").trim();
      if (!dob) return null;
      const d = new Date(dob);
      if (Number.isNaN(d.getTime())) return "Enter a valid date of birth";
      d.setHours(0, 0, 0, 0);
      if (d > todayStart()) return "Date of birth cannot be in the future";
      const maxDob = todayStart();
      maxDob.setFullYear(maxDob.getFullYear() - MIN_INTERN_AGE);
      if (d > maxDob) {
        return `Intern must be at least ${MIN_INTERN_AGE} years old`;
      }
      return null;
    }
    case "emergencyContact": {
      const c = String(v ?? "").trim();
      if (!c) return null;
      if (!PATTERNS.PHONE_IN.test(c)) {
        return "Emergency contact must be exactly 10 digits";
      }
      if (!isNotAllZeros(c)) return "Emergency contact cannot be all zeros";
      return null;
    }
    case "internshipStartDate": {
      const start = String(v ?? "").trim();
      if (!start) return "Start date is required";
      const d = new Date(start);
      if (Number.isNaN(d.getTime())) return "Enter a valid start date";
      return null;
    }
    case "internshipEndDate": {
      const endStr = String(v ?? "").trim();
      if (!endStr) return "End date is required";
      const end = new Date(endStr);
      if (Number.isNaN(end.getTime())) return "Enter a valid end date";
      end.setHours(0, 0, 0, 0);
      if (end < todayStart()) return "End date cannot be in the past";
      const startStr = String(values.internshipStartDate ?? "").trim();
      if (startStr) {
        const start = new Date(startStr);
        start.setHours(0, 0, 0, 0);
        if (!Number.isNaN(start.getTime()) && end <= start) {
          return "End date must be after the start date";
        }
      }
      return null;
    }
    // Same rules as the employee form (INT-FN-01).
    case "aadhaarNumber":
    case "panNumber":
    case "accountNumber":
    case "ifscCode":
    case "nameAsPerAadhaar":
    case "nameAsPerPan":
    case "fatherHusbandName":
      return validateEmployeeField(name, { [name]: v } as unknown as EmployeeFormValues);
    case "expectedGraduationDate": {
      const grad = String(v ?? "").trim();
      if (!grad) return null;
      const g = new Date(grad);
      if (Number.isNaN(g.getTime())) return "Enter a valid graduation date";
      const dob = new Date(String(values.dob ?? ""));
      if (!Number.isNaN(dob.getTime())) {
        const minGrad = new Date(dob);
        minGrad.setFullYear(minGrad.getFullYear() + MIN_INTERN_AGE);
        if (g < minGrad) return "Graduation date is too close to the date of birth";
      }
      const start = new Date(String(values.internshipStartDate ?? ""));
      if (!Number.isNaN(start.getTime())) {
        const earliest = new Date(start);
        earliest.setFullYear(earliest.getFullYear() - 1);
        if (g < earliest) {
          return "Graduation date cannot be more than a year before the internship starts";
        }
      }
      return null;
    }
    case "stipendAmount": {
      const draft = {
        monthlyStipend: values.stipendAmount,
        stipendFrequency: values.stipendFrequency,
      };
      if (!hasStipendData(draft)) return null;
      const err = validateStipendDraft(draft);
      return err || null;
    }
    case "stipendFrequency": {
      const freq = String(v ?? "monthly");
      if (
        !["monthly", "weekly", "daily", "lump-sum"].includes(freq)
      ) {
        return "Invalid stipend frequency";
      }
      return null;
    }
    case "userPassword": {
      if (!values.createAppLogin) return null;
      const pw = String(v ?? "");
      if (pw && pw.length < 6) return "Password must be at least 6 characters";
      return null;
    }
    default:
      return null;
  }
};

export const collectInternFormErrors = (
  values: InternFormValues,
  options: { hasExistingAppLogin?: boolean } = {},
): InternFormErrors => {
  const keys: (keyof InternFormValues)[] = [
    "employeeCode",
    "name",
    "email",
    "phone",
    "departmentId",
    "dob",
    "emergencyContact",
    "internshipStartDate",
    "internshipEndDate",
    "mentorId",
    "reportingManagerId",
    "aadhaarNumber",
    "panNumber",
    "accountNumber",
    "ifscCode",
    "nameAsPerAadhaar",
    "nameAsPerPan",
    "fatherHusbandName",
    "expectedGraduationDate",
    "stipendAmount",
    "stipendFrequency",
    "userPassword",
  ];

  const errors: InternFormErrors = {};
  for (const name of keys) {
    const err = validateInternField(name, values);
    if (err) errors[name] = err;
  }

  const creatingNewLogin =
    values.createAppLogin && !options.hasExistingAppLogin;
  if (
    creatingNewLogin &&
    !String(values.email || "").trim() &&
    !String(values.phone || "").trim()
  ) {
    errors.email = "Email or phone is required for app login";
  }

  return errors;
};

export type ValidateInternFormResult = {
  valid: boolean;
  errors: InternFormErrors;
};

export const validateInternForm = (
  values: InternFormValues,
  options: { hasExistingAppLogin?: boolean } = {},
): ValidateInternFormResult => {
  const errors = collectInternFormErrors(values, options);
  return { valid: Object.keys(errors).length === 0, errors };
};

export { MAX_MONTHLY_STIPEND };