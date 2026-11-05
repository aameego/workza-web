import * as XLSX from "xlsx";

export type BulkTemplateOptions = {
  /** Label used in department column header — "Department" or "Site" */
  orgUnitLabel?: string;
  sampleStructureName?: string;
};

/** Rows match CRA template + backend importer (title row skipped via range:1). */
export function buildEmployeeBulkTemplateRows(
  options: BulkTemplateOptions = {},
): (string | number)[][] {
  const orgUnitLabel = options.orgUnitLabel || "Department";
  const sampleStructure =
    options.sampleStructureName || "Copy_Structure_Name";

  return [
    [
      "Employee Bulk Upload Template — keep this row; enter employees below the headers. Only Name is required. For salary, copy a Salary Structure name into the last column and enter the annual CTC in the CTC column.",
    ],
    [
      "EmployeeCode",
      "Name",
      "Email",
      "Phone",
      "Designation",
      `${orgUnitLabel}Id / Name`,
      "Client",
      "workLocation",
      "DOB",
      "DOJ",
      "Date Of Exit",
      "Gender",
      "Father/Husband Name",
      "Relation",
      "Nationality",
      "Marital Status",
      "Permanent Address",
      "Blood Group",
      "Emergency Contact",
      "Highest Qualification",
      "Aadhaar Number",
      "Name as on Aadhaar",
      "PAN Number",
      "Name as on PAN",
      "UAN",
      "ESIC No",
      "PF Number",
      "Bank Name",
      "Bank Account Number",
      "Bank IFSC",
      "Name as per Bank details",
      "CTC",
      "CTC Structure / Template Name",
    ],
    [
      "EMP001",
      "Ravi Kumar",
      "ravi.kumar@example.com",
      "9876543210",
      "Field Executive",
      `Copy_the_${orgUnitLabel}_ID_OR_Name`,
      "Client_Name",
      "Delhi",
      "1995-08-20",
      "2026-01-15",
      "2027-01-15",
      "Male",
      "Suresh Kumar",
      "Father",
      "Indian",
      "Married",
      "H.No 123, Sector 15, Gurgaon, Haryana",
      "O+",
      "9876543211",
      "Graduate",
      "123456789012",
      "Ravi Kumar",
      "ABCDE1234F",
      "Ravi Kumar",
      "100200300400",
      "1234567890",
      "PF12345",
      "State Bank of India",
      "98765432101234",
      "SBIN0001234",
      "Ravi Kumar",
      "360000",
      sampleStructure,
    ],
  ];
}

export function downloadEmployeeBulkTemplate(
  options: BulkTemplateOptions = {},
): void {
  const rows = buildEmployeeBulkTemplateRows(options);
  const ws = XLSX.utils.aoa_to_sheet(rows);
  ws["!cols"] = rows[1].map((header) => ({
    wch: Math.min(Math.max(String(header).length + 2, 12), 35),
  }));
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Employees");
  XLSX.writeFile(wb, "employee-bulk-upload-template.xlsx");
}

export type BulkUploadResult = {
  inserted?: number;
  skipped?: number;
  errors?: string[];
  message?: string;
};

export function formatBulkUploadMessage(result: BulkUploadResult): string {
  const inserted = result.inserted ?? 0;
  const skipped = result.skipped ?? 0;
  let message = `Upload Complete: ${inserted} inserted, ${skipped} skipped`;
  const errors = Array.isArray(result.errors) ? result.errors : [];
  if (errors.length > 0) {
    message += `\n\nErrors:\n${errors.join("\n")}`;
  }
  return message;
}

export function isExcelUploadFile(file: File | null | undefined): boolean {
  if (!file) return false;
  const name = file.name.toLowerCase();
  return name.endsWith(".xlsx") || name.endsWith(".xls");
}
