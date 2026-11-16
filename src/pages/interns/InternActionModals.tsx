import { useEffect, useState } from "react";
import { Copy, Check } from "lucide-react";
import {
  Button,
  Field,
  Input,
  Modal,
  SearchableSelect,
  Select,
  TextArea,
} from "../../design-system";
import type { InternCredentials, InternListItem } from "../../services/internTypes";
import { NEXT_STATUS } from "./internConstants";
import {
  addDaysInput,
  formatInternDate,
  internDeptName,
  internStatusLabel,
  toDateInput,
} from "./internViewFormat";

export type InternStatusModalProps = {
  intern: InternListItem | null;
  open: boolean;
  loading?: boolean;
  error?: string | null;
  onClose: () => void;
  onSubmit: (status: string, remark: string) => void;
};

export function InternStatusModal({
  intern,
  open,
  loading,
  error,
  onClose,
  onSubmit,
}: InternStatusModalProps) {
  const current = (intern?.internStatus || "active") as keyof typeof NEXT_STATUS;
  const options = NEXT_STATUS[current] || [];
  const [status, setStatus] = useState("");
  const [remark, setRemark] = useState("");

  useEffect(() => {
    if (open) {
      setStatus(options[0] || "");
      setRemark("");
    }
  }, [open, intern?._id, options]);

  if (!intern) return null;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`Change Status — ${intern.name || "Intern"}`}
      size="md"
      footer={
        <>
          <Button type="button" variant="secondary" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button
            type="button"
            variant="primary"
            disabled={!status || loading || options.length === 0}
            onClick={() => onSubmit(status, remark)}
          >
            {loading ? "Saving…" : "Update Status"}
          </Button>
        </>
      }
    >
      <p className="m-0 mb-wz-4 text-sm text-wz-text-secondary">
        Current status:{" "}
        <strong className="text-wz-heading">{internStatusLabel(current)}</strong>
      </p>
      {options.length === 0 ? (
        <p className="m-0 text-sm text-wz-error" role="alert">
          This internship is {internStatusLabel(current)} — no further status changes allowed.
        </p>
      ) : (
        <div className="flex flex-col gap-wz-4">
          <Field label="New status" htmlFor="intern-status-next" required>
            <Select
              id="intern-status-next"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            >
              {options.map((s) => (
                <option key={s} value={s}>
                  {internStatusLabel(s)}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Remark (optional)" htmlFor="intern-status-remark">
            <TextArea
              id="intern-status-remark"
              value={remark}
              onChange={(e) => setRemark(e.target.value)}
              placeholder="Reason for status change"
              rows={3}
            />
          </Field>
        </div>
      )}
      {error ? (
        <p className="m-0 mt-wz-3 text-sm text-wz-error" role="alert">
          {error}
        </p>
      ) : null}
    </Modal>
  );
}

export type InternExtendModalProps = {
  intern: InternListItem | null;
  open: boolean;
  loading?: boolean;
  error?: string | null;
  onClose: () => void;
  onSubmit: (newEndDate: string, remark: string) => void;
};

export function InternExtendModal({
  intern,
  open,
  loading,
  error,
  onClose,
  onSubmit,
}: InternExtendModalProps) {
  const [newEndDate, setNewEndDate] = useState("");
  const [remark, setRemark] = useState("");
  const [localError, setLocalError] = useState<string | null>(null);

  useEffect(() => {
    if (open && intern) {
      setNewEndDate(addDaysInput(intern.internshipEndDate, 1));
      setRemark("");
      setLocalError(null);
    }
  }, [open, intern?._id, intern?.internshipEndDate]);

  if (!intern) return null;

  const minDate = addDaysInput(intern.internshipEndDate, 1);

  const submit = () => {
    setLocalError(null);
    if (!newEndDate) {
      setLocalError("New end date is required");
      return;
    }
    const next = new Date(newEndDate);
    const current = intern.internshipEndDate
      ? new Date(intern.internshipEndDate)
      : null;
    if (current && !Number.isNaN(current.getTime()) && next <= current) {
      setLocalError(
        `New end date must be after the current end date (${formatInternDate(intern.internshipEndDate)})`,
      );
      return;
    }
    onSubmit(newEndDate, remark);
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`Extend Internship — ${intern.name || "Intern"}`}
      size="md"
      footer={
        <>
          <Button type="button" variant="secondary" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button type="button" variant="primary" onClick={submit} disabled={loading}>
            {loading ? "Saving…" : "Extend"}
          </Button>
        </>
      }
    >
      <p className="m-0 mb-wz-4 text-sm text-wz-text-secondary">
        Current end date:{" "}
        <strong className="text-wz-heading">
          {formatInternDate(intern.internshipEndDate)}
        </strong>
      </p>
      <div className="flex flex-col gap-wz-4">
        <Field label="New end date" htmlFor="intern-extend-end" required error={localError || undefined}>
          <Input
            id="intern-extend-end"
            type="date"
            min={minDate}
            value={newEndDate}
            onChange={(e) => setNewEndDate(e.target.value)}
            invalid={Boolean(localError)}
          />
        </Field>
        <Field label="Remark (optional)" htmlFor="intern-extend-remark">
          <TextArea
            id="intern-extend-remark"
            value={remark}
            onChange={(e) => setRemark(e.target.value)}
            rows={3}
          />
        </Field>
      </div>
      {error ? (
        <p className="m-0 mt-wz-3 text-sm text-wz-error" role="alert">
          {error}
        </p>
      ) : null}
    </Modal>
  );
};

export type ConvertFormState = {
  dateOfJoining: string;
  designation: string;
  departmentId: string;
  employmentStatus: "probation" | "full-time";
};

export type InternConvertModalProps = {
  intern: InternListItem | null;
  open: boolean;
  loading?: boolean;
  error?: string | null;
  departments: { _id: string; name: string }[];
  onClose: () => void;
  onSubmit: (payload: ConvertFormState) => void;
};

export function InternConvertModal({
  intern,
  open,
  loading,
  error,
  departments,
  onClose,
  onSubmit,
}: InternConvertModalProps) {
  const today = toDateInput(new Date().toISOString());
  const [form, setForm] = useState<ConvertFormState>({
    dateOfJoining: today,
    designation: "",
    departmentId: "",
    employmentStatus: "probation",
  });
  const [localErrors, setLocalErrors] = useState<Partial<Record<keyof ConvertFormState, string>>>({});

  useEffect(() => {
    if (open && intern) {
      setForm({
        dateOfJoining: today,
        designation: intern.designation || "",
        departmentId:
          typeof intern.department === "object" && intern.department?._id
            ? intern.department._id
            : intern.departmentId || "",
        employmentStatus: "probation",
      });
      setLocalErrors({});
    }
  }, [open, intern?._id, intern?.designation, intern?.department, intern?.departmentId, today]);

  if (!intern) return null;

  const minDoj = toDateInput(intern.internshipStartDate);

  const submit = () => {
    const errs: Partial<Record<keyof ConvertFormState, string>> = {};
    const des = form.designation.trim();
    if (!des) errs.designation = "Enter the full-time designation";
    else if (des.length > 120) errs.designation = "Designation must be at most 120 characters";
    if (!form.dateOfJoining) errs.dateOfJoining = "Date of joining is required";
    else {
      const doj = new Date(form.dateOfJoining);
      if (Number.isNaN(doj.getTime())) errs.dateOfJoining = "Enter a valid joining date";
      else if (intern.internshipStartDate) {
        const start = new Date(intern.internshipStartDate);
        start.setHours(0, 0, 0, 0);
        doj.setHours(0, 0, 0, 0);
        if (doj < start) {
          errs.dateOfJoining = `Joining date cannot be earlier than internship start (${formatInternDate(intern.internshipStartDate)})`;
        }
      }
    }
    setLocalErrors(errs);
    if (Object.keys(errs).length) return;
    onSubmit({ ...form, designation: des });
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`Convert to Employee — ${intern.name || "Intern"}`}
      size="lg"
      footer={
        <>
          <Button type="button" variant="secondary" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button type="button" variant="primary" onClick={submit} disabled={loading}>
            {loading ? "Converting…" : "Convert to Full-Time"}
          </Button>
        </>
      }
    >
      <p className="m-0 mb-wz-4 text-sm text-wz-text-secondary">
        A new employee record will be created. Department: {internDeptName(intern)}.
        Salary is managed from the employee section.
      </p>
      <div className="grid grid-cols-1 gap-wz-4 md:grid-cols-2">
        <Field
          label="Date of Joining"
          htmlFor="intern-convert-doj"
          required
          error={localErrors.dateOfJoining}
        >
          <Input
            id="intern-convert-doj"
            type="date"
            min={minDoj}
            value={form.dateOfJoining}
            onChange={(e) => setForm((p) => ({ ...p, dateOfJoining: e.target.value }))}
            invalid={Boolean(localErrors.dateOfJoining)}
          />
        </Field>
        <Field
          label="Designation"
          htmlFor="intern-convert-designation"
          required
          error={localErrors.designation}
        >
          <Input
            id="intern-convert-designation"
            value={form.designation}
            maxLength={120}
            onChange={(e) => setForm((p) => ({ ...p, designation: e.target.value }))}
            placeholder="e.g. Junior Developer"
            invalid={Boolean(localErrors.designation)}
          />
        </Field>
        <Field label="Department" htmlFor="intern-convert-dept">
          <SearchableSelect
            id="intern-convert-dept"
            value={form.departmentId}
            onChange={(v) => setForm((p) => ({ ...p, departmentId: v }))}
            placeholder="Select department"
            searchPlaceholder="Search department…"
            options={departments.map((d) => ({ value: d._id, label: d.name }))}
          />
        </Field>
        <Field label="Employment status" htmlFor="intern-convert-employment">
          <Select
            id="intern-convert-employment"
            value={form.employmentStatus}
            onChange={(e) =>
              setForm((p) => ({
                ...p,
                employmentStatus: e.target.value as ConvertFormState["employmentStatus"],
              }))
            }
          >
            <option value="probation">Probation</option>
            <option value="full-time">Full-Time</option>
          </Select>
        </Field>
      </div>
      {error ? (
        <p className="m-0 mt-wz-3 text-sm text-wz-error" role="alert">
          {error}
        </p>
      ) : null}
    </Modal>
  );
}

export type InternCredentialsModalProps = {
  open: boolean;
  loginInfo: InternCredentials | null;
  onClose: () => void;
  onDone: () => void;
};

export function InternCredentialsModal({
  open,
  loginInfo,
  onClose,
  onDone,
}: InternCredentialsModalProps) {
  const [copied, setCopied] = useState<string | null>(null);

  const copy = async (key: string, value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(key);
      window.setTimeout(() => setCopied(null), 1500);
    } catch {
      /* ignore */
    }
  };

  if (!loginInfo) return null;

  const rows: { key: string; label: string; value: string }[] = [
    { key: "email", label: "Email", value: loginInfo.email || "" },
    { key: "phone", label: "Phone", value: loginInfo.phone || "" },
    { key: "role", label: "Role", value: loginInfo.role || "Intern" },
    {
      key: "password",
      label: "Temporary password",
      value: loginInfo.temporaryPassword || "",
    },
    {
      key: "org",
      label: "Organization code",
      value: loginInfo.organizationCode || "",
    },
  ].filter((r) => r.value);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="App login created"
      size="md"
      footer={
        <Button type="button" variant="primary" onClick={onDone}>
          Continue
        </Button>
      }
    >
      <p className="m-0 mb-wz-4 text-sm text-wz-text-secondary">
        Share these credentials securely with {loginInfo.name || "the intern"}.
      </p>
      <ul className="m-0 flex list-none flex-col gap-wz-3 p-0">
        {rows.map((row) => (
          <li
            key={row.key}
            className="flex items-center justify-between gap-wz-3 rounded-wz-md border border-wz-border bg-wz-neutral-50 px-3 py-2"
          >
            <div className="min-w-0">
              <p className="m-0 text-[11px] font-semibold uppercase tracking-wide text-wz-text-muted">
                {row.label}
              </p>
              <p className="m-0 truncate text-sm font-semibold text-wz-heading">{row.value}</p>
            </div>
            <button
              type="button"
              className="inline-flex shrink-0 cursor-pointer items-center justify-center rounded-wz-sm border-0 bg-transparent p-1 text-wz-text-muted hover:text-wz-primary"
              aria-label={`Copy ${row.label}`}
              onClick={() => void copy(row.key, row.value)}
            >
              {copied === row.key ? <Check size={14} /> : <Copy size={14} />}
            </button>
          </li>
        ))}
      </ul>
    </Modal>
  );
}