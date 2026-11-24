/** Keep in sync with AameegoGig-Frontend/src/utils/employeeCodeFormat.js */
export const EMPLOYEE_CODE_PATTERN = /^(?:[A-Z]{1,10}-?)?[0-9]{1,8}$/;
export const EMPLOYEE_CODE_MAX_LENGTH = 20;
export const EMPLOYEE_CODE_HINT =
  "Employee codes must be formatted as EMP-26 or EMP26 or 26.";

/**
 * Only uppercases and drops characters a code can never hold; the format itself is
 * reported by validation (EMPLOYEE_CODE_HINT) instead of silently rewriting what was
 * typed, e.g. QA-EMP-0142 used to become QAEMP-0142 (EMP-FN-19).
 */
export const maskEmployeeCode = (raw: string): string =>
  String(raw ?? "")
    .toUpperCase()
    .replace(/[^A-Z0-9-]/g, "")
    .slice(0, EMPLOYEE_CODE_MAX_LENGTH);
