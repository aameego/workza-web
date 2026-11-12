import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Button, cn, Field, Input, Modal, Select, TextArea } from "../../design-system";
import { ApiError } from "../../lib/apiClient";
import { downloadIssuedLetter, issueLetter } from "../../services/letterService";
import { getLetterTemplate, getLetterTemplates } from "../../services/letterTemplateService";
import type {
  LetterTemplate,
  LetterTemplateInputField,
  LetterTemplateSummary,
} from "../../services/letterTypes";
import { EmployeeModalCard } from "./EmployeeActionModals";
import type { EmployeeListItem } from "../../services/employeeTypes";
import {
  buildLetterRequest,
  validateRequiredLetterValues,
} from "./buildLetterRequest";
import {
  filterIssuableTemplates,
  issuedLetterFileName,
  letterFormCopy,
} from "./letterCatalog";

export type IssueLetterModalProps = {
  open: boolean;
  onClose: () => void;
  employee: EmployeeListItem | null;
  recipientRule?: string | null;
};

export default function IssueLetterModal({
  open,
  onClose,
  employee,
  recipientRule = null,
}: IssueLetterModalProps) {
  const [templates, setTemplates] = useState<LetterTemplateSummary[]>([]);
  const [templatesLoading, setTemplatesLoading] = useState(false);
  const [templatesError, setTemplatesError] = useState<string | null>(null);
  const [templateId, setTemplateId] = useState("");
  const [template, setTemplate] = useState<LetterTemplate | null>(null);
  const [templateLoading, setTemplateLoading] = useState(false);
  const [values, setValues] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<{
    letterId: string;
    letterNumber?: string;
    emailed?: boolean;
  } | null>(null);

  const employeeTemplates = useMemo(
    () =>
      filterIssuableTemplates(templates, {
        recipientType: "employee",
        recipientRule,
      }),
    [templates, recipientRule],
  );

  useEffect(() => {
    if (!open) return undefined;
    let cancelled = false;
    setTemplatesLoading(true);
    setTemplatesError(null);
    setTemplateId("");
    setTemplate(null);
    setValues({});
    setError(null);
    setSuccess(null);

    void getLetterTemplates({ recipientType: "employee" })
      .then((list) => {
        if (!cancelled) setTemplates(list);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setTemplatesError(
          err instanceof ApiError
            ? err.message
            : "Could not load letter templates",
        );
      })
      .finally(() => {
        if (!cancelled) setTemplatesLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [open, employee?._id, recipientRule]);

  useEffect(() => {
    if (!open || !templateId) {
      setTemplate(null);
      setValues({});
      return undefined;
    }
    let cancelled = false;
    setTemplateLoading(true);
    setError(null);
    void getLetterTemplate(templateId)
      .then((full) => {
        if (cancelled) return;
        setTemplate(full);
        const initial: Record<string, string> = {};
        (full.inputFields || []).forEach((field) => {
          initial[field.key] = field.options?.[0] ?? "";
        });
        setValues(initial);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setTemplate(null);
        setError(
          err instanceof ApiError
            ? err.message
            : "Could not load the selected template",
        );
      })
      .finally(() => {
        if (!cancelled) setTemplateLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [open, templateId]);

  const handleClose = () => {
    if (submitting) return;
    onClose();
  };

  const onIssue = async () => {
    if (!employee || !template) return;
    const validationError = validateRequiredLetterValues(template, values);
    if (validationError) {
      setError(validationError);
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const result = await issueLetter(
        buildLetterRequest({
          template,
          recipient: { _id: employee._id },
          values,
          sendEmail: true,
        }),
      );
      const letterId = result.letter?._id;
      if (!letterId) {
        setError("Letter was issued but no id was returned");
        return;
      }
      setSuccess({
        letterId,
        letterNumber: result.letter?.letterNumber,
        emailed: result.emailed,
      });
    } catch (err: unknown) {
      setError(
        err instanceof ApiError ? err.message : "Failed to issue letter",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const onDownload = async () => {
    if (!success) return;
    try {
      await downloadIssuedLetter(
        success.letterId,
        issuedLetterFileName({ letterNumber: success.letterNumber }),
      );
    } catch (err: unknown) {
      setError(
        err instanceof ApiError ? err.message : "Could not download letter PDF",
      );
    }
  };

  const copy = letterFormCopy(template?.key);
  const fields = template?.inputFields || [];
  const isMultiline = (f: LetterTemplateInputField) => Boolean(f.multiline);
  const ordered = [...fields.filter((f) => !isMultiline(f)), ...fields.filter(isMultiline)];
  const setValue = (key: string, value: string) =>
    setValues((prev) => ({ ...prev, [key]: value }));
  const isAppointment = template?.key === "appointment";
  const printed: [string, string][] = employee
    ? [
        ["Employee Name", employee.name || "-"],
        ["Designation", employee.designation || "-"],
        ["Work Location", employee.location || "-"],
        ["Date of Joining", employee.dateOfJoining ? ddmmyyyy(new Date(employee.dateOfJoining)) : "-"],
      ]
    : [];

  const renderControl = (field: LetterTemplateInputField) => {
    const id = `issue-field-${field.key}`;
    const value = values[field.key] ?? "";
    if (field.options?.length) {
      return (
        <Select id={id} value={value} onChange={(e) => setValue(field.key, e.target.value)}>
          {field.options.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </Select>
      );
    }
    if (isMultiline(field)) {
      return (
        <TextArea
          id={id}
          rows={2}
          style={{ minHeight: 70 }}
          placeholder={field.key === "reason" ? "Enter reason here" : "Enter here"}
          value={value}
          onChange={(e) => setValue(field.key, e.target.value)}
        />
      );
    }
    const type =
      field.kind === "date" || field.kind === "date_past"
        ? "date"
        : field.kind === "number" || field.kind === "currency_annual" || field.kind === "currency_monthly"
          ? "number"
          : field.kind === "email"
            ? "email"
            : field.kind === "phone"
              ? "tel"
              : "text";
    return (
      <Input
        id={id}
        type={type}
        placeholder={type === "date" ? undefined : "Enter here"}
        value={value}
        onChange={(e) => setValue(field.key, e.target.value)}
      />
    );
  };

  return (
    <Modal
      open={open}
      title={template ? `Generate ${template.name || "Letter"}` : "Issue a letter"}
      onClose={handleClose}
      size="lg"
      footer={
        success ? (
          <>
            <Button type="button" variant="secondary" onClick={handleClose}>
              Close
            </Button>
            <Button type="button" onClick={() => void onDownload()}>
              Download PDF
            </Button>
          </>
        ) : (
          <>
            <Button
              type="button"
              variant="secondary"
              style={{ flex: "0 0 150px", marginLeft: "auto" }}
              onClick={handleClose}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button
              type="button"
              style={{ flex: "0 0 160px" }}
              onClick={() => void onIssue()}
              disabled={submitting || templateLoading || !template || !employee || Boolean(templatesError)}
            >
              {submitting ? "Generating…" : "Generate & Send"}
            </Button>
          </>
        )
      }
    >
      <div className="-mt-2 flex flex-col gap-wz-6">
        {success ? (
          <div
            className="rounded-wz-md border border-[#abefc6] bg-[#ecfdf3] px-3 py-2.5 text-sm text-[#067647]"
            role="status"
          >
            Letter generated{success.letterNumber ? ` · ${success.letterNumber}` : ""}
            {success.emailed ? " and emailed to the employee" : ""}. You can download the PDF now.
          </div>
        ) : null}

        {templatesError || error ? (
          <div
            className="rounded-wz-md border border-[#fecdca] bg-[#fef3f2] px-3 py-2.5 text-sm text-wz-error"
            role="alert"
          >
            {templatesError || error}
          </div>
        ) : null}

        {employee ? (
          <LetterSection title="Employee Details" subtitle="Auto captured from the selected employee">
            <EmployeeModalCard employee={employee} />
            {isAppointment ? (
              <>
                <p className="m-0 text-xs leading-[15px] text-wz-text-muted">
                  Information to be printed on the appointment letter
                </p>
                <div className="grid grid-cols-1 gap-wz-6 sm:grid-cols-2">
                  {printed.map(([label, value]) => (
                    <Field key={label} label={label}>
                      <Input value={value} disabled readOnly />
                    </Field>
                  ))}
                </div>
                <p className="m-0 text-xs leading-[15px] text-wz-text-muted">
                  CTC and the salary breakup (Annexure A) are taken from the employee&apos;s salary
                  structure. Update it on the Salary tab before generating.
                </p>
              </>
            ) : null}
          </LetterSection>
        ) : null}

        {!success && !template ? (
          <LetterSection title="Letter Type" subtitle="Choose the letter to generate for this employee">
            <Field label="Letter Type" htmlFor="issue-letter-template" required>
              <Select
                id="issue-letter-template"
                value={templateId}
                disabled={templatesLoading || templateLoading || Boolean(templatesError)}
                onChange={(e) => setTemplateId(e.target.value)}
              >
                <option value="">
                  {templatesLoading ? "Loading templates…" : templateLoading ? "Loading…" : "Select"}
                </option>
                {employeeTemplates.map((t) => (
                  <option key={t._id} value={t._id}>
                    {t.name || t.key || t._id}
                  </option>
                ))}
              </Select>
            </Field>
            {!templatesLoading && !templatesError && employeeTemplates.length === 0 ? (
              <p className="m-0 text-sm text-wz-text-muted">
                No active employee letter templates are available
                {recipientRule ? ` for “${recipientRule}”` : ""}.
              </p>
            ) : null}
          </LetterSection>
        ) : null}

        {!success && template && ordered.length ? (
          <LetterSection
            title={copy.title}
            subtitle={copy.subtitle}
            action={
              <button
                type="button"
                className="cursor-pointer border-0 bg-transparent p-0 text-[13px] font-semibold text-wz-primary"
                onClick={() => setTemplateId("")}
              >
                Change letter
              </button>
            }
            gap="lg"
          >
            <div className="grid grid-cols-1 gap-wz-6 sm:grid-cols-2">
              {ordered.map((field) => (
                <Field
                  key={field.key}
                  label={copy.labels[field.key] || field.label || field.key}
                  htmlFor={`issue-field-${field.key}`}
                  required={Boolean(field.required)}
                  className={isMultiline(field) ? "sm:col-span-2" : undefined}
                >
                  {renderControl(field)}
                </Field>
              ))}
            </div>
          </LetterSection>
        ) : null}
      </div>
    </Modal>
  );
}

const ddmmyyyy = (d: Date) =>
  Number.isNaN(d.getTime())
    ? "-"
    : `${String(d.getDate()).padStart(2, "0")}-${String(d.getMonth() + 1).padStart(2, "0")}-${d.getFullYear()}`;

/** Figma basic-information-card: #f8f9fa panel, 20 padding, 16px title over 12px muted copy. */
function LetterSection({
  title,
  subtitle,
  action,
  gap = "md",
  children,
}: {
  title: string;
  subtitle: string;
  action?: ReactNode;
  gap?: "md" | "lg";
  children: ReactNode;
}) {
  return (
    <section
      className={cn(
        "flex flex-col rounded-wz-xl border border-wz-border bg-wz-neutral-50 p-5",
        gap === "lg" ? "gap-wz-6" : "gap-4",
      )}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h3 className="m-0 text-base leading-5 font-semibold text-wz-heading">{title}</h3>
          <p className="m-0 text-xs leading-[15px] text-wz-text-muted">{subtitle}</p>
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}
