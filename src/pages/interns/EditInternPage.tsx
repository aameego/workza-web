import { Link, useParams } from "react-router-dom";
import { Button } from "../../design-system";
import { useInternDetail } from "../../hooks/useInterns";
import { ApiError } from "../../lib/apiClient";
import { mapInternToForm } from "./internForm";
import InternFormEditor from "./InternFormEditor";
import { canEditInternRecord } from "./internViewFormat";

export default function EditInternPage() {
  const { vendorSlug, internId } = useParams();
  const base = `/${vendorSlug || "app"}`;
  const viewPath = `${base}/employees/interns/${internId}`;

  const { data: intern, isLoading, isError, error, refetch } = useInternDetail(
    internId,
  );

  if (isLoading) {
    return (
      <div className="rounded-wz-xl border border-wz-border bg-white p-wz-6 text-sm text-wz-text-secondary">
        Loading intern…
      </div>
    );
  }

  if (isError || !intern) {
    return (
      <div className="rounded-wz-xl border border-wz-border bg-white p-wz-6">
        <p className="m-0 text-sm text-wz-error" role="alert">
          {error instanceof ApiError
            ? error.message
            : "Intern not found or could not be loaded."}
        </p>
        <div className="mt-wz-4 flex flex-wrap gap-wz-3">
          <Button type="button" variant="secondary" onClick={() => void refetch()}>
            Retry
          </Button>
          <Link
            to={`${base}/employees?type=intern`}
            className="inline-flex items-center text-sm font-semibold text-wz-primary no-underline hover:underline"
          >
            Back to interns
          </Link>
        </div>
      </div>
    );
  }

  if (!canEditInternRecord(intern)) {
    return (
      <div className="rounded-wz-xl border border-wz-border bg-white p-wz-6">
        <p className="m-0 text-sm text-wz-heading" role="status">
          This intern record cannot be edited because it has been{" "}
          {intern.internStatus === "converted" ? "converted to an employee" : "archived"}.
        </p>
        <Link
          to={viewPath}
          className="mt-wz-4 inline-flex text-sm font-semibold text-wz-primary no-underline hover:underline"
        >
          View intern profile
        </Link>
      </div>
    );
  }

  const hasAppLogin = Boolean(
    intern.hasAppLogin || intern.hasLoginEnabled || intern.linkedUser,
  );

  return (
    <InternFormEditor
      key={intern._id}
      mode="edit"
      internId={intern._id}
      hasAppLogin={hasAppLogin}
      initialValues={mapInternToForm(intern)}
      cancelTo={viewPath}
    />
  );
}