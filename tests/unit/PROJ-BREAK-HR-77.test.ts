import {beforeEach,describe,expect,it,vi} from "vitest";
const m=vi.hoisted(()=>({getDb:vi.fn(),moduleAccess:vi.fn(),can:vi.fn()}));
vi.mock("@/db/client",()=>({getDb:m.getDb}));
vi.mock("@/modules/module-access/service",()=>({resolveOptionalModuleAccess:m.moduleAccess}));
vi.mock("@/modules/permissions/policy",()=>({can:m.can}));
import {requireProjectLifecycleMutationAccess} from "@/modules/projects/access";

const projectId="123e4567-e89b-42d3-a456-426614174001";
const collegeId="123e4567-e89b-42d3-a456-426614174002";
const organizationId="123e4567-e89b-42d3-a456-426614174003";
const actor=(roles:string[])=>({
 user:{id:"actor",platformStatus:"ACTIVE",systemRoles:[]},
 membership:{id:"membership",status:"ACTIVE",collegeId,organizationId,roles},
 recruiter:{userId:"actor",status:"ACTIVE",companyId:"employer",grants:[
  {collegeId,organizationId,companyRelationshipId:"relationship"},
 ]},
});
describe("PROJ-BREAK-HR-77: employer grant cannot trigger private project lifecycle reads",()=>{
 beforeEach(()=>{
  vi.clearAllMocks();m.moduleAccess.mockResolvedValue({projects:{enabled:true}});
 });
 it("denies HR-only principal before querying project ID or feature settings",async()=>{
  const context={...actor([]),membership:null};
  await expect(requireProjectLifecycleMutationAccess(context as never,projectId))
   .rejects.toMatchObject({code:"PROJECT_LIFECYCLE_ACCESS_DENIED"});
  expect(m.getDb).not.toHaveBeenCalled();
  expect(m.moduleAccess).not.toHaveBeenCalled();
 });
 it("denies TPO and learner roles even when the same account also has company grants",async()=>{
  for(const roles of [["TPO"],["LEARNER"],["FACULTY"],["TPO","LEARNER"]]){
   await expect(requireProjectLifecycleMutationAccess(actor(roles) as never,projectId))
    .rejects.toMatchObject({code:"PROJECT_LIFECYCLE_ACCESS_DENIED"});
  }
  expect(m.getDb).not.toHaveBeenCalled();
  expect(m.moduleAccess).not.toHaveBeenCalled();
 });
 it("suspended, disabled and revoked mentor privileges fail before module/settings IO",async()=>{
  const mentor=actor(["MENTOR"]);
  for(const context of [
   {...mentor,user:{...mentor.user,platformStatus:"DISABLED"}},
   {...mentor,membership:{...mentor.membership,status:"SUSPENDED"}},
   {...mentor,membership:{...mentor.membership,roles:[]}},
  ]){
   await expect(requireProjectLifecycleMutationAccess(context as never,projectId))
    .rejects.toMatchObject({code:"PROJECT_LIFECYCLE_ACCESS_DENIED"});
  }
  expect(m.getDb).not.toHaveBeenCalled();
  expect(m.moduleAccess).not.toHaveBeenCalled();
 });
 it("an active mentor still observes the module-off gate before project existence lookup",async()=>{
  m.moduleAccess.mockResolvedValue({projects:{enabled:false}});
  await expect(requireProjectLifecycleMutationAccess(actor(["MENTOR"]) as never,projectId))
   .rejects.toMatchObject({code:"PROJECT_LIFECYCLE_ACCESS_DENIED"});
  expect(m.moduleAccess).toHaveBeenCalledTimes(1);
  expect(m.getDb).not.toHaveBeenCalled();
 });
});