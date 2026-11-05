/** Keep in sync with AameegoGig-Frontend/src/utils/employeeCodeFormat.js */
export const EMPLOYEE_CODE_PATTERN = /^(?:[A-Z]{1,10}-?)?[0-9]{1,8}$/;
export const EMPLOYEE_CODE_MAX_LENGTH = 20;
export const EMPLOYEE_CODE_HINT =
  "Employee codes must be formatted as EMP-26 or EMP26 or 26.";

export const maskEmployeeCode = (raw: string): string => {
  const src = String(raw ?? "").toUpperCase();
  let letters = "";
  let hyphen = false;
  let digits = "";
  for (const ch of src) {
    if (ch >= "A" && ch <= "Z") {
      if (digits.length === 0 && letters.length < 10) letters += ch;
    } else if (ch === "-") {
      if (!hyphen && digits.length === 0 && letters.length > 0) hyphen = true;
    } else if (ch >= "0" && ch <= "9") {
      if (digits.length < 8) digits += ch;
    }
  }
  return `${letters}${hyphen ? "-" : ""}${digits}`;
};
