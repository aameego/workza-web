import { api } from "../lib/apiClient";

export type Signatory = {
  name: string;
  title: string;
  signatureImageUrl?: string;
  signatureDisplayUrl?: string;
  stampImageUrl?: string;
  stampDisplayUrl?: string;
};

export type OrganizationProfile = {
  name: string;
  code: string;
  companyAddress: string;
  contactEmail: string;
  employeeCodePrefix: string;
  logoUrl: string;
  logoDisplayUrl: string;
  signatoryName: string;
  signatoryTitle: string;
  allowMultipleSignatures: boolean;
  signatories: Signatory[];
  signatureImageUrl: string;
  signatureDisplayUrl: string;
  stampImageUrl: string;
  stampDisplayUrl: string;
};

export type OrganizationProfileUpdate = {
  name?: string;
  code?: string;
  companyAddress?: string;
  contactEmail?: string;
  employeeCodePrefix?: string;
  signatoryName?: string;
  signatoryTitle?: string;
  allowMultipleSignatures?: boolean;
  signatories?: Signatory[];
};

/** GET /api/vendor/profile — fetch the organisation profile. */
export const getOrgProfile = async (): Promise<OrganizationProfile> => {
  const data = await api.get<{
    success: boolean;
    data: OrganizationProfile;
  }>("/vendor/profile");
  return data.data;
};

/** PUT /api/vendor/profile — update the organisation profile. */
export const updateOrgProfile = async (
  payload: OrganizationProfileUpdate,
): Promise<OrganizationProfile> => {
  const data = await api.put<{
    success: boolean;
    message: string;
    data: OrganizationProfile;
  }>("/vendor/profile", { json: payload });
  return data.data;
};

/** POST /api/vendor/logo — upload the organisation logo. */
export const uploadOrgLogo = async (
  file: File,
): Promise<{ logoUrl: string; logoDisplayUrl: string }> => {
  const formData = new FormData();
  formData.append("logo", file);
  const data = await api.post<{
    success: boolean;
    message: string;
    data: { logoUrl: string; logoDisplayUrl: string };
  }>("/vendor/logo", { body: formData as unknown as BodyInit });
  return data.data;
};

/** POST /api/vendor/signature — upload the authorised signatory signature. */
export const uploadOrgSignature = async (
  file: File,
): Promise<{
  signatoryName: string;
  signatoryTitle: string;
  signatureImageUrl: string;
  signatureDisplayUrl: string;
  stampImageUrl: string;
  stampDisplayUrl: string;
}> => {
  const formData = new FormData();
  formData.append("signature", file);
  const data = await api.post<{
    success: boolean;
    message: string;
    data: {
      signatoryName: string;
      signatoryTitle: string;
      signatureImageUrl: string;
      signatureDisplayUrl: string;
      stampImageUrl: string;
      stampDisplayUrl: string;
    };
  }>("/vendor/signature", { body: formData as unknown as BodyInit });
  return data.data;
};

/** POST /api/vendor/stamp — upload the company stamp. */
export const uploadOrgStamp = async (
  file: File,
): Promise<{
  signatoryName: string;
  signatoryTitle: string;
  signatureImageUrl: string;
  signatureDisplayUrl: string;
  stampImageUrl: string;
  stampDisplayUrl: string;
}> => {
  const formData = new FormData();
  formData.append("stamp", file);
  const data = await api.post<{
    success: boolean;
    message: string;
    data: {
      signatoryName: string;
      signatoryTitle: string;
      signatureImageUrl: string;
      signatureDisplayUrl: string;
      stampImageUrl: string;
      stampDisplayUrl: string;
    };
  }>("/vendor/stamp", { body: formData as unknown as BodyInit });
  return data.data;
};

/** POST /api/vendor/signatories/:index/signature — upload a signatory's signature. */
export const uploadSignatorySignature = async (
  index: number,
  file: File,
): Promise<Signatory[]> => {
  const formData = new FormData();
  formData.append("signature", file);
  const data = await api.post<{ success: boolean; data: Signatory[] }>(
    `/vendor/signatories/${index}/signature`,
    { body: formData as unknown as BodyInit },
  );
  return data.data;
};

/** POST /api/vendor/signatories/:index/stamp — upload a signatory's stamp. */
export const uploadSignatoryStamp = async (
  index: number,
  file: File,
): Promise<Signatory[]> => {
  const formData = new FormData();
  formData.append("stamp", file);
  const data = await api.post<{ success: boolean; data: Signatory[] }>(
    `/vendor/signatories/${index}/stamp`,
    { body: formData as unknown as BodyInit },
  );
  return data.data;
};
