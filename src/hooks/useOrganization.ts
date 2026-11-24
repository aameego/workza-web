import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import {
  getOrgProfile,
  updateOrgProfile,
  uploadOrgLogo,
  uploadOrgSignature,
  uploadOrgStamp,
  uploadSignatorySignature,
  uploadSignatoryStamp,
  type OrganizationProfile,
  type OrganizationProfileUpdate,
} from "../services/organizationService";
import { showSuccessToast } from "../design-system";

export const ORG_PROFILE_KEY = "org-profile" as const;

export function useOrganization(enabled = true) {
  return useQuery({
    queryKey: [ORG_PROFILE_KEY],
    queryFn: getOrgProfile,
    enabled,
  });
}

const invalidateOrgProfile = (qc: ReturnType<typeof useQueryClient>) => {
  void qc.invalidateQueries({ queryKey: [ORG_PROFILE_KEY] });
};

export function useUpdateOrganization() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: OrganizationProfileUpdate) => updateOrgProfile(payload),
    onSuccess: (data) => {
      invalidateOrgProfile(qc);
      showSuccessToast("Organization profile saved.");
      return data;
    },
  });
}

export function useUploadOrgLogo() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (file: File) => uploadOrgLogo(file),
    onSuccess: () => {
      invalidateOrgProfile(qc);
      showSuccessToast("Logo uploaded.");
    },
  });
}

export function useUploadOrgSignature() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (file: File) => uploadOrgSignature(file),
    onSuccess: () => {
      invalidateOrgProfile(qc);
      showSuccessToast("Signature uploaded.");
    },
  });
}

export function useUploadOrgStamp() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (file: File) => uploadOrgStamp(file),
    onSuccess: () => {
      invalidateOrgProfile(qc);
      showSuccessToast("Stamp uploaded.");
    },
  });
}

export function useUploadSignatorySignature() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ index, file }: { index: number; file: File }) =>
      uploadSignatorySignature(index, file),
    onSuccess: () => {
      invalidateOrgProfile(qc);
      showSuccessToast("Signature uploaded.");
    },
  });
}

export function useUploadSignatoryStamp() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ index, file }: { index: number; file: File }) =>
      uploadSignatoryStamp(index, file),
    onSuccess: () => {
      invalidateOrgProfile(qc);
      showSuccessToast("Stamp uploaded.");
    },
  });
}

export type { OrganizationProfile, OrganizationProfileUpdate };
