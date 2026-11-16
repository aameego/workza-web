import {
  useMemo,
  useState,
  type ChangeEvent,
  type FormEvent,
} from "react";
import { useNavigate, useParams } from "react-router-dom";
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
import { useEmployees } from "../../hooks/useEmployees";
import {
  useAddIntern,
  useConfigureInternStipend,
  useUpdateIntern,
} from "../../hooks/useInterns";
import { readSessionUser } from "../../layouts/sessionUser";
import { ApiError } from "../../lib/apiClient";
import { hasStipendData } from "../../services/internService";
import type { InternCredentials } from "../../services/internTypes";
import { maskEmployeeCode } from "../employees/employeeCodeFormat";
import {
  APP_ROLE_OPTIONS,
  BLOOD_GROUP_OPTIONS,
  GENDER_OPTIONS,
  MARITAL_OPTIONS,
  RELATION_OPTIONS,
} from "../employees/employeeForm";
import { STIPEND_FREQUENCY_OPTIONS } from "./internConstants";
import { InternCredentialsModal } from "./InternActionModals";
import { buildInternFormPayload, type InternFormValues } from "./internForm";
import {
  collectInternFormErrors,
  getMaxInternDobInputValue,
  getMinInternshipEndInputValue,
  validateInternField,
} from "./internValidation";

const NATIONALITIES = ["Indian", "Nepali", "Bangladeshi", "Sri Lankan", "Bhutanese", "Other"];

type FormErrors = Partial<Record<keyof InternFormValues, string>>;

export type InternFormEditorProps = {
  mode: "create" | "edit";
  initialValues: InternFormValues;
  internId?: string;
  hasAppLogin?: boolean;
  cancelTo?: string;
};

export default function InternFormEditor({
  mode,
  initialValues,
  internId,
  hasAppLogin = false,
  cancelTo,
}: InternFormEditorProps) {
  const navigate = useNavigate();
  const { vendorSlug } = useParams();
  const user = readSessionUser();
  const vendorId = user?.vendorId || null;
  const base = `/${vendorSlug || "app"}`;
  const listPath = `${base}/employees?type=intern`;
  const cancelPath = cancelTo || listPath;

  const [form, setForm] = useState<InternFormValues>(initialValues);
  const [errors, setErrors] = useState<FormErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [credentials, setCredentials] = useState<InternCredentials | null>(null);
  const [pendingViewId, setPendingViewId] = useState<string | null>(null);

  const { data: departments = [] } = useDepartmentNames(vendorId);
  const { data: managerData } = useEmployees(
    { page: 1, limit: 500, isPagination: "true", isConsultancy: false },
    Boolean(vendorId),
  );
  const managers = managerData?.employees ?? [];

  const supervisorOptions = (current: string) =>
    managers
      .filter(
        (m) =>
          m._id === current ||
          (m.isActive !== false && !m.isExited && !m.isDeleted),
      )
      .map((m) => ({
        value: m._id,
        label: m.employeeCode ? `${m.name} (${m.employeeCode})` : m.name || "Employee",
      }));

  const addMutation = useAddIntern();
  const updateMutation = useUpdateIntern();
  const stipendMutation = useConfigureInternStipend();
  const saving =
    mode === "create"
      ? addMutation.isPending || stipendMutation.isPending
      : updateMutation.isPending;

  const maxDob = useMemo(() => getMaxInternDobInputValue(), []);
  const minEnd = useMemo(
    () => getMinInternshipEndInputValue(form.internshipStartDate),
    [form.internshipStartDate],
  );
  const isEdit = mode === "edit";
  const showAppLoginFields = form.createAppLogin || (isEdit && hasAppLogin);

  const setField = <K extends keyof InternFormValues>(
    name: K,
    value: InternFormValues[K],
  ) => {
    setForm((prev) => {
      const next = { ...prev, [name]: value };
      const err = validateInternField(name, next);
      setErrors((prevErr) => {
        const copy = { ...prevErr };
        if (err) copy[name] = err;
        else delete copy[name];
        return copy;
      });
      return next;
    });
  };

  const DIGIT_FIELDS: Partial<Record<keyof InternFormValues, number>> = {
    phone: 10,
    emergencyContact: 10,
    aadhaarNumber: 12,
    accountNumber: 18,
  };

  const onTextChange =
    (name: keyof InternFormValues) =>
    (e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
      let value = e.target.value;
      const max = DIGIT_FIELDS[name];
      if (max !== undefined) {
        value = value.replace(/\D/g, "").slice(0, max);
      }
      if (name === "employeeCode") {
        value = maskEmployeeCode(value);
      }
      if (name === "ifscCode") value = value.toUpperCase();
      if (name === "panNumber") value = value.toUpperCase();
      setField(name, value as InternFormValues[typeof name]);
    };

  const scrollToFirstError = (formErrors: FormErrors) => {
    const first = Object.keys(formErrors)[0];
    if (!first) return;
    document
      .getElementById(`intern-${first}`)
      ?.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  const goToView = (id: string) => {
    navigate(`${base}/employees/interns/${id}`);
  };

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (saving) return;

    const formErrors = collectInternFormErrors(form, {
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

    try {
      const creatingLogin = form.createAppLogin && !(isEdit && hasAppLogin);
      const payload = buildInternFormPayload(form, {
        createAppLogin: creatingLogin,
        hasAppLogin: isEdit && hasAppLogin,
      });

      if (isEdit) {
        if (!internId) throw new Error("Missing intern id");
        await updateMutation.mutateAsync({ id: internId, data: payload });
        goToView(internId);
        return;
      }

      const created = await addMutation.mutateAsync(payload);
      const newId =
        created?.intern?._id ||
        (created as { _id?: string } | undefined)?._id;

      if (
        newId &&
        hasStipendData({
          monthlyStipend: form.stipendAmount,
          stipendFrequency: form.stipendFrequency,
        })
      ) {
        try {
          await stipendMutation.mutateAsync({
            id: newId,
            stipendAmount: Number(form.stipendAmount),
            stipendFrequency: form.stipendFrequency || "monthly",
          });
        } catch {
          setFormError(
            "Intern created, but stipend could not be configured. Open the intern profile and try again.",
          );
          if (newId) goToView(newId);
          return;
        }
      }

      if (!newId) {
        navigate(listPath);
        return;
      }

      if (created?.loginInfo) {
        setCredentials(created.loginInfo);
        setPendingViewId(newId);
        return;
      }

      goToView(newId);
    } catch (err) {
      setFormError(
        err instanceof ApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : "Could not save intern",
      );
    }
  };

  const submitLabel = isEdit ? "Save Changes" : "Add Intern";

  return (
    <div className="flex min-w-0 flex-col">
      <form className="flex flex-col gap-wz-6" onSubmit={onSubmit} noValidate>
        <Card compact subtle>
          <h2 className="mb-wz-4 mt-0 text-base font-semibold leading-5 text-wz-heading">
            1. Basic Information
          </h2>
          <div className="grid grid-cols-1 gap-x-wz-6 gap-y-wz-6 md:grid-cols-2 xl:grid-cols-3">
            <Field label="Intern Code (auto if blank)" htmlFor="intern-employeeCode" error={errors.employeeCode}>
              <Input id="intern-employeeCode" value={form.employeeCode} onChange={onTextChange("employeeCode")} invalid={Boolean(errors.employeeCode)} />
            </Field>
            <Field label="Full Name" htmlFor="intern-name" required error={errors.name}>
              <Input id="intern-name" value={form.name} onChange={onTextChange("name")} required invalid={Boolean(errors.name)} />
            </Field>
            <Field label="Email" htmlFor="intern-email" error={errors.email} hint={form.createAppLogin ? "Required for app login (or phone)" : undefined}>
              <Input id="intern-email" type="email" value={form.email} onChange={onTextChange("email")} invalid={Boolean(errors.email)} />
            </Field>
            <Field label="Phone" htmlFor="intern-phone" error={errors.phone}>
              <Input id="intern-phone" type="tel" inputMode="numeric" value={form.phone} onChange={onTextChange("phone")} invalid={Boolean(errors.phone)} />
            </Field>
            <Field label="Designation" htmlFor="intern-designation">
              <Input id="intern-designation" value={form.designation} onChange={onTextChange("designation")} />
            </Field>
            <Field label="Department" htmlFor="intern-departmentId" required error={errors.departmentId}>
              <SearchableSelect
                id="intern-departmentId"
                value={form.departmentId}
                onChange={(v) => setField("departmentId", v)}
                invalid={Boolean(errors.departmentId)}
                placeholder="Select department"
                searchPlaceholder="Search department…"
                options={departments.map((d) => ({ value: d._id, label: d.name }))}
              />
            </Field>
            <Field label="Work Location" htmlFor="intern-location">
              <Input id="intern-location" value={form.location} onChange={onTextChange("location")} />
            </Field>
          </div>
        </Card>

        <Card compact subtle>
          <h2 className="mb-wz-4 mt-0 text-base font-semibold leading-5 text-wz-heading">
            2. Internship Details
          </h2>
          <div className="grid grid-cols-1 gap-x-wz-6 gap-y-wz-6 md:grid-cols-2 xl:grid-cols-3">
            <Field label="Start Date" htmlFor="intern-internshipStartDate" required error={errors.internshipStartDate}>
              <Input id="intern-internshipStartDate" type="date" value={form.internshipStartDate} onChange={onTextChange("internshipStartDate")} invalid={Boolean(errors.internshipStartDate)} required />
            </Field>
            <Field label="End Date" htmlFor="intern-internshipEndDate" required error={errors.internshipEndDate}>
              <Input id="intern-internshipEndDate" type="date" min={minEnd} value={form.internshipEndDate} onChange={onTextChange("internshipEndDate")} invalid={Boolean(errors.internshipEndDate)} required />
            </Field>
            <Field label="University / Institute" htmlFor="intern-universityOrInstitute">
              <Input id="intern-universityOrInstitute" value={form.universityOrInstitute} onChange={onTextChange("universityOrInstitute")} />
            </Field>
            <Field label="Course / Program" htmlFor="intern-courseOrProgram">
              <Input id="intern-courseOrProgram" value={form.courseOrProgram} onChange={onTextChange("courseOrProgram")} />
            </Field>
            <Field label="Expected Graduation" htmlFor="intern-expectedGraduationDate">
              <Input id="intern-expectedGraduationDate" type="date" value={form.expectedGraduationDate} onChange={onTextChange("expectedGraduationDate")} />
            </Field>
            <Field label="Mentor" htmlFor="intern-mentorId" error={errors.mentorId}>
              <SearchableSelect
                id="intern-mentorId"
                value={form.mentorId}
                onChange={(v) => setField("mentorId", v)}
                placeholder="Search employee"
                searchPlaceholder="Search name or code…"
                options={supervisorOptions(form.mentorId)}
              />
            </Field>
            <Field label="Reporting Manager" htmlFor="intern-reportingManagerId" error={errors.reportingManagerId}>
              <SearchableSelect
                id="intern-reportingManagerId"
                value={form.reportingManagerId}
                onChange={(v) => setField("reportingManagerId", v)}
                placeholder="Search employee"
                searchPlaceholder="Search name or code…"
                options={supervisorOptions(form.reportingManagerId)}
              />
            </Field>
          </div>
        </Card>

        <Card compact subtle>
          <h2 className="mb-wz-4 mt-0 text-base font-semibold leading-5 text-wz-heading">
            3. Personal
          </h2>
          <div className="grid grid-cols-1 gap-x-wz-6 gap-y-wz-6 md:grid-cols-2 xl:grid-cols-3">
            <Field label="Date of Birth" htmlFor="intern-dob" error={errors.dob}>
              <Input id="intern-dob" type="date" max={maxDob} value={form.dob} onChange={onTextChange("dob")} invalid={Boolean(errors.dob)} />
            </Field>
            <Field label="Gender" htmlFor="intern-gender">
              <Select id="intern-gender" value={form.gender} onChange={onTextChange("gender")}>
                <option value="">Select gender</option>
                {GENDER_OPTIONS.map((g) => (
                  <option key={g} value={g}>{g}</option>
                ))}
              </Select>
            </Field>
            <Field label="Blood Group" htmlFor="intern-bloodGroup">
              <Select id="intern-bloodGroup" value={form.bloodGroup} onChange={onTextChange("bloodGroup")}>
                <option value="">Select</option>
                {BLOOD_GROUP_OPTIONS.map((b) => (
                  <option key={b} value={b}>{b}</option>
                ))}
              </Select>
            </Field>
            <Field label="Father / Husband Name" htmlFor="intern-fatherHusbandName">
              <Input id="intern-fatherHusbandName" value={form.fatherHusbandName} onChange={onTextChange("fatherHusbandName")} />
            </Field>
            <Field label="Relation with Member" htmlFor="intern-relationWithMember">
              <Select id="intern-relationWithMember" value={form.relationWithMember} onChange={onTextChange("relationWithMember")}>
                <option value="">Select</option>
                {RELATION_OPTIONS.map((r) => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </Select>
            </Field>
            <Field label="Nationality" htmlFor="intern-nationality">
              <Select id="intern-nationality" value={form.nationality} onChange={onTextChange("nationality")}>
                <option value="">Select</option>
                {NATIONALITIES.map((n) => (
                  <option key={n} value={n}>{n}</option>
                ))}
              </Select>
            </Field>
            <Field label="Marital Status" htmlFor="intern-maritalStatus">
              <Select id="intern-maritalStatus" value={form.maritalStatus} onChange={onTextChange("maritalStatus")}>
                <option value="">Select</option>
                {MARITAL_OPTIONS.map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </Select>
            </Field>
            <Field label="Emergency Contact" htmlFor="intern-emergencyContact" error={errors.emergencyContact}>
              <Input id="intern-emergencyContact" type="tel" inputMode="numeric" value={form.emergencyContact} onChange={onTextChange("emergencyContact")} invalid={Boolean(errors.emergencyContact)} />
            </Field>
          </div>
          <div className="mt-wz-4">
            <Field label="Permanent Address" htmlFor="intern-permanentAddress">
              <TextArea id="intern-permanentAddress" value={form.permanentAddress} onChange={onTextChange("permanentAddress")} rows={3} />
            </Field>
          </div>
        </Card>

        <Card compact subtle>
          <h2 className="mb-wz-4 mt-0 text-base font-semibold leading-5 text-wz-heading">
            4. Identity & Bank
          </h2>
          <div className="grid grid-cols-1 gap-x-wz-6 gap-y-wz-6 md:grid-cols-2 xl:grid-cols-3">
            <Field label="Aadhaar Number" htmlFor="intern-aadhaarNumber">
              <Input id="intern-aadhaarNumber" inputMode="numeric" maxLength={12} value={form.aadhaarNumber} onChange={onTextChange("aadhaarNumber")} />
            </Field>
            <Field label="Name as on Aadhaar" htmlFor="intern-nameAsPerAadhaar">
              <Input id="intern-nameAsPerAadhaar" value={form.nameAsPerAadhaar} onChange={onTextChange("nameAsPerAadhaar")} />
            </Field>
            <Field label="PAN Number" htmlFor="intern-panNumber">
              <Input id="intern-panNumber" maxLength={10} value={form.panNumber} onChange={onTextChange("panNumber")} />
            </Field>
            <Field label="Name as on PAN" htmlFor="intern-nameAsPerPan">
              <Input id="intern-nameAsPerPan" value={form.nameAsPerPan} onChange={onTextChange("nameAsPerPan")} />
            </Field>
            <Field label="Bank Name" htmlFor="intern-bankName">
              <Input id="intern-bankName" value={form.bankName} onChange={onTextChange("bankName")} />
            </Field>
            <Field label="Account Holder" htmlFor="intern-accountHolderName">
              <Input id="intern-accountHolderName" value={form.accountHolderName} onChange={onTextChange("accountHolderName")} />
            </Field>
            <Field label="Account Number" htmlFor="intern-accountNumber">
              <Input id="intern-accountNumber" inputMode="numeric" value={form.accountNumber} onChange={onTextChange("accountNumber")} />
            </Field>
            <Field label="IFSC Code" htmlFor="intern-ifscCode">
              <Input id="intern-ifscCode" maxLength={11} value={form.ifscCode} onChange={onTextChange("ifscCode")} />
            </Field>
          </div>
        </Card>

        <Card compact subtle>
          <h2 className="mb-wz-4 mt-0 text-base font-semibold leading-5 text-wz-heading">
            5. Education
          </h2>
          <Field label="Highest Qualification" htmlFor="intern-highestQualification">
            <Input id="intern-highestQualification" value={form.highestQualification} onChange={onTextChange("highestQualification")} />
          </Field>
        </Card>

        <Card compact subtle>
          <h2 className="mb-wz-4 mt-0 text-base font-semibold leading-5 text-wz-heading">
            6. Stipend
          </h2>
          <div className="grid grid-cols-1 gap-x-wz-6 gap-y-wz-6 md:grid-cols-2">
            <Field label="Monthly Stipend (₹)" htmlFor="intern-stipendAmount" error={errors.stipendAmount} hint="Leave blank for unpaid internships">
              <Input id="intern-stipendAmount" type="number" min={0} value={form.stipendAmount} onChange={onTextChange("stipendAmount")} invalid={Boolean(errors.stipendAmount)} />
            </Field>
            <Field label="Frequency" htmlFor="intern-stipendFrequency" error={errors.stipendFrequency}>
              <Select id="intern-stipendFrequency" value={form.stipendFrequency} onChange={onTextChange("stipendFrequency")}>
                {STIPEND_FREQUENCY_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </Select>
            </Field>
          </div>
        </Card>

        <Card compact subtle>
          <h2 className="mb-wz-4 mt-0 text-base font-semibold leading-5 text-wz-heading">
            7. App Access
          </h2>
          <div className="flex items-start gap-3">
            <button
              type="button"
              role="switch"
              id="intern-createAppLogin"
              aria-checked={form.createAppLogin}
              aria-label="Enable app login for this intern"
              disabled={isEdit && hasAppLogin}
              onClick={() => setField("createAppLogin", !form.createAppLogin)}
              className={cn(
                "relative mt-0.5 inline-flex h-[22px] w-10 shrink-0 cursor-pointer items-center rounded-wz-full border-0 p-0 transition-colors disabled:cursor-not-allowed disabled:opacity-60",
                form.createAppLogin ? "bg-wz-navy" : "bg-[#6c757d]",
              )}
            >
              <span
                className={cn(
                  "absolute top-[3px] size-4 rounded-full bg-white transition-[left]",
                  form.createAppLogin ? "left-[21px]" : "left-[3px]",
                )}
              />
            </button>
            <label htmlFor="intern-createAppLogin" className="cursor-pointer text-sm text-wz-heading">
              Create app login for this intern
            </label>
          </div>
          {showAppLoginFields ? (
            <div className="mt-wz-4 grid grid-cols-1 gap-wz-4 md:grid-cols-2">
              <Field label="App Role" htmlFor="intern-userRole">
                <Select id="intern-userRole" value={form.userRole} onChange={onTextChange("userRole")} disabled={isEdit && hasAppLogin}>
                  {APP_ROLE_OPTIONS.map((r) => (
                    <option key={r.value} value={r.value}>{r.label}</option>
                  ))}
                </Select>
              </Field>
              {!isEdit || !hasAppLogin ? (
                <Field label="Password (optional)" htmlFor="intern-userPassword" error={errors.userPassword} hint="Leave blank to auto-generate">
                  <Input id="intern-userPassword" type="password" value={form.userPassword} onChange={onTextChange("userPassword")} invalid={Boolean(errors.userPassword)} />
                </Field>
              ) : null}
            </div>
          ) : null}
        </Card>

        {formError ? (
          <p className="m-0 text-sm text-wz-error" role="alert">
            {formError}
          </p>
        ) : null}

        <div className="sticky bottom-0 z-10 -mx-wz-6 flex flex-wrap items-center justify-end gap-wz-3 border-t border-wz-border bg-white px-wz-6 py-4">
          <Button type="button" variant="secondary" onClick={() => navigate(cancelPath)} disabled={saving}>
            {isEdit ? "Cancel Changes" : "Cancel"}
          </Button>
          <Button type="submit" variant="primary" disabled={saving}>
            {saving ? "Saving…" : submitLabel}
          </Button>
        </div>
      </form>

      <InternCredentialsModal
        open={Boolean(credentials)}
        loginInfo={credentials}
        onClose={() => {
          setCredentials(null);
          if (pendingViewId) goToView(pendingViewId);
        }}
        onDone={() => {
          setCredentials(null);
          if (pendingViewId) goToView(pendingViewId);
        }}
      />
    </div>
  );
}