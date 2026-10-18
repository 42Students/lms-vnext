import {beforeEach,describe,expect,it,vi} from "vitest";

const mocks=vi.hoisted(()=>({
 getDb:vi.fn(),can:vi.fn(),college:vi.fn(),moduleAccess:vi.fn(),
 select:vi.fn(),queries:[] as unknown[][],
}));
vi.mock("@/db/client",()=>({getDb:mocks.getDb}));
vi.mock("@/modules/permissions/policy",()=>({can:mocks.can}));
vi.mock("@/modules/projects/scope",()=>({loadProjectCollegeScope:mocks.college}));
vi.mock("@/modules/module-access/service",()=>({resolveOptionalModuleAccess:mocks.moduleAccess}));

import {requireProjectReadAccess,requireProjectLifecycleAccess}
 from "@/modules/projects/access";

const projectId="123e4567-e89b-42d3-a456-426614174001";
const collegeId="123e4567-e89b-42d3-a456-426614174002";
const organizationId="123e4567-e89b-42d3-a456-426614174003";
const otherCollege="123e4567-e89b-42d3-a456-426614174004";
const recruiterId="123e4567-e89b-42d3-a456-426614174005";
const jobProject={id:projectId,collegeId};
const recruiter={user:{id:recruiterId,platformStatus:"ACTIVE",systemRoles:[]},
 membership:null,recruiter:{userId:recruiterId,status:"ACTIVE",
  grants:[{collegeId,organizationId,companyRelationshipId:"relationship"}]}};
const tpo={user:{id:recruiterId,platformStatus:"ACTIVE",systemRoles:[]},
 membership:{id:projectId,collegeId,organizationId,status:"ACTIVE",roles:["TPO"]}};
const q=(rows:unknown[])=>({
 from(){return this;},where(){return this;},innerJoin(){return this;},
 limit(){return Promise.resolve(rows);},
});
describe("PROJ-BREAK-HR-01: HR/Recruiter cannot traverse college project member or lifecycle data",()=>{
 beforeEach(()=>{
  vi.clearAllMocks();
  mocks.queries=[[jobProject]];
  mocks.select.mockImplementation(()=>q(mocks.queries.shift()??[]));
  mocks.getDb.mockReturnValue({select:mocks.select});
  mocks.college.mockResolvedValue({id:collegeId,organizationId});
  mocks.can.mockReturnValue(false);
  mocks.moduleAccess.mockResolvedValue({projects:{enabled:true}});
 });
 it("denies a recruiter with an active hiring grant but no college project membership",async()=>{
  await expect(requireProjectReadAccess(recruiter as never,projectId))
   .rejects.toMatchObject({code:"PROJECT_ACCESS_DENIED"});
  expect(mocks.getDb).not.toHaveBeenCalled();
  expect(mocks.moduleAccess).not.toHaveBeenCalled();
 });
 it("does not let an HR recruiter grant become a project lifecycle permission",async()=>{
  await expect(requireProjectLifecycleAccess(recruiter as never,projectId))
   .rejects.toMatchObject({code:"PROJECT_ACCESS_DENIED"});
  expect(mocks.can).not.toHaveBeenCalled(); // Recruiter-only identity is rejected ahead of object lookup.
 });
 it("denies a TPO account with no assigned project member record",async()=>{
  mocks.queries=[[jobProject],[]];
  await expect(requireProjectReadAccess(tpo as never,projectId))
   .rejects.toMatchObject({code:"PROJECT_ACCESS_DENIED"});
  expect(mocks.getDb).not.toHaveBeenCalled();
 });
 it("denies wrong-tenant membership before querying project members",async()=>{
  await expect(requireProjectReadAccess({...tpo,membership:{...tpo.membership,collegeId:otherCollege}} as never,projectId))
   .rejects.toMatchObject({code:"PROJECT_ACCESS_DENIED"});
  // A TPO-only role is rejected ahead of any project existence probe.
  expect(mocks.select).not.toHaveBeenCalled();
 });
 it("PROJ-BREAK-HR-ORG-02 denies mismatched organization context before project-member SQL",async()=>{
  const forged={...tpo,membership:{...tpo.membership,
   organizationId:"123e4567-e89b-42d3-a456-426614174099"}};
  await expect(requireProjectReadAccess(forged as never,projectId))
   .rejects.toMatchObject({code:"PROJECT_ACCESS_DENIED"});
  expect(mocks.getDb).not.toHaveBeenCalled();
  expect(mocks.moduleAccess).not.toHaveBeenCalled();
 });
 it("denies inactive or removed college memberships before member table access",async()=>{
  for(const membership of [null,{...tpo.membership,status:"SUSPENDED"}]){
   mocks.queries=[[jobProject]];
   await expect(requireProjectReadAccess({...tpo,membership} as never,projectId))
    .rejects.toMatchObject({code:"PROJECT_ACCESS_DENIED"});
  }
  expect(mocks.select).toHaveBeenCalledTimes(2);
 });
 it("rejects inactive recruiter sessions independently of company grant",async()=>{
  const suspended={...recruiter,user:{...recruiter.user,platformStatus:"SUSPENDED"}};
  await expect(requireProjectReadAccess(suspended as never,projectId))
   .rejects.toMatchObject({code:"PROJECT_ACCESS_DENIED"});
 });
});
