/** DB04 private document receipt + section-completeness rules.
 * A CLEAN receipt is necessary, not sufficient to certify a GCS object exists:
 * the storage adapter must verify generation, scanner result and ownership.
 */
export type PrivateDocumentPurpose =
  | "AADHAAR"
  | "PAN"
  | "MARKSHEET"
  | "RESUME"
  | "PROFILE_IMAGE"
  | "EDUCATION_CERTIFICATE"
  | "CERTIFICATION"
  | "EXPERIENCE_CERTIFICATE"
  | "OFFER_LETTER";
export type Receipt = {
  id: string;
  owningMembershipId: string;
  purpose: PrivateDocumentPurpose;
  relatedEntryId: string | null;
  scanStatus: "PENDING" | "CLEAN" | "REJECTED";
  privateObjectKey: string;
  objectGeneration: string;
  sha256Hex: string;
  mimeType: string;
  sizeBytes: number;
  revokedAt: Date | null;
  retentionUntil: Date | null;
};
export type EducationForVerification = {
  id: string;
  educationType: string;
  gradeObtained: string;
};
export type ProfileEvidenceInput = {
  owningMembershipId: string;
  section: "EDUCATION" | "IDENTITY";
  education: EducationForVerification[];
  hasAadhaarNumber: boolean;
  hasPanNumber: boolean;
  receipts: Receipt[];
  now: Date;
};
export type EvidenceResult = {ready: boolean; missing: string[]};
export function educationLevel(input: string): "10TH" | "12TH" | "DIPLOMA" | "UG" | "PG" | null {
  const t = input.trim().toUpperCase();
  if (t.startsWith("10")) return "10TH";
  if (t.startsWith("12")) return "12TH";
  if (t.startsWith("DIPLOMA")) return "DIPLOMA";
  if (t === "UG" || t === "PG") return t;
  return null;
}
export function usablePrivateReceipt(r: Receipt, memberId: string, purpose: PrivateDocumentPurpose, at: Date,
                relatedEntryId: string | null = null): boolean {
  const key = r.privateObjectKey;
  return r.owningMembershipId === memberId && r.purpose === purpose &&
    r.relatedEntryId === relatedEntryId && r.scanStatus === "CLEAN" &&
    r.revokedAt === null && (r.retentionUntil === null || r.retentionUntil > at) &&
    Boolean(key && !key.includes("://") && !key.includes("..") && !key.startsWith("/")) &&
    Boolean(r.objectGeneration) && /^[0-9a-f]{64}$/i.test(r.sha256Hex) &&
    r.sizeBytes > 0 && r.sizeBytes <= 26214400 &&
    ["application/pdf", "image/jpeg", "image/png"].includes(r.mimeType);
}
export function evaluateVerificationEvidence(input: ProfileEvidenceInput): EvidenceResult {
  const missing: string[] = [];
  const eligible = (purpose: PrivateDocumentPurpose, relatedEntryId: string | null = null) =>
    input.receipts.some(r => usablePrivateReceipt(r, input.owningMembershipId, purpose, input.now, relatedEntryId));
  if (input.section === "IDENTITY") {
    if (!input.hasAadhaarNumber && !input.hasPanNumber) missing.push("Provide Aadhaar or PAN details");
    if (input.hasAadhaarNumber && !eligible("AADHAAR")) missing.push("Upload verified Aadhaar document");
    if (input.hasPanNumber && !eligible("PAN")) missing.push("Upload verified PAN document");
  } else {
    const levels = new Set(input.education.map(e => educationLevel(e.educationType)));
    if (!levels.has("10TH")) missing.push("Add 10th education");
    if (!levels.has("12TH") && !levels.has("DIPLOMA")) missing.push("Add 12th or Diploma education");
    if (!levels.has("UG") && !levels.has("PG")) missing.push("Add current degree education");
    for (const entry of input.education) {
      if (!entry.gradeObtained.trim()) missing.push("Provide marks for " + entry.educationType);
      if (!eligible("MARKSHEET", entry.id)) missing.push("Upload marksheet for " + entry.educationType);
    }
    if (!eligible("RESUME")) missing.push("Upload a resume");
  }
  return {ready: missing.length === 0, missing};
}

/**
 * Revalidate immutable submitted references, NOT the latest mutable profile.
 * Explicit linkage prevents accepting a different CLEAN file uploaded later.
 */
export function validateSubmittedEvidence(
  membershipId: string,
  section: "EDUCATION" | "IDENTITY",
  submitted: Record<string, unknown>,
  receipts: Receipt[],
  at: Date,
): boolean {
  const ref = (purpose: PrivateDocumentPurpose, id: unknown, entryId: string | null = null) =>
    typeof id === "string" && receipts.some(r => r.id === id &&
      usablePrivateReceipt(r,membershipId,purpose,at,entryId));
  if (section === "IDENTITY") {
    const hasAadhaar = typeof submitted.aadhaarNumber === "string" && submitted.aadhaarNumber.length > 0;
    const hasPan = typeof submitted.panNumber === "string" && submitted.panNumber.length > 0;
    if (!hasAadhaar && !hasPan) return false;
    return (!hasAadhaar || ref("AADHAAR",submitted.aadhaarDocumentId)) &&
      (!hasPan || ref("PAN",submitted.panDocumentId));
  }
  const raw = submitted.education;
  if (!Array.isArray(raw)) return false;
  const items: EducationForVerification[] = [];
  for (const e of raw) {
    if (e === null || typeof e !== "object" || Array.isArray(e)) return false;
    const item = e as Record<string,unknown>;
    if (typeof item.id !== "string" || typeof item.educationType !== "string" ||
        typeof item.grade !== "string") return false;
    if (!ref("MARKSHEET", item.marksheetDocumentId, item.id)) return false;
    items.push({id:item.id,educationType:item.educationType,gradeObtained:item.grade});
  }
  if (!ref("RESUME",submitted.resumeDocumentId)) return false;
  const levels = new Set(items.map(e=>educationLevel(e.educationType)));
  return levels.has("10TH") && (levels.has("12TH") || levels.has("DIPLOMA")) &&
    (levels.has("UG") || levels.has("PG")) &&
    items.every(e=>e.gradeObtained.trim().length>0);
}
