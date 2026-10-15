import { describe, expect, it } from "vitest";
import { evaluateVerificationEvidence, validateSubmittedEvidence, type Receipt } from "@/modules/profile-verification/evidence";

const member = "11111111-1111-4111-8111-111111111111";
const now = new Date("2026-10-16T08:00:00Z");
const receipt = (id: string, purpose: Receipt["purpose"], relatedEntryId: string | null = null): Receipt => ({
  id, owningMembershipId:member, purpose,relatedEntryId,scanStatus:"CLEAN",
  privateObjectKey:"private/college/member/file", objectGeneration:"1",
  sha256Hex:"a".repeat(64),mimeType:"application/pdf",sizeBytes:200,
  revokedAt:null,retentionUntil:null,
});
const ids = {
  ten:"10000000-0000-4000-8000-000000000001",
  twelve:"10000000-0000-4000-8000-000000000002",
  ug:"10000000-0000-4000-8000-000000000003",
  optional:"10000000-0000-4000-8000-000000000004",
  resume:"10000000-0000-4000-8000-000000000005",
  pan:"10000000-0000-4000-8000-000000000006",
  aadhaar:"10000000-0000-4000-8000-000000000007",
};
const education = [
  {id:ids.ten,educationType:"10th",gradeObtained:"80"},
  {id:ids.twelve,educationType:"12th",gradeObtained:"85"},
  {id:ids.ug,educationType:"UG",gradeObtained:"78"},
  {id:ids.optional,educationType:"PG",gradeObtained:""},
];
const receipts = [
  receipt(ids.ten,"MARKSHEET",ids.ten),
  receipt(ids.twelve,"MARKSHEET",ids.twelve),
  receipt(ids.ug,"MARKSHEET",ids.ug),
  receipt(ids.resume,"RESUME"),
  receipt(ids.pan,"PAN"),
];
const snapshot = {
  education:education.map(e=>({
    id:e.id,educationType:e.educationType,grade:e.gradeObtained,
    ...(e.id!==ids.optional?{marksheetDocumentId:e.id}:{}),
  })),resumeDocumentId:ids.resume,
};

describe("T-S2-10 legacy evidence scope with private receipt safety", () => {
  it("accepts PAN with a usable document even when Aadhaar number lacks a document", () => {
    expect(evaluateVerificationEvidence({
      owningMembershipId:member,section:"IDENTITY",education:[],
      hasAadhaarNumber:true,hasPanNumber:true,receipts,now,
    }).ready).toBe(true);
    expect(validateSubmittedEvidence(member,"IDENTITY",{
      aadhaarNumber:"XXXXXXXX1234",panNumber:"XXXXXX1234",
      panDocumentId:ids.pan,
    },receipts,now)).toBe(true);
  });

  it("rejects number-only identity claims and revoked or foreign documents", () => {
    expect(validateSubmittedEvidence(member,"IDENTITY",{panNumber:"XXXXXXXX1234"},receipts,now))
      .toBe(false);
    expect(validateSubmittedEvidence(member,"IDENTITY",{
      panNumber:"XXXXXXXX1234",panDocumentId:ids.pan,
    },receipts.map(r=>({...r,owningMembershipId:"other"})),now)).toBe(false);
  });

  it("requires marked and documented core milestones but not optional postgraduate records", () => {
    expect(evaluateVerificationEvidence({
      owningMembershipId:member,section:"EDUCATION",education,
      hasAadhaarNumber:false,hasPanNumber:false,receipts,now,
    }).ready).toBe(true);
    expect(validateSubmittedEvidence(member,"EDUCATION",snapshot,receipts,now)).toBe(true);
  });

  it("refuses to approve any missing core marksheet or the resume receipt", () => {
    expect(validateSubmittedEvidence(member,"EDUCATION",snapshot,
      receipts.filter(r=>r.id!==ids.twelve),now)).toBe(false);
    expect(validateSubmittedEvidence(member,"EDUCATION",snapshot,
      receipts.filter(r=>r.id!==ids.resume),now)).toBe(false);
  });

  it("does not accept a different learner's matching document identifier", () => {
    expect(evaluateVerificationEvidence({
      owningMembershipId:member,section:"EDUCATION",education,
      hasAadhaarNumber:false,hasPanNumber:false,
      receipts:receipts.map(r=>({...r,owningMembershipId:"other"})),now,
    }).ready).toBe(false);
  });
});
