import {beforeEach,describe,expect,it,vi} from "vitest";
import {readFileSync} from "node:fs";
const mock=vi.hoisted(()=>({getDb:vi.fn(),requirePermission:vi.fn()}));
vi.mock("server-only",()=>({}));
vi.mock("@/db/client",()=>({getDb:mock.getDb}));
vi.mock("@/modules/permissions/policy",()=>({
 AuthorizationError:class AuthorizationError extends Error{
  constructor(permission:string){super("Missing permission: "+permission);}
 },
 requirePermission:mock.requirePermission,
}));
vi.mock("@/modules/placements/recruiter-job-ownership",()=>({
 recruiterOwnJobPredicate:()=>undefined,
}));
import {recruiterVisiblePortfolioCounts}
 from "@/modules/placements/recruiter-portfolio-counts-service";

const actor="123e4567-e89b-42d3-a456-426614174001";
const college="123e4567-e89b-42d3-a456-426614174002";
const other="123e4567-e89b-42d3-a456-426614174003";
const job="123e4567-e89b-42d3-a456-426614174004";
const grant={collegeId:college,companyRelationshipId:"123e4567-e89b-42d3-a456-426614174005"};
const owner={user:{id:actor,platformStatus:"ACTIVE"},recruiter:{
 userId:actor,status:"ACTIVE",companyId:"firm-a",grants:[grant],
}};

describe("HR-PORTFOLIO-SCOPE-29 no cross-employer applicant or offer aggregates",()=>{
 beforeEach(()=>vi.clearAllMocks());
 it("rejects borrowed recruiter identity before reading any applicant counts",async()=>{
  const stolen={...owner,recruiter:{...owner.recruiter,userId:other}};
  await expect(recruiterVisiblePortfolioCounts(stolen as never,college,[job]))
   .rejects.toThrow("placements.recruiter.read");
  expect(mock.getDb).not.toHaveBeenCalled();
  expect(mock.requirePermission).not.toHaveBeenCalled();
 });
 it("denies foreign college even with a caller-supplied job allowlist",async()=>{
  await expect(recruiterVisiblePortfolioCounts(owner as never,other,[job]))
   .rejects.toThrow("placements.recruiter.read");
  expect(mock.getDb).not.toHaveBeenCalled();
 });
 it("an empty allowlist returns no counts and never enumerates the college",async()=>{
  await expect(recruiterVisiblePortfolioCounts(owner as never,college,[]))
   .resolves.toEqual({});
  expect(mock.getDb).not.toHaveBeenCalled();
 });
 it("SQL rechecks persisted job college, exact granted relationships, allowed state and archive",()=>{
  const source=readFileSync("src/modules/placements/recruiter-portfolio-counts-service.ts","utf8");
  for(const clause of [
   "recruiter.userId!==context.user.id",
   "grant.collegeId===collegeId&&grant.companyRelationshipId.trim()",
   "eq(placementJobs.collegeId,collegeId)",
   "inArray(placementJobs.companyRelationshipId,relationshipIds)",
   'inArray(placementJobs.status,["PUBLISHED","CLOSED"])',
   "isNull(placementJobs.archivedAt)",
   'eq(placementCompanyRelationships.status,"ACTIVE")',
   'eq(placementCompanies.id,recruiter.companyId)',
   'eq(placementCompanies.status,"ACTIVE")',
   'eq(colleges.status,"ACTIVE")',
   'eq(placementRecruiterProfiles.userId,context.user.id)',
   'eq(placementRecruiterProfiles.status,"ACTIVE")',
   'eq(placementRecruiterCollegeGrants.recruiterUserId,context.user.id)',
   'eq(placementRecruiterCollegeGrants.status,"ACTIVE")',
   "eq(collegeMemberships.collegeId,collegeId)",
   'eq(placementApplicationScreenings.status,"SHORTLISTED")',
   "recruiterOwnJobPredicate(context.user.id)",
  ])expect(source).toContain(clause);
  expect(source).toContain("requirePermission(context");
  // Both aggregate queries must independently enforce live DB tenancy.
  expect(source.split('eq(placementCompanyRelationships.status,"ACTIVE")').length-1).toBe(2);
  expect(source.split('eq(placementCompanies.status,"ACTIVE")').length-1).toBe(2);
  expect(source.split('eq(placementRecruiterCollegeGrants.status,"ACTIVE")').length-1).toBe(2);
  expect(source.split('eq(placementRecruiterProfiles.status,"ACTIVE")').length-1).toBe(2);
  expect(source).toContain("const ids=[...new Set(authorizedJobIds)].slice(0,20)");
 });
});
