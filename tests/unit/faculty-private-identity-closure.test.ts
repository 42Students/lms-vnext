import {beforeEach,describe,expect,it,vi} from "vitest";
const mock=vi.hoisted(()=>({
 db:vi.fn(),upload:vi.fn(),attest:vi.fn(),grant:vi.fn(),persisted:vi.fn(),
}));
vi.mock("server-only",()=>({}));
vi.mock("@/db/client",()=>({getDb:mock.db}));
vi.mock("@/modules/permissions/persisted-actor",()=>({
 assertPersistedPlatformPermission:mock.persisted,
}));
vi.mock("@/modules/storage/private-object-storage",()=>({
 createPrivateUploadGrant:mock.upload,
 readPrivateObjectAttestation:mock.attest,
 createPrivateReadGrant:mock.grant,
}));
import {
 issueOwnFacultyIdentityUpload,completeOwnFacultyIdentityUpload,
 openOwnFacultyIdentityEvidence,revokeOwnFacultyIdentityEvidence,
} from "@/modules/people/faculty-identity-evidence-service";
import {emptyFacultyProfileDocument,facultyProfileDocumentSchema} from "@/modules/people/faculty-profile-document";
import {facultyIdentityEvidenceStatus} from "@/modules/people/faculty-self-section-model";
import type {RequestContext} from "@/modules/identity/context";

const actor={
 user:{id:"11111111-1111-4111-8111-111111111111",identityUid:"teacher",
  platformStatus:"ACTIVE",systemRoles:[]},
 membership:{
  id:"22222222-2222-4222-8222-222222222222",
  organizationId:"33333333-3333-4333-8333-333333333333",
  collegeId:"44444444-4444-4444-8444-444444444444",
  status:"ACTIVE",roles:["FACULTY"],
 },
} as RequestContext;
beforeEach(()=>{
 vi.resetAllMocks();
 mock.db.mockReturnValue({transaction:async(fn:(tx:unknown)=>Promise<unknown>)=>fn({})});
 mock.persisted.mockResolvedValue(undefined);
});
describe("Faculty private identity and attachment safety",()=>{
 it("denies non-Faculty and inactive memberships before opening any storage or DB",async()=>{
  const outsiders=[
   {...actor,membership:{...actor.membership!,roles:["LEARNER"]}},
   {...actor,membership:{...actor.membership!,status:"SUSPENDED"}},
  ] as RequestContext[];
  for(const outsider of outsiders){
   await expect(issueOwnFacultyIdentityUpload(outsider,{
    kind:"PAN",contentType:"application/pdf",sizeBytes:900,
   })).rejects.toThrow("FACULTY_ROLE_REQUIRED");
   await expect(completeOwnFacultyIdentityUpload(outsider,{
    kind:"PAN",objectKey:"private-object-key-0000000",expectedVersion:0,
   })).rejects.toThrow("FACULTY_ROLE_REQUIRED");
   await expect(openOwnFacultyIdentityEvidence(outsider,{
    kind:"PAN",receiptId:"55555555-5555-4555-8555-555555555555",
   })).rejects.toThrow("FACULTY_ROLE_REQUIRED");
   await expect(revokeOwnFacultyIdentityEvidence(outsider,{
    kind:"PAN",expectedVersion:0,
   })).rejects.toThrow("FACULTY_ROLE_REQUIRED");
  }
  expect(mock.db).not.toHaveBeenCalled();
  expect(mock.upload).not.toHaveBeenCalled();
  expect(mock.attest).not.toHaveBeenCalled();
  expect(mock.grant).not.toHaveBeenCalled();
 });
 it("rejects executable uploads and unverified object keys before provider actions",async()=>{
  await expect(issueOwnFacultyIdentityUpload(actor,{
   kind:"AADHAAR",contentType:"application/x-msdownload",sizeBytes:100,
  })).rejects.toBeDefined();
  await expect(issueOwnFacultyIdentityUpload(actor,{
   kind:"PAN",contentType:"application/pdf",sizeBytes:12_000_000,
  })).rejects.toBeDefined();
  await expect(completeOwnFacultyIdentityUpload(actor,{
   kind:"PAN",objectKey:"short",expectedVersion:0,
  })).rejects.toBeDefined();
  expect(mock.upload).not.toHaveBeenCalled();
  expect(mock.attest).not.toHaveBeenCalled();
 });
 it("never accepts raw identity numbers or raw object URLs into self profile JSON",()=>{
  expect(facultyProfileDocumentSchema.safeParse({
   aadhaarNumber:"123456789012",
  }).success).toBe(false);
  expect(facultyProfileDocumentSchema.safeParse({
   panNumber:"ABCDE1234F",
  }).success).toBe(false);
  expect(facultyProfileDocumentSchema.safeParse({
   identitySummary:{aadhaarDocumentId:"https://storage.invalid/public.pdf"},
  }).success).toBe(false);
  const status=facultyIdentityEvidenceStatus({
   ...emptyFacultyProfileDocument,
   identitySummary:{...emptyFacultyProfileDocument.identitySummary,
    aadhaarLast4:"9012",panMasked:"XXXXX1234F",
    panDocumentId:"55555555-5555-4555-8555-555555555555"},
  });
  expect(status).toMatchObject({
   aadhaarMasked:"•••• 9012",panEvidence:"On file",
   replacementAllowedInSectionPatch:false,
  });
  expect(JSON.stringify(status)).not.toContain("XXXXX1234F");
 });
});
