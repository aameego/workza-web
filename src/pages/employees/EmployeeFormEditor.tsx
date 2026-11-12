import {
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type FormEvent,
} from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Trash2 } from "lucide-react";
import {
  Button,
  Card,
  Field,
  Input,
  Select,
  TextArea,
  SearchableSelect,
  cn,
} from "../../design-system";
import { useDepartmentNames } from "../../hooks/useDepartmentNames";
import {
  useAddEmployee,
  useEmployees,
  useUpdateEmployee,
} from "../../hooks/useEmployees";
import { readSessionUser } from "../../layouts/sessionUser";
import { ApiError } from "../../lib/apiClient";
import { saveEmployeeStructure } from "../../services/employeeSalaryService";
import { maskEmployeeCode } from "./employeeCodeFormat";
import {
  APP_ROLE_OPTIONS,
  BLOOD_GROUP_OPTIONS,
  GENDER_OPTIONS,
  MARITAL_OPTIONS,
  PAY_TYPE_OPTIONS,
  RELATION_OPTIONS,
  buildEmployeePayload,
  type EmployeeFormValues,
} from "./employeeForm";
import EmployeeSalaryStructureEditor, {
  type SalaryEditorHandle,
} from "./EmployeeSalaryStructureEditor";
import {
  FAMILY_COVERAGE_OPTIONS,
  FAMILY_RELATIONS,
  MAX_FAMILY_MEMBERS,
  createEmptyFamilyMember,
  type FamilyMemberForm,
} from "./familyMembers";
import {
  collectEmployeeFormErrors,
  getMaxDateOfBirthInputValue,
  validateEmployeeField,
} from "./employeeValidation";
import {
  hasSalaryData,
  validateStructureDraft,
  type SalaryDraft,
} from "./salaryValidation";

type FormErrors = Record<string, string>;

export type EmployeeFormEditorProps = {
  mode: "create" | "edit";
  initialValues: EmployeeFormValues;
  employeeId?: string;
  /** Existing linked app login (edit only). */
  hasAppLogin?: boolean;
  cancelTo?: string;
};

/** Figma Nationality dropdown (EMP-UI-15); a saved value outside the list is still shown. */
const NATIONALITIES = ["Indian", "Nepali", "Bangladeshi", "Sri Lankan", "Bhutanese", "Other"];

export default function EmployeeFormEditor({
  mode,
  initialValues,
  employeeId,
  hasAppLogin = false,
  cancelTo,
}: EmployeeFormEditorProps) {
  const navigate = useNavigate();
  const { vendorSlug } = useParams();

  const user = readSessionUser();
  const vendorId = user?.vendorId || null;
  const base = `/${vendorSlug || "app"}`;
  const listPath = `${base}/employees`;
  const cancelPath = cancelTo || listPath;

  const [form, setForm] = useState<EmployeeFormValues>(initialValues);
  const [errors, setErrors] = useState<FormErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [salaryDraft, setSalaryDraft] = useState<SalaryDraft | null>(null);
  const salaryEditorRef = useRef<SalaryEditorHandle>(null);

  const { data: departments = [] } = useDepartmentNames(vendorId);
  const { data: managerData } = useEmployees(
    { page: 1, limit: 500, isPagination: "true", isConsultancy: false },
    Boolean(vendorId),
  );
  const managers = managerData?.employees ?? [];
  // Only people still employed can supervise (EMP-FN-06); keep a current pick visible on edit.
  const managerOptions = (current: string) =>
    managers
      .filter(
        (m) =>
          m._id === current ||
          (m.isActive !== false && !m.isExited && !m.isDeleted && m._id !== employeeId),
      )
      .map((m) => ({
        value: m._id,
        label: m.employeeCode ? `${m.name} (${m.employeeCode})` : m.name || "Employee",
      }));
  const addMutation = useAddEmployee();
  const updateMutation = useUpdateEmployee();
  const saving =
    mode === "create" ? addMutation.isPending : updateMutation.isPending;

  const maxDob = useMemo(() => getMaxDateOfBirthInputValue(), []);
  const isEdit = mode === "edit";
  const showAppLoginFields = form.createAppLogin || (isEdit && hasAppLogin);

  const setField = <K extends keyof EmployeeFormValues>(
    name: K,
    value: EmployeeFormValues[K],
  ) => {
    setForm((prev) => {
      const next = { ...prev, [name]: value };
      const err = validateEmployeeField(name, next);
      setErrors((prevErr) => {
        const copy = { ...prevErr };
        if (err) copy[name as string] = err;
        else delete copy[name as string];
        return copy;
      });
      return next;
    });
  };

  /** Digits-only fields and their max length (EMP-FN-08: letters were accepted while typing). */
  const DIGIT_FIELDS: Record<string, number> = {
    phone: 10,
    emergencyContact: 10,
    aadhaarNumber: 12,
    uan: 12,
    esicNumber: 10,
    accountNumber: 18,
  };

  const onTextChange =
    (name: keyof EmployeeFormValues) =>
    (
      e: ChangeEvent<
        HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
      >,
    ) => {
      let value = e.target.value;
      if (name === "employeeCode") value = maskEmployeeCode(value);
      const maxDigits = DIGIT_FIELDS[name as string];
      if (maxDigits) value = value.replace(/\D/g, "").slice(0, maxDigits);
      if (name === "panNumber" || name === "ifscCode") {
        value = value.toUpperCase();
      }
      setField(name, value as EmployeeFormValues[typeof name]);
    };

  const updateFamilyMember = (
    index: number,
    key: keyof FamilyMemberForm,
    value: string,
  ) => {
    setForm((prev) => {
      const familyMembers = prev.familyMembers.map((m, i) =>
        i === index ? { ...m, [key]: value } : m,
      );
      return { ...prev, familyMembers };
    });
    setErrors((prev) => {
      const next = { ...prev };
      delete next[`familyMembers.${index}.${key}`];
      delete next.familyMembers;
      return next;
    });
  };

  const addFamilyMember = () => {
    setForm((prev) => {
      if (prev.familyMembers.length >= MAX_FAMILY_MEMBERS) return prev;
      return {
        ...prev,
        familyMembers: [...prev.familyMembers, createEmptyFamilyMember()],
      };
    });
  };

  const removeFamilyMember = (index: number) => {
    setForm((prev) => ({
      ...prev,
      familyMembers: prev.familyMembers.filter((_, i) => i !== index),
    }));
    setErrors((prev) => {
      const next: FormErrors = {};
      Object.entries(prev).forEach(([k, v]) => {
        if (k === "familyMembers" || k.startsWith("familyMembers.")) return;
        next[k] = v;
      });
      return next;
    });
  };

  const scrollToFirstError = (errs: FormErrors) => {
    const first = Object.keys(errs)[0];
    if (!first) return;
    const el =
      document.getElementById(`emp-${first}`) ||
      document.querySelector(`[name="${first}"]`);
    el?.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (saving) return;

    const formErrors = collectEmployeeFormErrors(form, {
      hasExistingAppLogin: isEdit && hasAppLogin,
    });
    if (Object.keys(formErrors).length) {
      setErrors(formErrors);
      setFormError(null);
      scrollToFirstError(formErrors);
      return;
    }

    setErrors({});
    setFormError(null);

    const showSalary = !form.isConsultancy;
    const draftFromEditor = salaryEditorRef.current?.getDraft?.() || salaryDraft;
    if (showSalary && hasSalaryData(draftFromEditor)) {
      const salaryErrors = isEdit
        ? [
            salaryEditorRef.current?.validateStructure?.() || "",
          ].filter(Boolean)
        : validateStructureDraft(draftFromEditor);
      if (salaryErrors.length) {
        setFormError(salaryErrors[0]);
        document
          .getElementById("emp-salary-structure")
          ?.scrollIntoView({ behavior: "smooth", block: "center" });
        return;
      }
    }

    try {
      const creatingLogin =
        form.createAppLogin && !(isEdit && hasAppLogin);
      const payload = buildEmployeePayload(form, {
        createAppLogin: creatingLogin,
        hasAppLogin: isEdit && hasAppLogin,
      });

      if (isEdit) {
        if (!employeeId) throw new Error("Missing employee id");
        await updateMutation.mutateAsync({ id: employeeId, data: payload });
        if (
          showSalary &&
          salaryEditorRef.current?.hasUnsavedChanges()
        ) {
          try {
            await salaryEditorRef.current.saveStructure();
          } catch {
            setFormError(
              "Employee updated, but salary structure could not be saved. Open the salary section and try again.",
            );
            return;
          }
        }
        navigate(`${base}/employees/${employeeId}`);
      } else {
        const created = await addMutation.mutateAsync(payload);
        const newId =
          created?.employee?._id ||
          (created as { _id?: string } | undefined)?._id;
        if (showSalary && newId && hasSalaryData(draftFromEditor)) {
          try {
            const draft = draftFromEditor!;
            const wt = String(draft.wageType || form.payType || "MONTHLY").toUpperCase();
            if (wt === "DAILY") {
              await saveEmployeeStructure(newId, {
                wageType: "DAILY",
                dailyWage: Number(draft.dailyWage) || 0,
                components: (draft.components || []) as never,
                structureId: draft.structureId || undefined,
                revisionType: "Initial",
                revisionReason: "Initial setup",
              });
            } else if (wt === "CALENDAR_DAILY") {
              await saveEmployeeStructure(newId, {
                wageType: "CALENDAR_DAILY",
                dailyWage: Number(draft.dailyWage) || 0,
                structureId: draft.structureId || undefined,
                components: (draft.components || []) as never,
                revisionType: "Initial",
                revisionReason: "Initial setup",
              });
            } else {
              await saveEmployeeStructure(newId, {
                wageType: "MONTHLY",
                ctcAnnual: Number(draft.ctcAnnual) || 0,
                structureId: draft.structureId || undefined,
                components: (draft.components || []) as never,
                revisionType: "Initial",
                revisionReason: "Initial setup",
              });
            }
          } catch {
            setFormError(
              "Employee created, but salary structure could not be saved. You can assign it from Edit Employee.",
            );
            navigate(`${base}/employees/${newId}/edit`);
            return;
          }
        }
        navigate(newId ? `${base}/employees/${newId}` : listPath);
      }
    } catch (err) {
      if (err instanceof ApiError) {
        const data = err.data as { field?: string; message?: string } | null;
        if (data?.field) {
          setErrors({ [data.field]: data.message || err.message });
          scrollToFirstError({ [data.field]: data.message || err.message });
        } else {
          setFormError(err.message);
        }
      } else if (err instanceof Error) {
        setFormError(err.message);
      } else {
        setFormError(
          isEdit ? "Failed to update employee" : "Failed to add employee",
        );
      }
    }
  };

  const submitLabel = isEdit
    ? "Save Changes"
    : form.isConsultancy
      ? "Add Consultant"
      : "Add Employee";
  const cancelLabel = isEdit ? "Cancel Changes" : "Cancel";

  return (
    /* Figma add-employee / edit-employee: same full-page layout, cards 24 apart,
       75px footer bar pinned to the bottom of the workspace. */
    <div className="flex min-w-0 flex-col">
      <form
        className="flex flex-col gap-wz-6"
        onSubmit={onSubmit}
        noValidate
      >
        {/* 1. Basic Information */}
        <Card compact subtle>
          <h2 className="mb-wz-4 mt-0 text-base font-semibold leading-5 text-wz-heading">
            1. Basic Information
          </h2>
          <div className="grid grid-cols-1 gap-x-wz-6 gap-y-wz-6 md:grid-cols-2 xl:grid-cols-3">
            <Field
              label="Employee Code (Leave blank to Auto-generate)"
              htmlFor="emp-employeeCode"
              error={errors.employeeCode}
            >
              <Input
                id="emp-employeeCode"
                name="employeeCode"
                value={form.employeeCode}
                onChange={onTextChange("employeeCode")}
                placeholder="e.g., EMP-0142"
                invalid={Boolean(errors.employeeCode)}
                autoComplete="off"
              />
            </Field>
            <Field
              label="Full Name"
              htmlFor="emp-name"
              required
              error={errors.name}
            >
              <Input
                id="emp-name"
                name="name"
                value={form.name}
                onChange={onTextChange("name")}
                placeholder="e.g., Priya Sharma"
                invalid={Boolean(errors.name)}
                required
              />
            </Field>
            <Field
              label="Email Address"
              htmlFor="emp-email"
              error={errors.email}
              hint={form.createAppLogin ? "Required for app login (or phone)" : undefined}
            >
              <Input
                id="emp-email"
                name="email"
                type="email"
                value={form.email}
                onChange={onTextChange("email")}
                placeholder="e.g., priya.s@workza.com"
                invalid={Boolean(errors.email)}
              />
            </Field>
            <Field
              label="Phone Number"
              htmlFor="emp-phone"
              error={errors.phone}
            >
              <Input
                id="emp-phone"
                name="phone"
                type="tel"
                inputMode="numeric"
                maxLength={10}
                value={form.phone}
                onChange={onTextChange("phone")}
                placeholder="+91 98765 43210"
                invalid={Boolean(errors.phone)}
              />
            </Field>
            <Field
              label="Department"
              htmlFor="emp-departmentId"
              required
              error={errors.departmentId}
            >
              <SearchableSelect
                id="emp-departmentId"
                value={form.departmentId}
                onChange={(v) => setField("departmentId", v)}
                invalid={Boolean(errors.departmentId)}
                placeholder="Select department"
                searchPlaceholder="Search department…"
                options={departments.map((d) => ({ value: d._id, label: d.name }))}
              />
            </Field>
            <Field
              label="Designation"
              htmlFor="emp-designation"
              required
              error={errors.designation}
            >
              <Input
                id="emp-designation"
                name="designation"
                value={form.designation}
                onChange={onTextChange("designation")}
                placeholder="e.g., Software Engineer"
                invalid={Boolean(errors.designation)}
                required
              />
            </Field>
            <Field label="Work Location" htmlFor="emp-location">
              <Input
                id="emp-location"
                name="location"
                value={form.location}
                onChange={onTextChange("location")}
                placeholder="Select office/site"
              />
            </Field>
            <Field label="Reporting Manager" htmlFor="emp-managerId">
              <SearchableSelect
                id="emp-managerId"
                value={form.managerId}
                onChange={(v) => setField("managerId", v)}
                placeholder="Search & select supervisor"
                searchPlaceholder="Search name or code…"
                options={managerOptions(form.managerId)}
              />
            </Field>
            <Field label="People Manager" htmlFor="emp-peopleManagerId">
              <SearchableSelect
                id="emp-peopleManagerId"
                value={form.peopleManagerId}
                onChange={(v) => setField("peopleManagerId", v)}
                placeholder="Search & select supervisor"
                searchPlaceholder="Search name or code…"
                options={managerOptions(form.peopleManagerId)}
              />
            </Field>
            <Field
              label="Date of Joining"
              htmlFor="emp-dateOfJoining"
              required
              error={errors.dateOfJoining}
            >
              <Input
                id="emp-dateOfJoining"
                name="dateOfJoining"
                type="date"
                value={form.dateOfJoining}
                onChange={onTextChange("dateOfJoining")}
                invalid={Boolean(errors.dateOfJoining)}
                required
              />
            </Field>
            <Field label="Date of Birth" htmlFor="emp-dob" error={errors.dob}>
              <Input
                id="emp-dob"
                name="dob"
                type="date"
                value={form.dob}
                max={maxDob}
                onChange={onTextChange("dob")}
                invalid={Boolean(errors.dob)}
              />
            </Field>
          </div>
        </Card>

        {/* 2. Family & Personal */}
        <Card compact subtle>
          <h2 className="mb-wz-4 mt-0 text-base font-semibold leading-5 text-wz-heading">2. Family & Personal</h2>
          <div className="grid grid-cols-1 gap-x-wz-6 gap-y-wz-6 md:grid-cols-2 xl:grid-cols-3">
            <Field
              label="Father / Husband Name"
              htmlFor="emp-fatherHusbandName"
              error={errors.fatherHusbandName}
            >
              <Input
                id="emp-fatherHusbandName"
                name="fatherHusbandName"
                value={form.fatherHusbandName}
                onChange={onTextChange("fatherHusbandName")}
                invalid={Boolean(errors.fatherHusbandName)}
                placeholder="Full Name"
              />
            </Field>
            <Field label="Relationship with Member" htmlFor="emp-relationWithMember">
              <Select
                id="emp-relationWithMember"
                name="relationWithMember"
                value={form.relationWithMember}
                onChange={onTextChange("relationWithMember")}
              >
                <option value="">Select relationship</option>
                {RELATION_OPTIONS.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Gender" htmlFor="emp-gender">
              <Select
                id="emp-gender"
                name="gender"
                value={form.gender}
                onChange={onTextChange("gender")}
              >
                <option value="">Select gender</option>
                {GENDER_OPTIONS.map((g) => (
                  <option key={g} value={g}>
                    {g}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Nationality" htmlFor="emp-nationality">
              <Select
                id="emp-nationality"
                name="nationality"
                value={form.nationality}
                onChange={onTextChange("nationality")}
              >
                <option value="">Select nationality</option>
                {[...NATIONALITIES, ...(form.nationality && !NATIONALITIES.includes(form.nationality) ? [form.nationality] : [])].map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Marital Status" htmlFor="emp-maritalStatus">
              <Select
                id="emp-maritalStatus"
                name="maritalStatus"
                value={form.maritalStatus}
                onChange={onTextChange("maritalStatus")}
              >
                <option value="">Select marital status</option>
                {MARITAL_OPTIONS.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Blood Group" htmlFor="emp-bloodGroup">
              <Select
                id="emp-bloodGroup"
                name="bloodGroup"
                value={form.bloodGroup}
                onChange={onTextChange("bloodGroup")}
              >
                <option value="">e.g., A+ve</option>
                {BLOOD_GROUP_OPTIONS.map((b) => (
                  <option key={b} value={b}>
                    {b}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Emergency Contact Name" htmlFor="emp-emergencyContactName">
              <Input
                id="emp-emergencyContactName"
                name="emergencyContactName"
                value={form.emergencyContactName}
                onChange={onTextChange("emergencyContactName")}
                placeholder="Full Name"
              />
            </Field>
            <Field label="Emergency Contact Number" htmlFor="emp-emergencyContact" error={errors.emergencyContact}>
              <Input
                id="emp-emergencyContact"
                inputMode="numeric"
                name="emergencyContact"
                type="tel"
                value={form.emergencyContact}
                onChange={onTextChange("emergencyContact")}
                placeholder="Contact number"
                invalid={Boolean(errors.emergencyContact)}
              />
            </Field>
          </div>

          <div className="mt-wz-4 flex flex-col gap-wz-4 border-t border-wz-border pt-wz-4">
            <div className="flex flex-wrap items-center justify-between gap-wz-3">
              <h3 className="m-0 text-base leading-5 font-semibold text-wz-heading">
                2.1 Family Members (ESIC / Medical)
              </h3>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={addFamilyMember}
                disabled={form.familyMembers.length >= MAX_FAMILY_MEMBERS}
              >
                Add Family Member
              </Button>
            </div>
            {errors.familyMembers ? (
              <p className="m-0 text-sm text-wz-error">{errors.familyMembers}</p>
            ) : null}
            {form.familyMembers.length === 0 ? (
              <p className="m-0 text-sm text-wz-text-secondary">No family members added.</p>
            ) : (
              form.familyMembers.map((member, index) => (
                <div key={index} className="grid grid-cols-1 items-start gap-wz-4 md:grid-cols-[repeat(2,minmax(0,1fr))_32px] xl:grid-cols-[repeat(4,minmax(0,1fr))_32px]">
                  <Field
                    label={`Family Member ${index + 1} Name`}
                    htmlFor={`emp-familyMembers.${index}.name`}
                    required
                    error={errors[`familyMembers.${index}.name`]}
                  >
                    <Input
                      id={`emp-familyMembers.${index}.name`}
                      value={member.name}
                      onChange={(e) =>
                        updateFamilyMember(index, "name", e.target.value)
                      }
                      invalid={Boolean(errors[`familyMembers.${index}.name`])}
                    />
                  </Field>
                  <Field
                    label="Relationship"
                    htmlFor={`emp-familyMembers.${index}.relation`}
                    required
                    error={errors[`familyMembers.${index}.relation`]}
                  >
                    <Select
                      id={`emp-familyMembers.${index}.relation`}
                      value={member.relation}
                      onChange={(e) =>
                        updateFamilyMember(index, "relation", e.target.value)
                      }
                      invalid={Boolean(
                        errors[`familyMembers.${index}.relation`],
                      )}
                    >
                      <option value="">Select</option>
                      {FAMILY_RELATIONS.map((r) => (
                        <option key={r} value={r}>
                          {r}
                        </option>
                      ))}
                    </Select>
                  </Field>
                  <Field
                    label="Date of Birth"
                    htmlFor={`emp-familyMembers.${index}.dob`}
                    required
                    error={errors[`familyMembers.${index}.dob`]}
                  >
                    <Input
                      id={`emp-familyMembers.${index}.dob`}
                      type="date"
                      value={member.dob}
                      onChange={(e) =>
                        updateFamilyMember(index, "dob", e.target.value)
                      }
                      invalid={Boolean(errors[`familyMembers.${index}.dob`])}
                    />
                  </Field>
                  <Field
                    label="Covered Under"
                    htmlFor={`emp-familyMembers.${index}.coverage`}
                    required
                    error={errors[`familyMembers.${index}.coverage`]}
                  >
                    <Select
                      id={`emp-familyMembers.${index}.coverage`}
                      value={member.coverage}
                      onChange={(e) =>
                        updateFamilyMember(index, "coverage", e.target.value)
                      }
                      invalid={Boolean(
                        errors[`familyMembers.${index}.coverage`],
                      )}
                    >
                      <option value="">Select</option>
                      {FAMILY_COVERAGE_OPTIONS.map((o) => (
                        <option key={o.value} value={o.value}>
                          {o.label}
                        </option>
                      ))}
                    </Select>
                  </Field>
                  <button
                    type="button"
                    className="mt-0 inline-flex h-10 w-8 cursor-pointer items-center justify-center justify-self-start rounded-wz-sm border-0 bg-transparent text-wz-error hover:bg-[#fef3f2] md:mt-7"
                    aria-label={`Remove family member ${index + 1}`}
                    onClick={() => removeFamilyMember(index)}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))
            )}
          </div>
        </Card>

        {/* 3. Address */}
        <Card compact subtle>
          <h2 className="mb-wz-4 mt-0 text-base font-semibold leading-5 text-wz-heading">3. Address</h2>
          <Field label="Permanent Address" htmlFor="emp-permanentAddress">
            <TextArea
              id="emp-permanentAddress"
              name="permanentAddress"
              value={form.permanentAddress}
              onChange={onTextChange("permanentAddress")}
              placeholder="Permanent residential address"
            />
          </Field>
        </Card>

        {/* 4. Identity & Compliance */}
        <Card compact subtle>
          <h2 className="mb-wz-4 mt-0 text-base font-semibold leading-5 text-wz-heading">4. Identity & Compliance</h2>
          <div className="grid grid-cols-1 gap-x-wz-6 gap-y-wz-6 md:grid-cols-2 xl:grid-cols-3">
            <Field
              label="Aadhaar Number"
              htmlFor="emp-aadhaarNumber"
              error={errors.aadhaarNumber}
            >
              <Input
                id="emp-aadhaarNumber"
                placeholder="12-digit UID"
                name="aadhaarNumber"
                inputMode="numeric"
                maxLength={12}
                value={form.aadhaarNumber}
                onChange={onTextChange("aadhaarNumber")}
                invalid={Boolean(errors.aadhaarNumber)}
              />
            </Field>
            <Field
              label="Name as on Aadhaar"
              htmlFor="emp-nameAsPerAadhaar"
              error={errors.nameAsPerAadhaar}
            >
              <Input
                id="emp-nameAsPerAadhaar"
                placeholder="Full Name"
                name="nameAsPerAadhaar"
                value={form.nameAsPerAadhaar}
                onChange={onTextChange("nameAsPerAadhaar")}
                invalid={Boolean(errors.nameAsPerAadhaar)}
              />
            </Field>
            <Field
              label="PAN Number"
              htmlFor="emp-panNumber"
              error={errors.panNumber}
            >
              <Input
                id="emp-panNumber"
                placeholder="e.g., ABCDE1234F"
                name="panNumber"
                maxLength={10}
                value={form.panNumber}
                onChange={onTextChange("panNumber")}
                invalid={Boolean(errors.panNumber)}
              />
            </Field>
            <Field
              label="Name as on PAN"
              htmlFor="emp-nameAsPerPan"
              error={errors.nameAsPerPan}
            >
              <Input
                id="emp-nameAsPerPan"
                placeholder="Full Name"
                name="nameAsPerPan"
                value={form.nameAsPerPan}
                onChange={onTextChange("nameAsPerPan")}
                invalid={Boolean(errors.nameAsPerPan)}
              />
            </Field>
            <Field label="UAN" htmlFor="emp-uan" error={errors.uan}>
              <Input
                id="emp-uan"
                placeholder="12-digit UAN"
                name="uan"
                inputMode="numeric"
                maxLength={12}
                value={form.uan}
                onChange={onTextChange("uan")}
                invalid={Boolean(errors.uan)}
              />
            </Field>
            <Field label="PF Number" htmlFor="emp-pfNumber">
              <Input
                id="emp-pfNumber"
                placeholder="e.g., MH/BAN/0012345/000/0001234"
                name="pfNumber"
                value={form.pfNumber}
                onChange={onTextChange("pfNumber")}
              />
            </Field>
            <Field
              label="ESIC Number"
              htmlFor="emp-esicNumber"
              error={errors.esicNumber}
            >
              <Input
                id="emp-esicNumber"
                placeholder="10-digit ESIC number"
                name="esicNumber"
                inputMode="numeric"
                maxLength={10}
                value={form.esicNumber}
                onChange={onTextChange("esicNumber")}
                invalid={Boolean(errors.esicNumber)}
              />
            </Field>
          </div>
        </Card>

        {/* 5. Bank Details */}
        <Card compact subtle>
          <h2 className="mb-wz-4 mt-0 text-base font-semibold leading-5 text-wz-heading">5. Bank Details</h2>
          <div className="grid grid-cols-1 gap-x-wz-6 gap-y-wz-6 md:grid-cols-2 xl:grid-cols-3">
            <Field label="Bank Name" htmlFor="emp-bankName">
              <Input
                id="emp-bankName"
                placeholder="e.g., State Bank of India"
                name="bankName"
                value={form.bankName}
                onChange={onTextChange("bankName")}
              />
            </Field>
            <Field label="Account Holder Name" htmlFor="emp-accountHolderName">
              <Input
                id="emp-accountHolderName"
                placeholder="Full Name"
                name="accountHolderName"
                value={form.accountHolderName}
                onChange={onTextChange("accountHolderName")}
              />
            </Field>
            <Field
              label="Account Number"
              htmlFor="emp-accountNumber"
              error={errors.accountNumber}
            >
              <Input
                id="emp-accountNumber"
                placeholder="Account number"
                name="accountNumber"
                inputMode="numeric"
                value={form.accountNumber}
                onChange={onTextChange("accountNumber")}
                invalid={Boolean(errors.accountNumber)}
              />
            </Field>
            <Field
              label="IFSC Code"
              htmlFor="emp-ifscCode"
              error={errors.ifscCode}
            >
              <Input
                id="emp-ifscCode"
                placeholder="e.g., SBIN0012345"
                name="ifscCode"
                maxLength={11}
                value={form.ifscCode}
                onChange={onTextChange("ifscCode")}
                invalid={Boolean(errors.ifscCode)}
              />
            </Field>
          </div>
        </Card>

        {/* 6. Education & Employment */}
        <Card compact subtle>
          <h2 className="mb-wz-4 mt-0 text-base font-semibold leading-5 text-wz-heading">6. Education & Employment</h2>
          <div className="grid grid-cols-1 gap-x-wz-6 gap-y-wz-6 md:grid-cols-2 xl:grid-cols-3">
            <Field label="Highest Qualification" htmlFor="emp-highestQualification">
              <Input
                id="emp-highestQualification"
                placeholder="e.g., B.Tech"
                name="highestQualification"
                value={form.highestQualification}
                onChange={onTextChange("highestQualification")}
              />
            </Field>
            <Field label="Client" htmlFor="emp-client">
              <Input
                id="emp-client"
                placeholder="e.g., Client / site name"
                name="client"
                value={form.client}
                onChange={onTextChange("client")}
              />
            </Field>
            {!form.isConsultancy ? (
              <Field label="Probation End Date" htmlFor="emp-probationEndDate" error={errors.probationEndDate}>
                <Input
                  id="emp-probationEndDate"
                  name="probationEndDate"
                  type="date"
                  value={form.probationEndDate}
                  onChange={onTextChange("probationEndDate")}
                  invalid={Boolean(errors.probationEndDate)}
              />
              </Field>
            ) : null}
            <Field label="Relieving Date" htmlFor="emp-relievingDate" error={errors.relievingDate}>
              <Input
                id="emp-relievingDate"
                name="relievingDate"
                type="date"
                value={form.relievingDate}
                onChange={onTextChange("relievingDate")}
                invalid={Boolean(errors.relievingDate)}
              />
            </Field>
            {!form.isConsultancy ? (
              <Field label="Pay Type" htmlFor="emp-payType">
                <Select
                  id="emp-payType"
                  name="payType"
                  value={form.payType}
                  onChange={onTextChange("payType")}
                >
                  {PAY_TYPE_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </Select>
              </Field>
            ) : null}
          </div>

          {form.isConsultancy ? (
            <div className="mt-wz-5 grid grid-cols-1 gap-x-wz-6 gap-y-wz-6 md:grid-cols-2 xl:grid-cols-3">
              <Field
                label="Monthly Consultancy Pay (₹)"
                htmlFor="emp-monthlyConsultancyPay"
                required
                error={errors.monthlyConsultancyPay}
              >
                <Input
                  id="emp-monthlyConsultancyPay"
                placeholder="Enter amount"
                  name="monthlyConsultancyPay"
                  type="number"
                  min={0}
                  value={form.monthlyConsultancyPay}
                  onChange={onTextChange("monthlyConsultancyPay")}
                  invalid={Boolean(errors.monthlyConsultancyPay)}
                />
              </Field>
              <Field
                label="TDS %"
                htmlFor="emp-tdsPercent"
                error={errors.tdsPercent}
              >
                <Input
                  id="emp-tdsPercent"
                placeholder="Enter here"
                  name="tdsPercent"
                  type="number"
                  min={0}
                  max={100}
                  value={form.tdsPercent}
                  onChange={onTextChange("tdsPercent")}
                  invalid={Boolean(errors.tdsPercent)}
                />
              </Field>
            </div>
          ) : null}
        </Card>

        {/* App Access */}
        <Card compact subtle>
          <h2 className="mb-wz-4 mt-0 text-base font-semibold leading-5 text-wz-heading">
            7. App Access
          </h2>
          {/* Figma app-access-card: navy switch, same copy on add and edit (EMP-UI-20). */}
          <div className="flex items-start gap-3">
            <button
              type="button"
              role="switch"
              id="emp-createAppLogin"
              aria-checked={form.createAppLogin}
              aria-label="Enable app login for this employee"
              disabled={isEdit && hasAppLogin}
              onClick={() => setField("createAppLogin", !form.createAppLogin)}
              className={cn(
                "relative mt-0.5 inline-flex h-[22px] w-10 shrink-0 cursor-pointer items-center rounded-wz-full border-0 p-0 transition-colors disabled:cursor-not-allowed disabled:opacity-60",
                form.createAppLogin ? "bg-wz-navy" : "bg-[#6c757d]",
              )}
            >
              <span
                className={cn(
                  "absolute size-4 rounded-wz-full bg-white transition-[left]",
                  form.createAppLogin ? "left-[21px]" : "left-[3px]",
                )}
              />
            </button>
            <label htmlFor="emp-createAppLogin" className="cursor-pointer">
              <span className="block text-base leading-5 font-semibold text-wz-heading">
                Enable app login for this employee.
              </span>
              <span className="mt-0.5 block text-xs font-normal text-wz-text-secondary">
                {isEdit && hasAppLogin
                  ? "App login is already linked. Update role or set a new password below."
                  : "Unchecked employees are managed by HR only (no mobile app access)."}
              </span>
            </label>
          </div>
          {showAppLoginFields ? (
            <div className="mt-wz-5 grid grid-cols-1 gap-x-wz-6 gap-y-wz-6 md:grid-cols-2 xl:grid-cols-3">
              <Field
                label="Login Role"
                htmlFor="emp-userRole"
              >
                <Select
                  id="emp-userRole"
                  name="userRole"
                  value={form.userRole}
                  onChange={onTextChange("userRole")}
                >
                  {APP_ROLE_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field
                label="Password (Leave blank to auto-generate)"
                htmlFor="emp-userPassword"
                error={errors.userPassword}
              >
                <Input
                  id="emp-userPassword"
                  name="userPassword"
                  type="password"
                  value={form.userPassword}
                  onChange={onTextChange("userPassword")}
                  invalid={Boolean(errors.userPassword)}
                  autoComplete="new-password"
                  placeholder="Enter password here"
                />
              </Field>
            </div>
          ) : null}
        </Card>

        {!form.isConsultancy ? (
          <Card compact subtle id="emp-salary-structure">
            <h2 className="mb-wz-4 mt-0 text-base font-semibold leading-5 text-wz-heading">
              8. Salary Structure
            </h2>
            <EmployeeSalaryStructureEditor
              ref={salaryEditorRef}
              employeeId={isEdit ? employeeId : undefined}
              payType={form.payType}
              draftValue={salaryDraft}
              onDraftChange={setSalaryDraft}
              hideActions={!isEdit}
            />
          </Card>
        ) : null}

        {formError ? (
          <div
            className="m-0 rounded-wz-md border border-[#fecdca] bg-[#fef3f2] px-3.5 py-3 text-sm text-wz-error"
            role="alert"
          >
            {formError}
          </div>
        ) : null}

        <div className="sticky bottom-0 z-5 -mx-wz-6 -mb-wz-6 flex justify-end gap-wz-4 border-t border-wz-border bg-white px-wz-6 pt-[15px] pb-wz-4 max-[900px]:-mx-wz-4 max-[900px]:-mb-wz-4">
          <Button
            type="button"
            variant="secondary"
            className={isEdit ? "min-w-[150px]" : "min-w-[160px]"}
            onClick={() => navigate(cancelPath)}
            disabled={saving}
          >
            {cancelLabel}
          </Button>
          <Button
            type="submit"
            variant="primary"
            className={isEdit ? "min-w-[150px]" : "min-w-[160px]"}
            disabled={saving}
          >
            {saving ? "Saving…" : submitLabel}
          </Button>
        </div>
      </form>
    </div>
  );
}
