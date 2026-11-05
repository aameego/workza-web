/** Keep in sync with AameegoGig-Frontend/src/utils/documentTypes.js */

export const DOC_TYPE_LABEL: Record<string, string> = {
  PHOTO: "Photo",
  AADHAAR: "Aadhaar Card",
  PAN: "PAN Card",
  EDUCATION: "Education Certificate",
  BANK: "Bank Proof",
  MEDICAL_CARD: "Medical Card",
  SALARY_SLIP: "Salary Slip",
};

export const DOC_TYPE_ACCEPT: Record<string, string[]> = {
  PHOTO: [".png", ".jpg", ".jpeg"],
  AADHAAR: [".pdf", ".png", ".jpg", ".jpeg"],
  PAN: [".pdf", ".png", ".jpg", ".jpeg"],
  EDUCATION: [".pdf", ".png", ".jpg", ".jpeg"],
  BANK: [".pdf", ".png", ".jpg", ".jpeg"],
  MEDICAL_CARD: [".pdf", ".png", ".jpg", ".jpeg"],
  SALARY_SLIP: [".pdf"],
};

/** Figma Pending Documents slots → backend documentType */
export const PENDING_DOC_SLOTS = [
  { id: "pan", documentType: "PAN", label: "PAN CARD" },
  { id: "bank", documentType: "BANK", label: "BANK DETAILS (PASSBOOK)" },
  { id: "bank_stmt", documentType: "BANK", label: "BANK STATEMENT (6 MONTHS)" },
  { id: "dl", documentType: "EDUCATION", label: "DRIVING LICENSE" },
  { id: "passport", documentType: "EDUCATION", label: "PASSPORT" },
] as const;

export type PendingDocSlot = (typeof PENDING_DOC_SLOTS)[number];

export const docTypeLabel = (type?: string | null): string =>
  (type && DOC_TYPE_LABEL[type]) || type || "Document";

export const acceptFor = (type: string): string =>
  (DOC_TYPE_ACCEPT[type] || [".pdf", ".png", ".jpg", ".jpeg"]).join(",");

export const isAllowedFile = (type: string, fileName = ""): boolean => {
  const dot = fileName.lastIndexOf(".");
  const ext = dot === -1 ? "" : fileName.slice(dot).toLowerCase();
  const allowed = DOC_TYPE_ACCEPT[type];
  return allowed ? allowed.includes(ext) : true;
};

export type EmployeeDocument = {
  _id: string;
  fileName?: string;
  originalName?: string;
  documentType?: string;
  category?: string;
  size?: number;
  fileSize?: number;
  createdAt?: string;
  uploadedAt?: string;
};

export const formatFileSize = (bytes?: number | null): string => {
  const n = Number(bytes || 0);
  if (!n || n < 0) return "—";
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
};

export const formatUploadedAgo = (iso?: string | null): string => {
  if (!iso) return "";
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return "";
  const diffMs = Date.now() - then;
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "Uploaded: just now";
  if (mins < 60) return `Uploaded: ${mins} m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `Uploaded: ${hours} h ago`;
  const days = Math.floor(hours / 24);
  return `Uploaded: ${days} d ago`;
};

/**
 * Pending slots whose documentType is not yet present among verified docs.
 * BANK STATEMENT stays pending until a second BANK doc exists.
 */
export const pendingDocumentSlots = (
  documents: EmployeeDocument[],
): PendingDocSlot[] => {
  const counts = new Map<string, number>();
  documents.forEach((doc) => {
    const type = String(doc.documentType || "");
    if (!type) return;
    counts.set(type, (counts.get(type) || 0) + 1);
  });

  return PENDING_DOC_SLOTS.filter((slot) => {
    const count = counts.get(slot.documentType) || 0;
    if (slot.id === "bank_stmt") return count < 2;
    if (slot.id === "passport") {
      // Second EDUCATION slot — need 2 education docs to clear both DL + passport.
      return count < 2;
    }
    if (slot.id === "dl") return count < 1;
    return count < 1;
  });
};
