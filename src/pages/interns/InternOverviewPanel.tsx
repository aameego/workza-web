import type { InternDetail } from "../../services/internTypes";
import {
  displayValue,
  formatDateDisplay,
  managerDisplayName,
  maskAadhaar,
  maskAccountNumber,
} from "../employees/employeeViewFormat";
import {
  EmployeeInfoField,
  EmployeeInfoRow,
  EmployeeSectionHeader,
} from "../employees/EmployeeInfoField";
import {
  formatInternStipend,
  internDeptName,
  internPersonName,
} from "./internViewFormat";

export type InternOverviewPanelProps = {
  intern: InternDetail;
};

export default function InternOverviewPanel({ intern }: InternOverviewPanelProps) {
  return (
    <div className="flex w-full flex-col gap-wz-6">
      <section className="rounded-wz-xl border border-wz-border bg-white p-wz-6">
        <EmployeeSectionHeader title="Basic Information" />
        <div className="mt-wz-4 flex flex-col gap-wz-4">
          <EmployeeInfoRow>
            <EmployeeInfoField label="Intern Code" value={displayValue(intern.employeeCode)} />
            <EmployeeInfoField label="Email" value={displayValue(intern.email)} />
            <EmployeeInfoField label="Phone" value={displayValue(intern.phone)} />
          </EmployeeInfoRow>
          <EmployeeInfoRow>
            <EmployeeInfoField label="Department" value={internDeptName(intern)} />
            <EmployeeInfoField label="Designation" value={displayValue(intern.designation)} />
            <EmployeeInfoField label="Location" value={displayValue(intern.location)} />
          </EmployeeInfoRow>
        </div>
      </section>

      <section className="rounded-wz-xl border border-wz-border bg-white p-wz-6">
        <EmployeeSectionHeader title="Internship" />
        <div className="mt-wz-4 flex flex-col gap-wz-4">
          <EmployeeInfoRow>
            <EmployeeInfoField
              label="Start Date"
              value={formatDateDisplay(intern.internshipStartDate)}
            />
            <EmployeeInfoField
              label="End Date"
              value={formatDateDisplay(intern.internshipEndDate)}
            />
            <EmployeeInfoField
              label="Stipend"
              value={formatInternStipend(intern.stipendAmount, intern.stipendFrequency)}
            />
          </EmployeeInfoRow>
          <EmployeeInfoRow>
            <EmployeeInfoField
              label="University / Institute"
              value={displayValue(intern.universityOrInstitute)}
            />
            <EmployeeInfoField
              label="Course / Program"
              value={displayValue(intern.courseOrProgram)}
            />
            <EmployeeInfoField
              label="Expected Graduation"
              value={formatDateDisplay(intern.expectedGraduationDate)}
            />
          </EmployeeInfoRow>
          <EmployeeInfoRow>
            <EmployeeInfoField
              label="Mentor"
              value={internPersonName(intern.mentorId)}
            />
            <EmployeeInfoField
              label="Reporting Manager"
              value={managerDisplayName(intern.reportingManagerId)}
            />
          </EmployeeInfoRow>
        </div>
      </section>

      <section className="rounded-wz-xl border border-wz-border bg-white p-wz-6">
        <EmployeeSectionHeader title="Personal & Identity" />
        <div className="mt-wz-4 flex flex-col gap-wz-4">
          <EmployeeInfoRow>
            <EmployeeInfoField label="Date of Birth" value={formatDateDisplay(intern.dob)} />
            <EmployeeInfoField label="Gender" value={displayValue(intern.gender)} />
            <EmployeeInfoField label="Blood Group" value={displayValue(intern.bloodGroup)} />
          </EmployeeInfoRow>
          <EmployeeInfoRow>
            <EmployeeInfoField label="Father / Husband Name" value={displayValue(intern.fatherHusbandName)} />
            <EmployeeInfoField label="Relation" value={displayValue(intern.relationWithMember)} />
            <EmployeeInfoField label="Nationality" value={displayValue(intern.nationality)} />
          </EmployeeInfoRow>
          <EmployeeInfoRow>
            <EmployeeInfoField label="Marital Status" value={displayValue(intern.maritalStatus)} />
          </EmployeeInfoRow>
          <EmployeeInfoRow>
            <EmployeeInfoField label="Aadhaar" value={maskAadhaar(intern.aadhaarNumber)} />
            <EmployeeInfoField label="PAN" value={displayValue(intern.panNumber)} />
            <EmployeeInfoField
              label="Emergency Contact"
              value={displayValue(intern.emergencyContact)}
            />
          </EmployeeInfoRow>
          <EmployeeInfoField
            label="Permanent Address"
            value={displayValue(intern.permanentAddress)}
            fullWidth
          />
        </div>
      </section>

      <section className="rounded-wz-xl border border-wz-border bg-white p-wz-6">
        <EmployeeSectionHeader title="Bank & Education" />
        <div className="mt-wz-4 flex flex-col gap-wz-4">
          <EmployeeInfoRow>
            <EmployeeInfoField label="Bank" value={displayValue(intern.bankName)} />
            <EmployeeInfoField
              label="Account Holder"
              value={displayValue(intern.accountHolderName)}
            />
            <EmployeeInfoField
              label="Account Number"
              value={maskAccountNumber(intern.accountNumber)}
            />
          </EmployeeInfoRow>
          <EmployeeInfoRow>
            <EmployeeInfoField label="IFSC" value={displayValue(intern.ifscCode)} />
            <EmployeeInfoField
              label="Highest Qualification"
              value={displayValue(intern.highestQualification)}
            />
          </EmployeeInfoRow>
        </div>
      </section>
    </div>
  );
}