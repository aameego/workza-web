export const toVendorSlug = (vendorName: string | null | undefined) =>
  String(vendorName || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

export type VendorUser = {
  vendorName?: string | null;
};

export const vendorDashboardPath = (user: VendorUser | null | undefined) => {
  const slug = toVendorSlug(user?.vendorName);
  return slug ? `/${slug}/dashboard` : "/dashboard";
};
