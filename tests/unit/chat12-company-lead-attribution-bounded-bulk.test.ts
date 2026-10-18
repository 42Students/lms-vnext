import {describe,expect,it} from "vitest";
import {readFileSync} from "node:fs";
import {deriveOwnRecruiterLeadStage,resolveRecruiterLeadRelationship}
 from "@/modules/placements/tpo-company-memory-service";
const owned="11111111-1111-4111-8111-111111111111";
const other="22222222-2222-4222-8222-222222222222";
const recruiter="33333333-3333-4333-8333-333333333333";
const jobs=[
 {jobId:"a",relationshipId:owned,companyName:"Acme Pvt Ltd",createdByUserId:other},
 {jobId:"b",relationshipId:other,companyName:"Acme Limited",createdByUserId:recruiter},
];
const rows=[
 {jobId:"a",jobStatus:"DRAFT",archivedAt:null,offerStatus:null,joiningStatus:null},
 {jobId:"b",jobStatus:"PUBLISHED",archivedAt:null,offerStatus:"ACCEPTED",joiningStatus:null},
];
const lead={manualStage:"NEW",recruiterUserId:recruiter,
 companyRelationshipId:null,companyName:"ACME Corp",
 inviteSentAt:null,inviteClickedAt:null};

describe("TPO-companies-lead-attribution-01 exact execution-evidence ownership",()=>{
 it("does not infer an ambiguous same-name employer relationship",()=>{
  expect(resolveRecruiterLeadRelationship(lead,jobs)).toBeNull();
 });
 it("credits confirmed recruiting only to the persisted recruiting creator when names collide",()=>{
  expect(deriveOwnRecruiterLeadStage(lead,jobs,rows)).toBe("RECRUITED");
  expect(deriveOwnRecruiterLeadStage(
   {...lead,recruiterUserId:null},jobs,rows,
  )).toBe("NEW");
 });
 it("never promotes a draft or archived drive into a recruitment stage",()=>{
  expect(deriveOwnRecruiterLeadStage(lead,jobs,rows.map(row=>({
   ...row,archivedAt:new Date(),
  })))).toBe("JOINED");
 });
 it("uses creator identities in both Company directory and Company Memory projections",()=>{
  const source=readFileSync(new URL("../../src/modules/placements/tpo-company-memory-service.ts",import.meta.url),"utf8");
  const directory=source.slice(source.indexOf("export async function listTpoCompanies("),
   source.indexOf("export async function getTpoCompanyMemory("));
  const memory=source.slice(source.indexOf("export async function getTpoCompanyMemory("));
  expect(directory).toContain("createdByUserId:row.job.createdByUserId");
  expect(memory).toContain("createdByUserId:row.job.createdByUserId");
 });
});
