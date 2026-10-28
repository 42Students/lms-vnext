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
  | "OFFER_LETTER"
  | "VIDEO_INTRO";
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
    Boolean(/^private\/[a-zA-Z0-9_\/-]+$/.test(key) && !key.includes("..")) &&
    /^[0-9]+$/.test(r.objectGeneration) && /^[0-9a-f]{64}$/i.test(r.sha256Hex) &&
    r.sizeBytes > 0 && r.sizeBytes <= 26214400 &&
    ["application/pdf", "image/jpeg", "image/png"].includes(r.mimeType);
}
const REQUIRED_EDUCATION_GROUPS = [
  ["10TH"], ["12TH", "DIPLOMA"], ["UG", "PG"],
] as const;

/**
 * Legacy verification requires a marks+marksheet pair for three education
 * milestones. Optional entries must not block an otherwise complete profile.
 */
function missingCoreEducation(
  education: EducationForVerification[],
  hasEvidence: (entry: EducationForVerification) => boolean,
): string[] {
  const missing: string[] = [];
  const typeNames = ["10th", "12th or Diploma", "current degree"];
  for (const [index, levels] of REQUIRED_EDUCATION_GROUPS.entries()) {
    const entries = education.filter(e => levels.some(level=>educationLevel(e.educationType)===level));
    if (entries.length === 0) {
      missing.push("Add " + typeNames[index] + " education");
      continue;
    }
    const marked = entries.filter(e => e.gradeObtained.trim().length > 0);
    if (marked.length === 0) {
      missing.push("Provide marks for " + entries[0]!.educationType);
    } else if (!marked.some(hasEvidence)) {
      missing.push("Upload marksheet for " + marked[0]!.educationType);
    }
  }
  return missing;
}

export function evaluateVerificationEvidence(input: ProfileEvidenceInput): EvidenceResult {
  const missing: string[] = [];
  const eligible = (purpose: PrivateDocumentPurpose, relatedEntryId: string | null = null) =>
    input.receipts.some(r => usablePrivateReceipt(r, input.owningMembershipId, purpose, input.now, relatedEntryId));
  if (input.section === "IDENTITY") {
    const aadhaarReady = input.hasAadhaarNumber && eligible("AADHAAR");
    const panReady = input.hasPanNumber && eligible("PAN");
    if (!input.hasAadhaarNumber && !input.hasPanNumber) missing.push("Provide Aadhaar or PAN details");
    else if (!aadhaarReady && !panReady) {
      missing.push(input.hasAadhaarNumber
        ? "Upload verified Aadhaar document" : "Upload verified PAN document");
    }
  } else {
    missing.push(...missingCoreEducation(input.education, e=>eligible("MARKSHEET",e.id)));
    // Privacy exception to the legacy URL-only check: a usable, CLEAN private
    // resume receipt proves the object is available without publishing its URL.
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
    const hasAadhaar = typeof submitted.aadhaarNumber === "string" &&
      submitted.aadhaarNumber.trim().length > 0;
    const hasPan = typeof submitted.panNumber === "string" &&
      submitted.panNumber.trim().length > 0;
    return (hasAadhaar && ref("AADHAAR",submitted.aadhaarDocumentId)) ||
      (hasPan && ref("PAN",submitted.panDocumentId));
  }
  const raw = submitted.education;
  if (!Array.isArray(raw)) return false;
  const items: EducationForVerification[] = [];
  const evidenceByEntry = new Map<string,boolean>();
  for (const e of raw) {
    if (e === null || typeof e !== "object" || Array.isArray(e)) return false;
    const item = e as Record<string,unknown>;
    if (typeof item.id !== "string" || typeof item.educationType !== "string" ||
        typeof item.grade !== "string") return false;
    // A linked optional marksheet must also be a CLEAN, correct-owner receipt.
    if (item.marksheetDocumentId !== undefined &&
        !ref("MARKSHEET",item.marksheetDocumentId,item.id)) return false;
    items.push({id:item.id,educationType:item.educationType,gradeObtained:item.grade});
    evidenceByEntry.set(item.id,ref("MARKSHEET",item.marksheetDocumentId,item.id));
  }
  if (!ref("RESUME",submitted.resumeDocumentId)) return false;
  return missingCoreEducation(items, e=>evidenceByEntry.get(e.id)===true).length === 0;
}
