import {beforeEach,describe,expect,it,vi} from "vitest";
const mock=vi.hoisted(()=>({getDb:vi.fn()}));
vi.mock("server-only",()=>({}));
vi.mock("@/db/client",()=>({getDb:mock.getDb}));
import {listOwnRecruiterPlacementJobs}
 from "@/modules/placements/recruiter-service";

const actor="123e4567-e89b-42d3-a456-426614174001";
const college="123e4567-e89b-42d3-a456-426614174002";
const grant={id:"123e4567-e89b-42d3-a456-426614174003",
 collegeId:college,organizationId:"123e4567-e89b-42d3-a456-426614174004",
 companyRelationshipId:"123e4567-e89b-42d3-a456-426614174005",
 collegeName:"College A"};
const account={user:{id:actor,platformStatus:"ACTIVE",systemRoles:[]},membership:null,
 recruiter:{userId:actor,status:"ACTIVE",companyId:"123e4567-e89b-42d3-a456-426614174006",
  companyName:"Employer A",title:null,grants:[grant]}};
describe("HR-PORTFOLIO-OWNER-24 no unauthorized employer portfolio enumeration",()=>{
 beforeEach(()=>{vi.clearAllMocks();});
 it("denies a borrowed otherwise-valid employer relationship before reading job records",async()=>{
  const swapped={...account,recruiter:{...account.recruiter,userId:"different-recruiter"}};
  await expect(listOwnRecruiterPlacementJobs(swapped as never,college))
   .rejects.toThrow("placements.recruiter.read");
  expect(mock.getDb).not.toHaveBeenCalled();
 });
 it("denies disabled user and missing recruiter identity before any database queries",async()=>{
  for(const ctx of [
   {...account,user:{...account.user,platformStatus:"DISABLED"}},
   {...account,recruiter:null},
  ]){
   await expect(listOwnRecruiterPlacementJobs(ctx as never,college))
    .rejects.toThrow("placements.recruiter.read");
  }
  expect(mock.getDb).not.toHaveBeenCalled();
 });
 it("keeps a real but empty authorized grant set empty, never querying all employers",async()=>{
  const noGrants={...account,recruiter:{...account.recruiter,grants:[]}};
  await expect(listOwnRecruiterPlacementJobs(noGrants as never)).resolves.toEqual([]);
  expect(mock.getDb).not.toHaveBeenCalled();
 });
 it("rejects a foreign college instead of silently removing college predicates",async()=>{
  await expect(listOwnRecruiterPlacementJobs(account as never,
   "123e4567-e89b-42d3-a456-426614174099")).rejects.toThrow("placements.recruiter.read");
  expect(mock.getDb).not.toHaveBeenCalled();
 });
 it("does not perform DB access when the authorized job allowlist is explicitly empty",async()=>{
  await expect(listOwnRecruiterPlacementJobs(account as never,college,{jobIds:[]}))
   .resolves.toEqual([]);
  expect(mock.getDb).not.toHaveBeenCalled();
 });
});
