import { useMemo, useState } from "react";
import {
  Button,
  Card,
  showSuccessToast,
} from "../../design-system";
import { ApiError } from "../../lib/apiClient";
import {
  useOrganization,
  useUpdateOrganization,
  useUploadOrgLogo,
  useUploadOrgSignature,
  useUploadOrgStamp,
  useUploadSignatorySignature,
  useUploadSignatoryStamp,
} from "../../hooks/useOrganization";
import { OrganizationTabs, type SettingsTab } from "./components/OrganizationTabs";
import { OrganizationLogoUpload } from "./components/OrganizationLogoUpload";
import {
  OrganizationForm,
  type OrganizationFormData,
} from "./components/OrganizationForm";
import { LetterSignatory, type LetterSignatoryData } from "./components/LetterSignatory";
import { ConfigurationTab } from "./components/ConfigurationTab";
import { ProbationTab } from "./components/ProbationTab";
import { SignatureUpload } from "./components/SignatureUpload";
import { StampUpload } from "./components/StampUpload";
import {
  validateOrganizationForm,
  type OrgFormData,
} from "./validation";

const emptyForm: OrgFormData = {
  name: "",
  code: "",
  employeeCodePrefix: "",
  contactEmail: "",
  companyAddress: "",
  signatoryName: "",
  signatoryTitle: "",
  allowMultipleSignatures: false,
  signatories: [{ name: "", title: "" }],
};

export default function OrganizationPage() {
  const query = useOrganization(true);
  const updateMutation = useUpdateOrganization();
  const logoMutation = useUploadOrgLogo();
  const signatureMutation = useUploadOrgSignature();
  const stampMutation = useUploadOrgStamp();
  const signatorySignatureMutation = useUploadSignatorySignature();
  const signatoryStampMutation = useUploadSignatoryStamp();

  // Guarded by the loading/error branches below; handlers only run once data exists.
  const profile = query.data!;

  const [activeTab, setActiveTab] = useState<SettingsTab>("Organization");
  const [pendingEdits, setPendingEdits] = useState<Partial<OrgFormData>>({});
  // The query resolves after the first render. Store the toggle as an optional
  // override so the saved value is used as soon as the profile arrives, without
  // an effect that fights React's render cycle.
  const savedMultipleStamps = query.data?.allowMultipleSignatures ?? false;
  const [multipleStampsOverride, setMultipleStampsOverride] = useState<
    boolean | undefined
  >(undefined);
  const multipleStamps = multipleStampsOverride ?? savedMultipleStamps;
  const setMultipleStamps = (value: boolean) => setMultipleStampsOverride(value);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);

  /** Base form values hydrated from the API profile. */
  const baseForm: OrgFormData = useMemo(() => {
    if (!query.data) return emptyForm;
    const d = query.data;
    return {
      name: d.name,
      code: d.code,
      employeeCodePrefix: d.employeeCodePrefix,
      contactEmail: d.contactEmail,
      companyAddress: d.companyAddress,
      signatoryName: d.signatoryName,
      signatoryTitle: d.signatoryTitle,
      allowMultipleSignatures: d.allowMultipleSignatures ?? false,
      signatories: d.signatories ?? [{ name: "", title: "" }],
    };
  }, [query.data]);

  /** Effective form = API values + any pending local edits. */
  const form: OrgFormData = useMemo(
    () => ({ ...baseForm, ...pendingEdits }),
    [baseForm, pendingEdits],
  );

  /** OrganizationForm emits the full form; merge its five editable fields. */
  const handleOrganizationFormChange = (data: OrganizationFormData) => {
    setPendingEdits((prev) => ({
      ...prev,
      name: data.name,
      code: data.code,
      employeeCodePrefix: data.employeeCodePrefix,
      contactEmail: data.contactEmail,
      companyAddress: data.companyAddress,
    }));
  };

  /** Merge letter signatory data (incl. signatories array) into pending edits. */
  const handleLetterSignatoryChange = (data: LetterSignatoryData) => {
    setPendingEdits((prev) => ({ ...prev, ...data }));
  };

  /** Toggle multiple mode; seed the first signatory with the saved single signature. */
  const handleMultipleStampsChange = (checked: boolean) => {
    setMultipleStamps(checked);
    setPendingEdits((prev) => {
      const first = prev.signatories?.[0] ?? form.signatories[0] ?? { name: "", title: "" };
      const merged = {
        ...first,
        name: first.name || form.signatoryName,
        title: first.title || form.signatoryTitle,
        signatureDisplayUrl:
          first.signatureDisplayUrl || profile.signatureDisplayUrl,
        signatureImageUrl:
          first.signatureImageUrl || profile.signatureImageUrl,
        stampDisplayUrl: first.stampDisplayUrl || profile.stampDisplayUrl,
        stampImageUrl: first.stampImageUrl || profile.stampImageUrl,
      };
      const rest = (prev.signatories ?? form.signatories).slice(1);
      if (checked) {
        const seeded = [merged, ...rest];
        // A single saved signature with only a placeholder in the array counts
        // as one real signatory, so keep just that one seeded entry.
        return {
          ...prev,
          signatories: seeded.some((s) => s.signatureDisplayUrl || s.stampDisplayUrl)
            ? [merged]
            : seeded,
        };
      }
      return {
        ...prev,
        signatoryName: merged.name,
        signatoryTitle: merged.title,
      };
    });
  };

  /** Mirror a single-mode signature/stamp upload into the first signatory. */
  const syncSingleImageToSignatory = async (
    kind: "signature" | "stamp",
    imageUrl: string,
    displayUrl: string,
  ) => {
    setPendingEdits((prev) => {
      const first = prev.signatories?.[0] ?? form.signatories[0] ?? { name: "", title: "" };
      const key = kind === "signature" ? "signatureImageUrl" : "stampImageUrl";
      const displayKey = kind === "signature" ? "signatureDisplayUrl" : "stampDisplayUrl";
      return {
        ...prev,
        signatories: [
          { ...first, [key]: imageUrl, [displayKey]: displayUrl },
          ...(prev.signatories ?? form.signatories).slice(1),
        ],
      };
    });
  };

  const handleFileUpload = async (
    file: File,
    kind: "logo" | "signature" | "stamp",
  ) => {
    setSubmitError(null);
    try {
      if (kind === "logo") {
        await logoMutation.mutateAsync(file);
      } else if (kind === "signature") {
        const data = await signatureMutation.mutateAsync(file);
        await syncSingleImageToSignatory("signature", data.signatureImageUrl, data.signatureDisplayUrl);
      } else {
        const data = await stampMutation.mutateAsync(file);
        await syncSingleImageToSignatory("stamp", data.stampImageUrl, data.stampDisplayUrl);
      }
    } catch (err) {
      setSubmitError(
        err instanceof ApiError ? err.message : "Upload failed.",
      );
    }
  };

  const handleSave = async () => {
    setSubmitError(null);
    const errors = validateOrganizationForm(form);
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;

    try {
      await updateMutation.mutateAsync({
        name: form.name,
        code: form.code,
        companyAddress: form.companyAddress,
        contactEmail: form.contactEmail,
        employeeCodePrefix: form.employeeCodePrefix,
        signatoryName: form.signatoryName,
        signatoryTitle: form.signatoryTitle,
        allowMultipleSignatures: multipleStamps,
        signatories: form.signatories,
      });
      setPendingEdits({});
      setMultipleStampsOverride(undefined);
      setFieldErrors({});
      setSubmitError(null);
      showSuccessToast("Organization details saved.");
    } catch (err) {
      setSubmitError(
        err instanceof ApiError ? err.message : "Could not save details.",
      );
    }
  };

  return (
    <div className="mx-auto flex w-full min-w-0 max-w-[1150px] flex-col gap-wz-6">
      <OrganizationTabs activeTab={activeTab} onTabChange={setActiveTab} />

      {activeTab === "Configuration" ? (
        <ConfigurationTab />
      ) : activeTab === "Probation" ? (
        <ProbationTab />
      ) : activeTab !== "Organization" ? (
        <Card className="w-full">
          <h2 className="m-0 text-base font-semibold text-wz-heading">{activeTab}</h2>
          <p className="m-0 mt-1 text-sm text-wz-text-muted">
            This section is coming soon.
          </p>
        </Card>
      ) : query.isLoading ? (
        <Card className="w-full">
          <p className="m-0 text-sm text-wz-text-secondary">
            Loading organization profile…
          </p>
        </Card>
      ) : query.isError ? (
        <Card className="w-full">
          <h1 className="m-0 text-lg font-semibold text-wz-text-primary">
            Organization Profile
          </h1>
          <p className="m-0 mt-2 text-sm text-wz-error">
            {query.error instanceof Error
              ? query.error.message
              : "Failed to load organization profile."}
          </p>
        </Card>
      ) : (
        <>
      {submitError ? (
        <p className="m-0 rounded-wz-md bg-[#fef3f2] px-3 py-2 text-sm text-[#b42318]" role="alert">
          {submitError}
        </p>
      ) : null}

      <Card className="w-full space-y-wz-6">
        {/* Header inside the card */}
        <div className="flex flex-col gap-wz-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="m-0 text-xl font-semibold text-wz-text-primary">
              Organization Profile
            </h1>
            <p className="m-0 mt-1 text-sm text-wz-text-secondary">
              Company details and logo shown on salary slips and letters.
            </p>
          </div>
          <Button
            type="button"
            variant="primary"
            disabled={updateMutation.isPending}
            onClick={handleSave}
          >
            {updateMutation.isPending ? "Saving…" : "Save Details"}
          </Button>
        </div>
        {/* Upload logo */}
        <OrganizationLogoUpload
          previewUrl={profile.logoDisplayUrl || ""}
          isPending={logoMutation.isPending}
          onUpload={(file) => void handleFileUpload(file, "logo")}
        />

        {/* Form grid */}
        <OrganizationForm data={form} onChange={handleOrganizationFormChange} />

        {/* Surface first field error as a banner. */}
        {Object.values(fieldErrors).length > 0 ? (
          <div className="rounded-wz-md border border-wz-error/35 bg-wz-error/8 px-3.5 py-2.5 text-xs text-wz-error" role="alert">
            {Object.values(fieldErrors)[0]}
          </div>
        ) : null}

        {/* Letter signatory */}
        <LetterSignatory
          data={{
            signatoryName: form.signatoryName,
            signatoryTitle: form.signatoryTitle,
            signatories: form.signatories,
          }}
          onChange={handleLetterSignatoryChange}
          multipleStamps={multipleStamps}
          onMultipleStampsChange={handleMultipleStampsChange}
          onUploadSignature={(index, file) =>
            void signatorySignatureMutation.mutateAsync({ index, file })
          }
          onUploadStamp={(index, file) =>
            void signatoryStampMutation.mutateAsync({ index, file })
          }
        />

        {!multipleStamps && (
          <div className="grid grid-cols-1 gap-wz-6 lg:grid-cols-2">
            <SignatureUpload
              previewUrl={profile.signatureDisplayUrl || ""}
              isPending={signatureMutation.isPending}
              onUpload={(file) => void handleFileUpload(file, "signature")}
            />
            <StampUpload
              previewUrl={profile.stampDisplayUrl || ""}
              isPending={stampMutation.isPending}
              onUpload={(file) => void handleFileUpload(file, "stamp")}
            />
          </div>
        )}
      </Card>
        </>
      )}
    </div>
  );
}
