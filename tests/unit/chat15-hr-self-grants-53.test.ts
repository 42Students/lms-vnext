import {beforeEach,describe,expect,it,vi} from "vitest";
import {readFileSync} from "node:fs";

const mocks=vi.hoisted(()=>({
 profile:vi.fn(),active:vi.fn(),getDb:vi.fn(),select:vi.fn(),
 permission:vi.fn(),rows:[] as unknown[],
}));
vi.mock("server-only",()=>({}));
vi.mock("@/db/client",()=>({getDb:mocks.getDb}));
vi.mock("@/modules/identity/context",()=>({hasActiveRecruiter:mocks.active}));
vi.mock("@/modules/permissions/policy",()=>({
 AuthorizationError:class AuthorizationError extends Error{
  constructor(public permission:string){super("DENIED "+permission);}
 },
 requirePermission:mocks.permission,
}));
vi.mock("@/modules/placements/recruiter-profile-service",()=>({
 getRecruiterSelfProfile:mocks.profile,
}));
import {getRecruiterSelfGrantOverview}
 from "@/modules/placements/recruiter-self-grants-service";

const actor="123e4567-e89b-42d3-a456-426614174001";
const college="123e4567-e89b-42d3-a456-426614174002";
const rel="123e4567-e89b-42d3-a456-426614174003";
const grant={id:"123e4567-e89b-42d3-a456-426614174004",
 collegeId:college,organizationId:"123e4567-e89b-42d3-a456-426614174005",
 collegeName:"College A",companyRelationshipId:rel};
const activeUser={user:{id:actor,platformStatus:"ACTIVE"},recruiter:{
 userId:actor,companyId:"company-a",status:"ACTIVE",grants:[grant],
}};
function query(rows:unknown[]){
 const q={
  from(){return this;},innerJoin(){return this;},where(){return this;},
 };
 return Object.assign(Promise.resolve(rows),q);
}
describe("HR-SELF-GRANTS-53 recruiter current-access profile respects persisted expiry",()=>{
 beforeEach(()=>{
  vi.clearAllMocks();
  mocks.active.mockReturnValue(true);
  mocks.profile.mockResolvedValue({companyId:"company-a"});
  mocks.rows=[];
  mocks.select.mockImplementation(()=>query(mocks.rows));
  mocks.getDb.mockReturnValue({select:mocks.select});
 });
 it("rejects a borrowed recruiter session before profile lookup or grant read",async()=>{
  const swapped={...activeUser,recruiter:{...activeUser.recruiter,userId:"recruiter-b"}};
  await expect(getRecruiterSelfGrantOverview(swapped as never))
   .rejects.toThrow("DENIED placements.recruiter.read");
  expect(mocks.profile).not.toHaveBeenCalled();
  expect(mocks.getDb).not.toHaveBeenCalled();
 });
 it("without authorized grants returns an empty list without looking up grant rows",async()=>{
  const noGrants={...activeUser,recruiter:{...activeUser.recruiter,grants:[]}};
  await expect(getRecruiterSelfGrantOverview(noGrants as never)).resolves.toEqual({
   profileStatus:"ACTIVE",grants:[],
  });
  expect(mocks.getDb).not.toHaveBeenCalled();
 });
 it("expired or unverified grants cannot appear as ACTIVE current-access facts",async()=>{
  const source=readFileSync("src/modules/placements/recruiter-self-grants-service.ts","utf8");
  for(const clause of [
   'eq(placementRecruiterCollegeGrants.verificationStatus,"VERIFIED")',
   'gt(placementRecruiterCollegeGrants.validUntil,sql`clock_timestamp()`)',
   'eq(colleges.status, "ACTIVE")',
   'eq(organizations.status, "ACTIVE")',
  ])expect(source).toContain(clause);
  await expect(getRecruiterSelfGrantOverview(activeUser as never)).resolves.toEqual({
   profileStatus:"ACTIVE",grants:[],
  });
  expect(mocks.permission).toHaveBeenCalledWith(activeUser,"placements.recruiter.read",{
   collegeId:college,placementCompanyRelationshipId:rel,
  });
 });
 it("a mismatched persisted college or relationship cannot borrow the trusted grant",async()=>{
  mocks.rows=[{
   id:grant.id,collegeId:"another-college",collegeName:"Another College",
   collegeCode:"OTH",relationshipId:rel,grantStatus:"ACTIVE",
   relationshipStatus:"ACTIVE",grantedAt:new Date("2099-01-01T00:00:00Z"),
   validUntil:new Date("2099-02-01T00:00:00Z"),
  }];
  await expect(getRecruiterSelfGrantOverview(activeUser as never))
   .rejects.toThrow("DENIED placements.recruiter.read");
 });
 it("matching persisted current grant can be displayed without another recruiter's private contacts",async()=>{
  mocks.rows=[{
   id:grant.id,collegeId:college,collegeName:"College A",collegeCode:"COL-A",
   relationshipId:rel,grantStatus:"ACTIVE",relationshipStatus:"ACTIVE",
   grantedAt:new Date("2099-01-01T00:00:00Z"),
   validUntil:new Date("2099-02-01T00:00:00Z"),
  }];
  const view=await getRecruiterSelfGrantOverview(activeUser as never);
  expect(view.grants).toHaveLength(1);
  expect(view.grants[0]).toMatchObject({id:grant.id,collegeName:"College A",
   accessUntilIso:"2099-02-01T00:00:00.000Z"});
  expect(view.grants[0]).not.toHaveProperty("email");
  expect(view.grants[0]).not.toHaveProperty("recruiterUserId");
 });
});
