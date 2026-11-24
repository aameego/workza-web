import { Field, Input } from "../../../design-system";

export interface OrganizationFormData {
  name: string;
  code: string;
  employeeCodePrefix: string;
  contactEmail: string;
  companyAddress: string;
}

export interface OrganizationFormProps {
  data: OrganizationFormData;
  onChange: (data: OrganizationFormData) => void;
}

export function OrganizationForm({
  data,
  onChange,
}: OrganizationFormProps) {
  const setField = (key: keyof OrganizationFormData, value: string) => {
    onChange({ ...data, [key]: value });
  };

  return (
    <div className="grid grid-cols-1 gap-wz-5 lg:grid-cols-2">
      <Field label="Organization Name" required>
        <Input
          placeholder="e.g. Acme Services Pvt. Ltd."
          value={data.name}
          onChange={(e) => setField("name", e.target.value)}
        />
      </Field>

      <Field label="Organization Code" required>
        <Input
          value={data.code}
          disabled
          className="bg-wz-neutral-100 text-wz-text-muted"
        />
      </Field>

      <Field
        label="Employee Code Prefix"
        required
        hint="New employees get codes like NA-1, NA-2, …."
      >
        <Input
          value={data.employeeCodePrefix}
          onChange={(e) => setField("employeeCodePrefix", e.target.value)}
        />
      </Field>

      <Field label="HR / Payroll Contact Email">
        <Input
          type="email"
          placeholder="e.g. hr@company.com"
          value={data.contactEmail}
          onChange={(e) => setField("contactEmail", e.target.value)}
        />
      </Field>

      <Field label="Company Address" className="lg:col-span-2">
        <Input
          placeholder="e.g. Suite 1209, 12th Floor, Block-B, Vatika Business Park, Gurugram"
          value={data.companyAddress}
          onChange={(e) => setField("companyAddress", e.target.value)}
        />
      </Field>
    </div>
  );
}
