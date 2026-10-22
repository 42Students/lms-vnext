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
  const aggregateSql=source.slice(source.indexOf("const [shared,offers]"),
   source.indexOf("const counts:",source.indexOf("const [shared,offers]")));
  const aggregateBranches=aggregateSql.split("db.select({jobId:placementApplications.jobId").slice(1);
  expect(aggregateBranches).toHaveLength(2);
  // Both aggregates separately revalidate the persisted recruiter/company
  // grants; the whole-portfolio summary may independently recheck them too.
  for(const query of aggregateBranches)for(const guard of [
   'eq(placementCompanyRelationships.status,"ACTIVE")',
   'eq(placementCompanies.status,"ACTIVE")',
   'eq(placementRecruiterCollegeGrants.status,"ACTIVE")',
   'eq(placementRecruiterProfiles.status,"ACTIVE")',
  ])expect(query).toContain(guard);
  // A large authorized portfolio must be batched rather than silently capped.
  expect(source).toContain("const allIds=[...new Set(authorizedJobIds)]");
  expect(source).toContain("allIds.slice(index,index+20)");
  expect(source).toContain("const ids=allIds");
 });
});
