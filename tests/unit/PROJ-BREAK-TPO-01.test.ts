import {beforeEach,describe,expect,it,vi} from "vitest";
import type {RequestContext} from "@/modules/identity/context";

const mocks=vi.hoisted(()=>({
 getDb:vi.fn(),can:vi.fn(),college:vi.fn(),moduleAccess:vi.fn(),
 select:vi.fn(),rows:[] as unknown[][],
}));
vi.mock("@/db/client",()=>({getDb:mocks.getDb}));
vi.mock("@/modules/permissions/policy",()=>({can:mocks.can}));
vi.mock("@/modules/projects/scope",()=>({loadProjectCollegeScope:mocks.college}));
vi.mock("@/modules/module-access/service",()=>({resolveOptionalModuleAccess:mocks.moduleAccess}));
import {requireProjectReadAccess,requireProjectManageAccess,requireProjectLifecycleAccess}
 from "@/modules/projects/access";
const PROJECT="123e4567-e89b-42d3-a456-426614174001";
const COLLEGE="123e4567-e89b-42d3-a456-426614174002";
const ORG="123e4567-e89b-42d3-a456-426614174003";
const FOREIGN="123e4567-e89b-42d3-a456-426614174004";
const tpo=(override:Partial<RequestContext>={}):RequestContext=>({
 user:{id:"123e4567-e89b-42d3-a456-426614174005",
  identityUid:"fixture-tpo",platformStatus:"ACTIVE",systemRoles:[]},
 membership:{id:"123e4567-e89b-42d3-a456-426614174006",
  collegeId:COLLEGE,organizationId:ORG,status:"ACTIVE",roles:["TPO"]},
 ...override,
});
const query=(rows:unknown[])=>({from(){return this;},where(){return this;},
 innerJoin(){return this;},limit(){return Promise.resolve(rows);}});

describe("PROJ-BREAK-TPO-01 Projects are NOT accessible from roster visibility alone",()=>{
 beforeEach(()=>{
  vi.clearAllMocks();
  mocks.rows=[[{id:PROJECT,collegeId:COLLEGE}],[]];
  mocks.select.mockImplementation(()=>query(mocks.rows.shift()??[]));
  mocks.getDb.mockReturnValue({select:mocks.select});
  mocks.college.mockResolvedValue({id:COLLEGE,organizationId:ORG});
  mocks.can.mockReturnValue(false);
  mocks.moduleAccess.mockResolvedValue({projects:{enabled:true}});
 });
 it("TPO student-directory permission does not expose unassigned project workspace",async()=>{
  const context=tpo();
  await expect(requireProjectReadAccess(context,PROJECT)).rejects.toMatchObject({code:"PROJECT_ACCESS_DENIED"});
  expect(mocks.can).toHaveBeenCalledWith(context,"projects.manage",{organizationId:ORG,collegeId:COLLEGE});
  expect(mocks.select).toHaveBeenCalledTimes(2);
  expect(mocks.moduleAccess).not.toHaveBeenCalled();
 });
 it("a forged membership claim for mentor role cannot bypass persisted membership role check",async()=>{
  mocks.rows=[[{id:PROJECT,collegeId:COLLEGE}],[{
   id:"member",role:"MENTOR",roleKind:"MENTOR",canMutate:true,isPrimary:true,
  }]];
  await expect(requireProjectReadAccess(tpo(),PROJECT)).rejects.toMatchObject({code:"PROJECT_ACCESS_DENIED"});
  expect(mocks.moduleAccess).not.toHaveBeenCalled();
 });
 it("foreign college and foreign organization cannot infer assigned project-membership records",async()=>{
  for(const member of [
   {...tpo().membership!,collegeId:FOREIGN},
   {...tpo().membership!,organizationId:FOREIGN,collegeId:FOREIGN},
  ]){
   mocks.rows=[[{id:PROJECT,collegeId:COLLEGE}]];
   await expect(requireProjectReadAccess(tpo({membership:member}),PROJECT))
    .rejects.toMatchObject({code:"PROJECT_ACCESS_DENIED"});
  }
  expect(mocks.select).toHaveBeenCalledTimes(2);
 });
 it("stale sessions, removed members and disabled platform users stop before project member traversal",async()=>{
  const original=tpo();
  for(const context of [
   tpo({membership:null}),
   tpo({membership:{...original.membership!,status:"SUSPENDED"}}),
   tpo({user:{...original.user,platformStatus:"DISABLED"}}),
  ]){
   mocks.rows=[[{id:PROJECT,collegeId:COLLEGE}]];
   await expect(requireProjectReadAccess(context,PROJECT)).rejects.toMatchObject({code:"PROJECT_ACCESS_DENIED"});
  }
  expect(mocks.select).toHaveBeenCalledTimes(3);
 });
 it("repeated stale-tab lifecycle and manage mutations are refused regardless of a known project ID",async()=>{
  for(let attempt=0;attempt<3;attempt++){
   mocks.rows=[[{id:PROJECT,collegeId:COLLEGE}]];
   await expect(requireProjectManageAccess(tpo(),PROJECT))
    .rejects.toMatchObject({code:"PROJECT_ACCESS_DENIED"});
   mocks.rows=[[{id:PROJECT,collegeId:COLLEGE}],[]];
   await expect(requireProjectLifecycleAccess(tpo(),PROJECT))
    .rejects.toMatchObject({code:"PROJECT_ACCESS_DENIED"});
  }
  expect(mocks.moduleAccess).not.toHaveBeenCalled();
 });
 it("rejects non-UUID and nonexistent IDs without granting a guessed record",async()=>{
  await expect(requireProjectReadAccess(tpo(),"../another-college")).rejects.toBeDefined();
  mocks.rows=[[]];
  await expect(requireProjectReadAccess(tpo(),PROJECT)).rejects.toMatchObject({code:"PROJECT_NOT_FOUND"});
 });
});
