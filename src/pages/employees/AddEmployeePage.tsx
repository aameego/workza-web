import { useSearchParams } from "react-router-dom";
import { createEmptyEmployeeForm } from "./employeeForm";
import EmployeeFormEditor from "./EmployeeFormEditor";

export default function AddEmployeePage() {
  const [searchParams] = useSearchParams();
  const isConsultancy = searchParams.get("type") === "consultancy";

  return (
    <EmployeeFormEditor
      mode="create"
      initialValues={createEmptyEmployeeForm({ isConsultancy })}
    />
  );
}
