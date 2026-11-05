import {
  EMPLOYEE_CODE_HINT,
  EMPLOYEE_CODE_MAX_LENGTH,
  EMPLOYEE_CODE_PATTERN,
} from "./employeeCodeFormat";
import type { EmployeeFormValues } from "./employeeForm";
import { familyMemberErrorMap } from "./familyMembers";

export const MIN_EMPLOYEE_AGE = 18;

const PATTERNS = {
  EMAIL: /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/,
  PHONE_IN: /^[0-9]{10}$/,
  AADHAAR: /^[0-9]{12}$/,
  PAN: /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/,
  IFSC: /^[A-Z]{4}0[A-Z0-9]{6}$/,
  UAN: /^[0-9]{12}$/,
  ESIC: /^[0-9]{10}$/,
  BANK_ACCOUNT: /^[0-9]{9,18}$/,
  PERSON_NAME: /^[A-Za-z][\sA-Za-z.]*$/,
};

const isValidEmailFormat = (value: string) => {
  const v = value.trim().toLowerCase();
  if (!v || v.length > 254 || /\s/.test(v)) return false;
  if (!PATTERNS.EMAIL.test(v)) return false;
  const [, domain] = v.split("@");
  if (!domain || !domain.includes(".")) return false;
  const tld = domain.split(".").pop() || "";
  return tld.length >= 2;
};

export const getMaxDateOfBirth = () => {
  const maxDob = new Date();
  maxDob.setHours(0, 0, 0, 0);
  maxDob.setFullYear(maxDob.getFullYear() - MIN_EMPLOYEE_AGE);
  return maxDob;
};

export const getMaxDateOfBirthInputValue = () =>
  getMaxDateOfBirth().toISOString().slice(0, 10);

const emptyToNull = (value: string) => {
  const t = String(value ?? "").trim();
  return t === "" ? null : t;
};

const optionalPersonName = (label: string, value: string): string | null => {
  const v = String(value ?? "").trim();
  if (!v) return null;
  if (!PATTERNS.PERSON_NAME.test(v)) {
    return `${label} must start with a letter and contain no numbers`;
  }
  return null;
};

/** Validate a single field (blur / change). Returns error message or null. */
export const validateEmployeeField = (
  name: keyof EmployeeFormValues | string,
  values: EmployeeFormValues,
): string | null => {
  const v = values[name as keyof EmployeeFormValues];

  switch (name) {
    case "employeeCode": {
      const code = emptyToNull(String(v ?? ""));
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
      if (!nameVal) return "Name is required";
      if (!PATTERNS.PERSON_NAME.test(nameVal)) {
        return "Name must start with a letter and contain no numbers";
      }
      return null;
    }
    case "email": {
      const email = emptyToNull(String(v ?? "").toLowerCase());
      if (!email) return null;
      if (!isValidEmailFormat(email)) return "Invalid email format";
      return null;
    }
    case "phone": {
      const phone = emptyToNull(String(v ?? ""));
      if (!phone) return null;
      if (!PATTERNS.PHONE_IN.test(phone)) {
        return "Phone number must be exactly 10 digits";
      }
      return null;
    }
    case "designation":
      return String(v ?? "").trim() ? null : "Designation is required";
    case "departmentId":
      return String(v ?? "").trim() ? null : "Department is required.";
    case "dateOfJoining":
      return String(v ?? "").trim() ? null : "Date of joining is required";
    case "dob": {
      const dob = emptyToNull(String(v ?? ""));
      if (!dob) return null;
      const d = new Date(dob);
      if (Number.isNaN(d.getTime())) return "Invalid date of birth";
      d.setHours(0, 0, 0, 0);
      if (d > new Date()) return "Date of birth cannot be in the future";
      if (d > getMaxDateOfBirth()) {
        return `Employee must be at least ${MIN_EMPLOYEE_AGE} years old`;
      }
      return null;
    }
    case "fatherHusbandName":
      return optionalPersonName("Father / Husband Name", String(v ?? ""));
    case "nameAsPerAadhaar":
      return optionalPersonName("Name as on Aadhaar", String(v ?? ""));
    case "nameAsPerPan":
      return optionalPersonName("Name as on PAN", String(v ?? ""));
    case "aadhaarNumber": {
      const a = emptyToNull(String(v ?? "").replace(/\s/g, ""));
      if (!a) return null;
      if (!PATTERNS.AADHAAR.test(a)) {
        return "Aadhaar number must be exactly 12 digits";
      }
      return null;
    }
    case "panNumber": {
      const p = emptyToNull(String(v ?? "").toUpperCase());
      if (!p) return null;
      if (!PATTERNS.PAN.test(p)) return "Invalid PAN card format";
      return null;
    }
    case "uan": {
      const u = emptyToNull(String(v ?? "").replace(/\s/g, ""));
      if (!u) return null;
      if (!PATTERNS.UAN.test(u)) return "UAN must be exactly 12 digits";
      return null;
    }
    case "esicNumber": {
      const e = emptyToNull(String(v ?? "").replace(/\s/g, ""));
      if (!e) return null;
      if (!PATTERNS.ESIC.test(e)) return "ESIC number must be exactly 10 digits";
      return null;
    }
    case "accountNumber": {
      const a = emptyToNull(String(v ?? "").replace(/\s/g, ""));
      if (!a) return null;
      if (!PATTERNS.BANK_ACCOUNT.test(a)) return "Invalid account number length";
      return null;
    }
    case "ifscCode": {
      const i = emptyToNull(String(v ?? "").toUpperCase());
      if (!i) return null;
      if (!PATTERNS.IFSC.test(i)) return "Invalid IFSC code format";
      return null;
    }
    case "monthlyConsultancyPay": {
      if (!values.isConsultancy) return null;
      const n = Number(v);
      if (!Number.isFinite(n) || n <= 0) {
        return "Monthly Consultancy Pay must be greater than ₹0.";
      }
      return null;
    }
    case "tdsPercent": {
      if (v === "" || v === null || v === undefined) return null;
      const n = Number(v);
      if (!Number.isFinite(n) || n < 0 || n > 100) {
        return "TDS must be between 0% and 100%.";
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

export type EmployeeFormErrors = Record<string, string>;

/** Full-form validation for submit — CRA collectEmployeeFormErrors equivalent */
export const collectEmployeeFormErrors = (
  values: EmployeeFormValues,
): EmployeeFormErrors => {
  const fieldNames: (keyof EmployeeFormValues)[] = [
    "employeeCode",
    "name",
    "email",
    "phone",
    "designation",
    "departmentId",
    "dateOfJoining",
    "dob",
    "fatherHusbandName",
    "nameAsPerAadhaar",
    "nameAsPerPan",
    "aadhaarNumber",
    "panNumber",
    "uan",
    "esicNumber",
    "accountNumber",
    "ifscCode",
    "monthlyConsultancyPay",
    "tdsPercent",
    "userPassword",
  ];

  const errors: EmployeeFormErrors = {};
  for (const name of fieldNames) {
    const err = validateEmployeeField(name, values);
    if (err) errors[name] = err;
  }

  if (
    values.createAppLogin &&
    !String(values.email || "").trim() &&
    !String(values.phone || "").trim()
  ) {
    errors.email = "Email or phone is required for app login";
  }

  return { ...errors, ...familyMemberErrorMap(values.familyMembers) };
};
