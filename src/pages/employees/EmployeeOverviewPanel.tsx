import type { EmployeeDetail } from "../../services/employeeTypes";
import {
  EmployeeInfoField,
  EmployeeInfoRow,
  EmployeeSectionHeader,
} from "./EmployeeInfoField";
import {
  coverageLabel,
  displayValue,
  formatDateDisplay,
  formatDateIso,
  managerDisplayName,
  maskAadhaar,
  maskAccountNumber,
} from "./employeeViewFormat";

export type EmployeeOverviewPanelProps = {
  employee: EmployeeDetail;
};

export default function EmployeeOverviewPanel({
  employee,
}: EmployeeOverviewPanelProps) {
  const family = Array.isArray(employee.familyMembers)
    ? employee.familyMembers
    : [];
  const accessRole =
    employee.linkedUser?.role || employee.userRole || "Employee";
  const appAccessOn = Boolean(
    employee.hasAppLogin && employee.hasLoginEnabled,
  );

  return (
    <div className="flex w-full flex-col gap-wz-6">
      {/* Card 1 — Personal / Emergency / Family (Figma Left-View-Column) */}
      <section className="flex w-full flex-col gap-wz-6 rounded-wz-xl border border-wz-border bg-white p-wz-6">
        <div className="flex w-full flex-col gap-wz-4">
          <EmployeeSectionHeader title="Personal & Contact Details" />
          <div className="flex w-full flex-col gap-wz-4">
            <EmployeeInfoRow>
              <EmployeeInfoField
                label="Email Address"
                value={displayValue(employee.email)}
              />
              <EmployeeInfoField
                label="Phone Number"
                value={displayValue(employee.phone)}
              />
            </EmployeeInfoRow>
            <EmployeeInfoRow>
              <EmployeeInfoField
                label="Department"
                value={displayValue(employee.department)}
              />
              <EmployeeInfoField
                label="Designation"
                value={displayValue(employee.designation)}
              />
            </EmployeeInfoRow>
            <EmployeeInfoRow>
              <EmployeeInfoField
                label="Gender"
                value={displayValue(employee.gender)}
              />
              <EmployeeInfoField
                label="Blood Group"
                value={displayValue(employee.bloodGroup)}
              />
            </EmployeeInfoRow>
            <EmployeeInfoRow>
              <EmployeeInfoField
                label="Nationality"
                value={displayValue(employee.nationality)}
              />
              <EmployeeInfoField
                label="Marital Status"
                value={displayValue(employee.maritalStatus)}
              />
            </EmployeeInfoRow>
            <EmployeeInfoField
              fullWidth
              label="Permanent Address"
              value={displayValue(
                employee.permanentAddress || employee.address,
              )}
            />
          </div>
        </div>

        <div className="flex w-full flex-col gap-wz-4">
          <EmployeeSectionHeader title="Emergency Contact & Medical" />
          <div className="flex w-full flex-col gap-wz-4">
            <EmployeeInfoRow>
              <EmployeeInfoField
                label="Father/ Husband Name"
                value={displayValue(employee.fatherHusbandName)}
              />
              <EmployeeInfoField
                label="Relationship with Member"
                value={displayValue(employee.relationWithMember)}
              />
            </EmployeeInfoRow>
            <EmployeeInfoRow>
              <EmployeeInfoField
                label="Emergency Contact Name"
                value={displayValue(employee.fatherHusbandName)}
              />
              <EmployeeInfoField
                label="Emergency Contact Number"
                value={displayValue(employee.emergencyContact)}
              />
            </EmployeeInfoRow>
          </div>
        </div>

        <div className="flex w-full flex-col gap-wz-4">
          <EmployeeSectionHeader title="Family Members (ESIC / Medical)" />
          {family.length === 0 ? (
            <p className="m-0 text-sm font-semibold text-[#0a1f4a]">—</p>
          ) : (
            <div className="flex w-full flex-col gap-wz-6">
              {family.map((member, index) => (
                <div
                  key={`${member.name || "member"}-${index}`}
                  className="flex w-full flex-col gap-wz-4"
                >
                  <EmployeeInfoRow>
                    <EmployeeInfoField
                      label={`Family Member ${index + 1} Name`}
                      value={displayValue(member.name)}
                    />
                    <EmployeeInfoField
                      label="Relationship with Member"
                      value={displayValue(member.relation)}
                    />
                  </EmployeeInfoRow>
                  <EmployeeInfoRow>
                    <EmployeeInfoField
                      label="Member Date of Birth"
                      value={formatDateDisplay(member.dob)}
                    />
                    <EmployeeInfoField
                      label="Covered Under"
                      value={coverageLabel(member.coverage)}
                    />
                  </EmployeeInfoRow>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Card 2 — Employment / Statutory / Bank (Figma Right-View-Column) */}
      <section className="flex w-full flex-col gap-wz-6 rounded-wz-xl border border-wz-border bg-white p-wz-6">
        <div className="flex w-full flex-col gap-wz-4">
          <EmployeeSectionHeader title="Employment & System Configuration" />
          <div className="flex w-full flex-col gap-wz-4">
            <EmployeeInfoRow>
              <EmployeeInfoField
                label="Reporting Manager"
                value={managerDisplayName(employee.managerId)}
              />
              <EmployeeInfoField
                label="People Manager"
                value={managerDisplayName(employee.peopleManagerId)}
              />
            </EmployeeInfoRow>
            <EmployeeInfoRow>
              <EmployeeInfoField
                label="Date of Birth"
                value={formatDateIso(employee.dob)}
              />
              <EmployeeInfoField
                label="Date of Joining"
                value={formatDateIso(employee.dateOfJoining)}
              />
            </EmployeeInfoRow>
            <EmployeeInfoRow>
              <EmployeeInfoField
                label="Work Location"
                value={displayValue(employee.location)}
              />
              <EmployeeInfoField label="Access Role" value={accessRole} />
            </EmployeeInfoRow>
            <div className="flex items-center gap-3">
              <span
                className={
                  appAccessOn
                    ? "relative inline-flex h-6 w-11 shrink-0 rounded-wz-full bg-wz-primary"
                    : "relative inline-flex h-6 w-11 shrink-0 rounded-wz-full bg-wz-neutral-300"
                }
                aria-hidden
              >
                <span
                  className={
                    appAccessOn
                      ? "absolute top-0.5 left-[22px] size-5 rounded-wz-full bg-white shadow"
                      : "absolute top-0.5 left-0.5 size-5 rounded-wz-full bg-white shadow"
                  }
                />
              </span>
              <p className="m-0 text-base font-semibold text-[#6c757d]">
                Mobile & Desktop App Access{" "}
                {appAccessOn ? "Enabled" : "Disabled"}
              </p>
            </div>
          </div>
        </div>

        <div className="flex w-full flex-col gap-wz-4">
          <EmployeeSectionHeader title="Statutory & Compliance" />
          <div className="flex w-full flex-col gap-wz-4">
            <EmployeeInfoRow>
              <EmployeeInfoField
                label="Aadhaar Card"
                value={maskAadhaar(employee.aadhaarNumber)}
              />
              <EmployeeInfoField
                label="Aadhaar Card Holder Name"
                value={displayValue(employee.nameAsPerAadhaar)}
              />
            </EmployeeInfoRow>
            <EmployeeInfoRow>
              <EmployeeInfoField
                label="PAN Card"
                value={displayValue(employee.panNumber)}
              />
              <EmployeeInfoField
                label="PAN Card Holder Name"
                value={displayValue(employee.nameAsPerPan)}
              />
            </EmployeeInfoRow>
            <EmployeeInfoRow>
              <EmployeeInfoField
                label="UAN Number"
                value={displayValue(employee.uan)}
              />
              <EmployeeInfoField
                label="ESIC Number"
                value={displayValue(employee.esicNumber)}
              />
            </EmployeeInfoRow>
            <EmployeeInfoField
              fullWidth
              label="PF Number"
              value={displayValue(employee.pfNumber)}
            />
          </div>
        </div>

        <div className="flex w-full flex-col gap-wz-4">
          <EmployeeSectionHeader title="Bank Details" />
          <div className="flex w-full flex-col gap-wz-4">
            <EmployeeInfoRow>
              <EmployeeInfoField
                label="Bank Name"
                value={displayValue(employee.bankName)}
              />
              <EmployeeInfoField
                label="Account Holder Name"
                value={displayValue(employee.accountHolderName)}
              />
            </EmployeeInfoRow>
            <EmployeeInfoRow>
              <EmployeeInfoField
                label="Account Number"
                value={maskAccountNumber(employee.accountNumber)}
              />
              <EmployeeInfoField
                label="IFSC Code"
                value={displayValue(employee.ifscCode)}
              />
            </EmployeeInfoRow>
          </div>
        </div>
      </section>
    </div>
  );
}
