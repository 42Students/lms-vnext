import { describe, expect, it } from "vitest";
import { evaluateVerificationEvidence, educationLevel, type Receipt } from
  "@/modules/profile-verification/evidence";

const now = new Date("2026-10-10T00:00:00Z");
const owner = "membership-a";
function receipt(purpose: Receipt["purpose"], educationEntryId: string | null = null): Receipt {
  return {
    id: purpose + "-" + educationEntryId,
    owningMembershipId: owner, purpose, educationEntryId,
    scanStatus: "CLEAN", privateObjectKey: "private/college-a/receipt",
    objectGeneration: "1", sha256Hex: "a".repeat(64),
    mimeType: "application/pdf", sizeBytes: 500,
    revokedAt: null, retentionUntil: null,
  };
}
const education = [
  {id: "ten", educationType: "10th", gradeObtained: "9.2"},
  {id: "twelve", educationType: "12TH", gradeObtained: "86"},
  {id: "ug", educationType: "UG", gradeObtained: "8.5"},
];
const valid = [receipt("MARKSHEET", "ten"), receipt("MARKSHEET", "twelve"),
  receipt("MARKSHEET", "ug"), receipt("RESUME")];
const input = (receipts: Receipt[]) => ({
  owningMembershipId: owner, section: "EDUCATION" as const, now, education,
  hasAadhaarNumber: false, hasPanNumber: false, receipts,
});

describe("DB04 education and identity private evidence gates", () => {
  it("recognizes only source-supported grade levels", () => {
    expect(educationLevel("10th Standard")).toBe("10TH");
    expect(educationLevel("Diploma")).toBe("DIPLOMA");
    expect(educationLevel("UG")).toBe("UG");
    expect(educationLevel("B.Tech")).toBeNull();
  });
  it("requires 10th, 12th or Diploma, a degree, each marksheet and resume", () => {
    expect(evaluateVerificationEvidence(input(valid)).ready).toBe(true);
    expect(evaluateVerificationEvidence(input(valid.slice(0, 3))).missing)
      .toContain("Upload a resume");
    expect(evaluateVerificationEvidence(input(valid.slice(1))).missing)
      .toContain("Upload marksheet for 10th");
    expect(evaluateVerificationEvidence({...input(valid), education: education.slice(1)}).missing)
      .toContain("Add 10th education");
    expect(evaluateVerificationEvidence({...input(valid),
      education: education.map(e => e.id === "ug" ? {...e, gradeObtained: ""} : e)}).missing)
      .toContain("Provide marks for UG");
  });
  it("requires linked private identity evidence for every provided ID number", () => {
    const base = {...input([]), section: "IDENTITY" as const,
      hasAadhaarNumber: false, hasPanNumber: true};
    expect(evaluateVerificationEvidence(base).ready).toBe(false);
    expect(evaluateVerificationEvidence({...base, receipts: [receipt("PAN")]}).ready).toBe(true);
    expect(evaluateVerificationEvidence({...base, hasAadhaarNumber: true,
      receipts: [receipt("PAN")]}).missing).toContain("Upload verified Aadhaar document");
  });
  it("denies forged college ownership, pending scan, revoked and expired files", () => {
    const changed = (patch: Partial<Receipt>) => [
      {...receipt("MARKSHEET", "ten"), ...patch}, valid[1], valid[2], valid[3],
    ];
    expect(evaluateVerificationEvidence(input(changed({owningMembershipId: "other"}))).ready).toBe(false);
    expect(evaluateVerificationEvidence(input(changed({scanStatus: "PENDING"}))).ready).toBe(false);
    expect(evaluateVerificationEvidence(input(changed({revokedAt: now}))).ready).toBe(false);
    expect(evaluateVerificationEvidence(input(changed({retentionUntil: new Date("2026-10-09T00:00:00Z")}))).ready)
      .toBe(false);
  });
  it("rejects public links, invalid digests, oversized and unsupported content", () => {
    const changed = (patch: Partial<Receipt>) => [
      {...receipt("MARKSHEET", "ten"), ...patch}, valid[1], valid[2], valid[3],
    ];
    expect(evaluateVerificationEvidence(input(changed({privateObjectKey: "https://example.com/pan.pdf"}))).ready)
      .toBe(false);
    expect(evaluateVerificationEvidence(input(changed({sha256Hex: "short"}))).ready).toBe(false);
    expect(evaluateVerificationEvidence(input(changed({sizeBytes: 27_000_000}))).ready).toBe(false);
    expect(evaluateVerificationEvidence(input(changed({mimeType: "text/html"}))).ready).toBe(false);
  });
});
