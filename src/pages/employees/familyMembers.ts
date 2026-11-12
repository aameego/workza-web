/** Keep in sync with AameegoGig-Frontend/src/utils/familyMembers.js */

export const FAMILY_RELATIONS = [
  "Spouse",
  "Husband",
  "Wife",
  "Son",
  "Daughter",
  "Father",
  "Mother",
  "Father-in-law",
  "Mother-in-law",
  "Brother",
  "Sister",
  "Other",
] as const;

export type FamilyRelation = (typeof FAMILY_RELATIONS)[number];

export const FAMILY_COVERAGE_OPTIONS = [
  { value: "ESIC", label: "ESIC" },
  { value: "MEDICAL", label: "Medical Insurance" },
  { value: "BOTH", label: "Both (ESIC & Medical)" },
] as const;

export type FamilyCoverage = (typeof FAMILY_COVERAGE_OPTIONS)[number]["value"];

export const MAX_FAMILY_MEMBERS = 10;

const PERSON_NAME = /^[A-Za-z][\sA-Za-z.]*$/;
const SPOUSE_RELATIONS = new Set(["Spouse", "Husband", "Wife"]);
const SINGLE_ENTRY_RELATIONS = new Set(["Father", "Mother"]);
const COVERAGE_VALUES = new Set(FAMILY_COVERAGE_OPTIONS.map((o) => o.value));

export type FamilyMemberForm = {
  name: string;
  relation: string;
  dob: string;
  coverage: string;
};

export type FamilyFieldError = {
  field: string;
  message: string;
  inputs?: string[];
};

export const familyFieldPath = (index: number, field: string) =>
  `familyMembers.${index}.${field}`;

export const toDateOnly = (value: unknown): string => {
  if (value === undefined || value === null || value === "") return "";
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? "" : value.toISOString().slice(0, 10);
  }
  const str = String(value).trim();
  if (/^\d{4}-\d{2}-\d{2}/.test(str)) return str.slice(0, 10);
  const d = new Date(str);
  return Number.isNaN(d.getTime()) ? "" : d.toISOString().slice(0, 10);
};

export const localToday = (now = new Date()) =>
  `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;

export const createEmptyFamilyMember = (): FamilyMemberForm => ({
  name: "",
  relation: "",
  dob: "",
  coverage: "",
});

/** Maps API members (dob as ISO Date string) to editable form rows. */
export const familyMembersToForm = (
  members: Array<{
    name?: string;
    relation?: string;
    dob?: string | null;
    coverage?: string;
  }> | null | undefined,
): FamilyMemberForm[] =>
  (Array.isArray(members) ? members : []).map((m) => ({
    name: m?.name || "",
    relation: m?.relation || "",
    dob: toDateOnly(m?.dob),
    coverage: m?.coverage || "",
  }));

const isRowEmpty = (m: FamilyMemberForm) =>
  !String(m?.name || "").trim() &&
  !m?.relation &&
  !toDateOnly(m?.dob) &&
  !m?.coverage;

export const validateFamilyMembers = (
  input: FamilyMemberForm[] | null | undefined,
  {
    today = localToday(),
    keepBlankRows = false,
  }: {
    today?: string;
    /** Form submit: a row the user added but left blank is an error, not silently dropped (EMP-FN-04). */
    keepBlankRows?: boolean;
  } = {},
): { members: FamilyMemberForm[]; errors: FamilyFieldError[] } => {
  if (input === undefined || input === null) return { members: [], errors: [] };
  if (!Array.isArray(input)) {
    return {
      members: [],
      errors: [{ field: "familyMembers", message: "Family members must be a list" }],
    };
  }

  const rows = input
    .map((raw, index) => ({ raw, index }))
    .filter(({ raw }) => keepBlankRows || !isRowEmpty(raw));
  const errors: FamilyFieldError[] = [];

  if (rows.length > MAX_FAMILY_MEMBERS) {
    errors.push({
      field: "familyMembers",
      message: `You can add at most ${MAX_FAMILY_MEMBERS} family members`,
    });
  }

  const checked = rows.map(({ raw, index }) => {
    const n = index + 1;
    const name = String(raw?.name || "")
      .trim()
      .replace(/\s+/g, " ");
    const relation = String(raw?.relation || "").trim();
    const dob = toDateOnly(raw?.dob);
    const coverage = String(raw?.coverage || "").trim().toUpperCase();

    if (!name) {
      errors.push({
        field: familyFieldPath(index, "name"),
        message: `Family member ${n} name is required`,
      });
    } else if (!PERSON_NAME.test(name)) {
      errors.push({
        field: familyFieldPath(index, "name"),
        message: `Family member ${n} name must start with a letter and contain no numbers`,
      });
    }

    if (!relation) {
      errors.push({
        field: familyFieldPath(index, "relation"),
        message: `Family member ${n} relation is required`,
      });
    } else if (!(FAMILY_RELATIONS as readonly string[]).includes(relation)) {
      errors.push({
        field: familyFieldPath(index, "relation"),
        message: `Family member ${n} relation is invalid`,
      });
    }

    const rawDobPresent =
      raw?.dob !== undefined && raw?.dob !== null && String(raw.dob).trim() !== "";
    if (!dob) {
      errors.push({
        field: familyFieldPath(index, "dob"),
        message: rawDobPresent
          ? `Family member ${n} date of birth must be a valid date`
          : `Family member ${n} date of birth is required`,
      });
    } else if (dob > today) {
      errors.push({
        field: familyFieldPath(index, "dob"),
        message: `Family member ${n} date of birth cannot be in the future`,
      });
    } else if (dob < "1900-01-01") {
      errors.push({
        field: familyFieldPath(index, "dob"),
        message: `Family member ${n} date of birth must be after 1900`,
      });
    }

    if (!coverage) {
      errors.push({
        field: familyFieldPath(index, "coverage"),
        message: `Family member ${n}: choose ESIC, Medical Insurance or Both`,
      });
    } else if (!COVERAGE_VALUES.has(coverage as FamilyCoverage)) {
      errors.push({
        field: familyFieldPath(index, "coverage"),
        message: `Family member ${n} coverage is invalid`,
      });
    }

    return { index, member: { name, relation, dob, coverage } };
  });

  let spouseSeen = false;
  const singleSeen = new Set<string>();
  const personSeen = new Set<string>();
  checked.forEach(({ index, member: m }) => {
    const n = index + 1;
    const relationField = familyFieldPath(index, "relation");
    if (SPOUSE_RELATIONS.has(m.relation)) {
      if (spouseSeen) {
        errors.push({
          field: relationField,
          message: `Family member ${n}: only one spouse can be added`,
          inputs: [relationField],
        });
      }
      spouseSeen = true;
    }
    if (SINGLE_ENTRY_RELATIONS.has(m.relation)) {
      if (singleSeen.has(m.relation)) {
        errors.push({
          field: relationField,
          message: `Family member ${n}: ${m.relation} is already added`,
          inputs: [relationField],
        });
      }
      singleSeen.add(m.relation);
    }
    if (m.name && m.dob) {
      const key = `${m.name.toLowerCase()}|${m.dob}`;
      if (personSeen.has(key)) {
        errors.push({
          field: familyFieldPath(index, "name"),
          message: `Family member ${n} is a duplicate of an earlier entry`,
          inputs: [
            familyFieldPath(index, "name"),
            familyFieldPath(index, "dob"),
          ],
        });
      }
      personSeen.add(key);
    }
  });

  return { members: checked.map(({ member }) => member), errors };
};

export const familyMemberErrorMap = (
  input: FamilyMemberForm[] | null | undefined,
  options?: { today?: string },
): Record<string, string> => {
  const { errors } = validateFamilyMembers(input, { ...options, keepBlankRows: true });
  return errors.reduce<Record<string, string>>((acc, { field, message }) => {
    if (!acc[field]) acc[field] = message;
    return acc;
  }, {});
};
