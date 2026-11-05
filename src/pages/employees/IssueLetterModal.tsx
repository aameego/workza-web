import { useEffect, useMemo, useState } from "react";
import { Button, Field, Input, Modal, Select, TextArea } from "../../design-system";
import { ApiError } from "../../lib/apiClient";
import { downloadIssuedLetter, issueLetter } from "../../services/letterService";
import { getLetterTemplate, getLetterTemplates } from "../../services/letterTemplateService";
import type {
  LetterTemplate,
  LetterTemplateSummary,
} from "../../services/letterTypes";
import type { EmployeeListItem } from "../../services/employeeTypes";
import {
  buildLetterRequest,
  validateRequiredLetterValues,
} from "./buildLetterRequest";
import {
  filterIssuableTemplates,
  issuedLetterFileName,
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
  const [sendEmail, setSendEmail] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<{
    letterId: string;
    letterNumber?: string;
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
    setSendEmail(false);
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
          initial[field.key] = "";
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
          sendEmail,
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

  const recipientLabel =
    employee?.name || employee?.employeeCode || "this employee";

  return (
    <Modal
      open={open}
      title="Issue a letter"
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
              onClick={handleClose}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={() => void onIssue()}
              disabled={
                submitting ||
                templateLoading ||
                !template ||
                !employee ||
                Boolean(templatesError)
              }
            >
              {submitting ? "Issuing…" : "Issue letter"}
            </Button>
          </>
        )
      }
    >
      <div className="flex flex-col gap-wz-4">
        <p className="m-0 text-sm text-wz-text-secondary">
          Issuing to <span className="font-semibold text-wz-text">{recipientLabel}</span>
          {employee?.employeeCode ? (
            <span className="text-wz-text-secondary">
              {" "}
              ({employee.employeeCode})
            </span>
          ) : null}
          .
        </p>

        {success ? (
          <div
            className="rounded-wz-md border border-[#abefc6] bg-[#ecfdf3] px-3 py-2.5 text-sm text-[#067647]"
            role="status"
          >
            Letter issued
            {success.letterNumber ? ` · ${success.letterNumber}` : ""}. You can
            download the PDF now.
          </div>
        ) : null}

        {templatesError ? (
          <div
            className="rounded-wz-md border border-[#fecdca] bg-[#fef3f2] px-3 py-2.5 text-sm text-wz-error"
            role="alert"
          >
            {templatesError}
          </div>
        ) : null}

        {error ? (
          <div
            className="rounded-wz-md border border-[#fecdca] bg-[#fef3f2] px-3 py-2.5 text-sm text-wz-error"
            role="alert"
          >
            {error}
          </div>
        ) : null}

        {!success ? (
          <>
            <Field label="Template" htmlFor="issue-letter-template" required>
              <Select
                id="issue-letter-template"
                value={templateId}
                disabled={templatesLoading || Boolean(templatesError)}
                onChange={(e) => setTemplateId(e.target.value)}
              >
                <option value="">
                  {templatesLoading
                    ? "Loading templates…"
                    : "Select a template"}
                </option>
                {employeeTemplates.map((t) => (
                  <option key={t._id} value={t._id}>
                    {t.name || t.key || t._id}
                  </option>
                ))}
              </Select>
            </Field>

            {!templatesLoading &&
            !templatesError &&
            employeeTemplates.length === 0 ? (
              <p className="m-0 text-sm text-wz-text-secondary">
                No active employee letter templates are available
                {recipientRule ? ` for “${recipientRule}”` : ""}.
              </p>
            ) : null}

            {templateLoading ? (
              <p className="m-0 text-sm text-wz-text-secondary">
                Loading template fields…
              </p>
            ) : null}

            {template?.inputFields?.map((field) => {
              const multiline =
                field.kind === "long_text" || Boolean(field.multiline);
              return (
                <Field
                  key={field.key}
                  label={field.label || field.key}
                  htmlFor={`issue-field-${field.key}`}
                  required={Boolean(field.required)}
                >
                  {field.options?.length ? (
                    <Select
                      id={`issue-field-${field.key}`}
                      value={values[field.key] ?? ""}
                      onChange={(e) =>
                        setValues((prev) => ({
                          ...prev,
                          [field.key]: e.target.value,
                        }))
                      }
                    >
                      <option value="">Select…</option>
                      {field.options.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </Select>
                  ) : multiline ? (
                    <TextArea
                      id={`issue-field-${field.key}`}
                      rows={3}
                      value={values[field.key] ?? ""}
                      onChange={(e) =>
                        setValues((prev) => ({
                          ...prev,
                          [field.key]: e.target.value,
                        }))
                      }
                    />
                  ) : (
                    <Input
                      id={`issue-field-${field.key}`}
                      type={
                        field.kind === "date" || field.kind === "date_past"
                          ? "date"
                          : field.kind === "number" ||
                              field.kind === "currency_annual" ||
                              field.kind === "currency_monthly"
                            ? "number"
                            : field.kind === "email"
                              ? "email"
                              : field.kind === "phone"
                                ? "tel"
                                : "text"
                      }
                      value={values[field.key] ?? ""}
                      onChange={(e) =>
                        setValues((prev) => ({
                          ...prev,
                          [field.key]: e.target.value,
                        }))
                      }
                    />
                  )}
                </Field>
              );
            })}

            <label className="flex cursor-pointer items-center gap-2 text-sm text-wz-text">
              <input
                type="checkbox"
                className="size-4 accent-wz-primary"
                checked={sendEmail}
                onChange={(e) => setSendEmail(e.target.checked)}
              />
              Email the letter to the employee
            </label>
          </>
        ) : null}
      </div>
    </Modal>
  );
}
