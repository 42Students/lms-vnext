import { describe, expect, it } from "vitest";
import {
  validateSubmittedEvidence, type Receipt,
} from "@/modules/profile-verification/evidence";

const member = "membership-original";
const id = "ce62eaa4-6aba-4116-8952-a58f7c68da20";
const entries = [
  {id:"25d5b28a-73b3-42cd-a41b-3912fef2e245",educationType:"10TH",grade:"9.2"},
  {id:"a562a35e-4f42-49ef-a2e0-c0b7a75ce979",educationType:"12TH",grade:"86"},
  {id:"b2f77b83-e8bd-4aba-a073-1f158d724a1a",educationType:"UG",grade:"8.5"},
];
function receipt(purpose:Receipt["purpose"], entryId:string|null=null):Receipt {
  return {
    id:purpose+"-"+(entryId??"main"), owningMembershipId:member, purpose,
    educationEntryId:entryId, scanStatus:"CLEAN",
    privateObjectKey:"private/protected/"+id,objectGeneration:"323",
    sha256Hex:"a".repeat(64), mimeType:"application/pdf",sizeBytes:4567,
    revokedAt:null,retentionUntil:null,
  };
}
const docs=[
  receipt("MARKSHEET",entries[0].id),
  receipt("MARKSHEET",entries[1].id),
  receipt("MARKSHEET",entries[2].id),
  receipt("RESUME"),
  receipt("PAN"),
];
const snapshot={
  education:entries.map((e,i)=>({...e,marksheetDocumentId:docs[i].id})),
  resumeDocumentId:docs[3].id,
};
const now = new Date("2026-10-10T00:00:00Z");

describe("DB04 immutable submitted evidence validation", () => {
  it("accepts the original submitted marksheet and resume references", () => {
    expect(validateSubmittedEvidence(member,"EDUCATION",snapshot,docs,now)).toBe(true);
  });
  it("does not accept replacements with different IDs, even when new files are clean", () => {
    const mutated={...snapshot,education:[
      {...snapshot.education[0],marksheetDocumentId:"forged-id"},
      ...snapshot.education.slice(1),
    ]};
    expect(validateSubmittedEvidence(member,"EDUCATION",mutated,docs,now)).toBe(false);
  });
  it("rejects forged ownership, revoked receipt and expiring documents", () => {
    const forged=docs.map(d=>({...d,owningMembershipId:"other-learner"}));
    expect(validateSubmittedEvidence(member,"EDUCATION",snapshot,forged,now)).toBe(false);
    const revoked=docs.map(d=>d.id===snapshot.resumeDocumentId?{...d,revokedAt:now}:d);
    expect(validateSubmittedEvidence(member,"EDUCATION",snapshot,revoked,now)).toBe(false);
    const expired=docs.map(d=>({...d,retentionUntil:new Date("2026-10-09T12:00:00Z")}));
    expect(validateSubmittedEvidence(member,"EDUCATION",snapshot,expired,now)).toBe(false);
  });
  it("accepts identity only with the exact linked document that was submitted", () => {
    expect(validateSubmittedEvidence(member,"IDENTITY",
      {panNumber:"XXXXXX1234",panDocumentId:docs[4].id},docs,now)).toBe(true);
    expect(validateSubmittedEvidence(member,"IDENTITY",
      {panNumber:"XXXXXX1234",panDocumentId:"replaced-file"},docs,now)).toBe(false);
    expect(validateSubmittedEvidence(member,"IDENTITY",
      {panNumber:"XXXXXX1234",panDocumentId:docs[4].id,
       aadhaarNumber:"XXXXXXXX1234"},docs,now)).toBe(false);
  });
  it("rejects malformed education and missing scale evidence", () => {
    expect(validateSubmittedEvidence(member,"EDUCATION",{education:[]},docs,now)).toBe(false);
    expect(validateSubmittedEvidence(member,"EDUCATION",
      {education:[{educationType:"10TH",grade:"9.2"}],
        resumeDocumentId:docs[3].id},docs,now)).toBe(false);
    expect(validateSubmittedEvidence(member,"EDUCATION",
      {...snapshot,education:snapshot.education.map((e,i)=>i===0?{...e,grade:""}:e)},docs,now)).toBe(false);
  });
});
