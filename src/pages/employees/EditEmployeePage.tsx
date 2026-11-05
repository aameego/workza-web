import { Link, useParams } from "react-router-dom";
import { Button } from "../../design-system";
import { useEmployee } from "../../hooks/useEmployees";
import { ApiError } from "../../lib/apiClient";
import { employeeDetailToForm } from "./employeeForm";
import EmployeeFormEditor from "./EmployeeFormEditor";

export default function EditEmployeePage() {
  const { vendorSlug, employeeId } = useParams();
  const base = `/${vendorSlug || "app"}`;
  const viewPath = `${base}/employees/${employeeId}`;

  const { data: employee, isLoading, isError, error, refetch } = useEmployee(
    employeeId,
  );

  if (isLoading) {
    return (
      <div className="rounded-wz-xl border border-wz-border bg-white p-wz-6 text-sm text-wz-text-secondary">
        Loading employee…
      </div>
    );
  }

  if (isError || !employee) {
    return (
      <div className="rounded-wz-xl border border-wz-border bg-white p-wz-6">
        <p className="m-0 text-sm text-wz-error" role="alert">
          {error instanceof ApiError
            ? error.message
            : "Employee not found or could not be loaded."}
        </p>
        <div className="mt-wz-4 flex flex-wrap gap-wz-3">
          <Button type="button" variant="secondary" onClick={() => void refetch()}>
            Retry
          </Button>
          <Link
            to={`${base}/employees`}
            className="inline-flex items-center text-sm font-semibold text-wz-primary no-underline hover:underline"
          >
            Back to employees
          </Link>
        </div>
      </div>
    );
  }

  const hasAppLogin = Boolean(
    employee.hasAppLogin || employee.hasLoginEnabled || employee.linkedUser,
  );

  return (
    <div className="mx-auto w-full max-w-[1200px] pb-wz-6">
      <EmployeeFormEditor
        key={employee._id}
        mode="edit"
        employeeId={employee._id}
        hasAppLogin={hasAppLogin}
        initialValues={employeeDetailToForm(employee)}
        cancelTo={viewPath}
      />
    </div>
  );
}
