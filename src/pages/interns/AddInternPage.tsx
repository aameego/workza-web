import { createEmptyInternForm } from "./internForm";
import InternFormEditor from "./InternFormEditor";

export default function AddInternPage() {
  return (
    <InternFormEditor mode="create" initialValues={createEmptyInternForm()} />
  );
}