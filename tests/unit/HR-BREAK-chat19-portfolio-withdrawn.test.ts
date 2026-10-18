import {describe,expect,it,vi} from "vitest";
import {readFileSync} from "node:fs";
import type {RequestContext} from "@/modules/identity/context";
const db=vi.hoisted(()=>({get:vi.fn()}));
vi.mock("@/db/client",()=>({getDb:db.get}));
import {recruiterVisiblePortfolioCounts} from "@/modules/placements/recruiter-portfolio-counts-service";
const college="11111111-1111-4111-8111-111111111111";
const actor:RequestContext={
 user:{id:"recruiter",identityUid:"identity",platformStatus:"ACTIVE",systemRoles:[]},
 membership:null,
 recruiter:{userId:"recruiter",companyId:"company",companyName:"Employer",title:null,status:"ACTIVE",grants:[
  {id:"grant",organizationId:"org",collegeId:college,collegeName:"College",companyRelationshipId:"relationship"},
 ]},
};
describe("HR-BREAK-PORTFOLIO-WITHDRAWN-45 own employer shared application and offer counts",()=>{
 it("refuses a forged recruiter principal before any query of application statistics",async()=>{
  db.get.mockClear();
  const forged={...actor,recruiter:{...actor.recruiter!,userId:"different-user"}};
  await expect(recruiterVisiblePortfolioCounts(forged,college,["job"])).rejects.toThrow();
  expect(db.get).not.toHaveBeenCalled();
 });
 it("refuses a foreign college and an expired principal before private count reads",async()=>{
  db.get.mockClear();
  await expect(recruiterVisiblePortfolioCounts(actor,"22222222-2222-4222-8222-222222222222",["job"])).rejects.toThrow();
  await expect(recruiterVisiblePortfolioCounts({...actor,user:{...actor.user,platformStatus:"DISABLED"}},college,["job"])).rejects.toThrow();
  expect(db.get).not.toHaveBeenCalled();
 });
 it("does not touch database when no authorized job IDs are supplied",async()=>{
  db.get.mockClear();
  await expect(recruiterVisiblePortfolioCounts(actor,college,[])).resolves.toEqual({});
  expect(db.get).not.toHaveBeenCalled();
 });
 it("both applicant and offer totals use a single shortlist scope excluding withdrawn applications",()=>{
  const src=readFileSync("src/modules/placements/recruiter-portfolio-counts-service.ts","utf8");
  expect(src).toContain('eq(placementApplications.status,"SUBMITTED")');
  expect(src).toContain('eq(placementApplicationScreenings.status,"SHORTLISTED")');
  expect(src).toContain('eq(collegeMemberships.status,"ACTIVE")');
  expect(src).toContain('eq(users.platformStatus,"ACTIVE")');
  expect(src).toContain('isNull(placementJobs.archivedAt)');
  expect(src).toContain('eq(placementCompanies.id,recruiter.companyId)');
  expect(src).toContain('gt(placementRecruiterCollegeGrants.validUntil,sql`clock_timestamp()`)');
 });
});
