import {beforeEach,describe,expect,it,vi} from "vitest";
import type {RequestContext} from "@/modules/identity/context";

const mocks=vi.hoisted(()=>({
 college:vi.fn(),persisted:vi.fn(),transaction:vi.fn(),select:vi.fn(),
}));
vi.mock("@/modules/projects/scope",()=>({
 loadProjectCollegeScope:mocks.college,
}));
vi.mock("@/modules/permissions/persisted-actor",()=>({
 assertPersistedPlatformPermission:mocks.persisted,
}));
vi.mock("@/db/client",()=>({
 getDb:()=>({
  transaction:async(fn:(tx:unknown)=>Promise<unknown>)=>{
   mocks.transaction();
   const tx={select:()=>{
    mocks.select();
    const builder={
     from(){return this;},where(){return this;},orderBy(){return this;},
     limit(){return this;},
     offset:async()=>[],
     then:(resolve:(rows:{value:number}[])=>unknown,reject:(error:unknown)=>unknown)=>
      Promise.resolve([{value:0}]).then(resolve,reject),
    };
    return builder;
   }};
   return fn(tx);
  },
 }),
}));
import {listProjectAdminSnapshots} from "@/modules/projects/admin-insights-service";

const collegeId="11111111-1111-4111-8111-111111111111";
const otherId="22222222-2222-4222-8222-222222222222";
const org="aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const userId="33333333-3333-4333-8333-333333333333";
const collegeAdmin:RequestContext={
 user:{id:userId,identityUid:"college-admin",platformStatus:"ACTIVE",systemRoles:[]},
 membership:{id:"44444444-4444-4444-8444-444444444444",
  collegeId,organizationId:org,status:"ACTIVE",roles:["COLLEGE_ADMIN"]},
};
const superAdmin:RequestContext={
 user:{id:userId,identityUid:"sa",platformStatus:"ACTIVE",systemRoles:["SUPER_ADMIN"]},
 membership:null,adminScope:{collegeId,organizationId:org},
};
beforeEach(()=>{
 for(const fn of Object.values(mocks))fn.mockReset();
 mocks.college.mockResolvedValue({id:collegeId,organizationId:org});
 mocks.persisted.mockResolvedValue(undefined);
});

describe("PROJ-BREAK-COLLEGE-04-READ-01 persisted project workspace directory access",()=>{
 it("rejects a stale College Admin session revoked between the selected-college preflight and project SELECT",async()=>{
  mocks.persisted.mockRejectedValueOnce(new Error("ACTOR_REVOKED"));
  await expect(listProjectAdminSnapshots(collegeAdmin,collegeId,{
   page:1,pageSize:25,
  })).rejects.toThrow("ACTOR_REVOKED");
  expect(mocks.transaction).toHaveBeenCalledOnce();
  expect(mocks.persisted).toHaveBeenCalledWith(
   expect.anything(),collegeAdmin,"projects.manage",{
    collegeId,organizationId:org,
   },
  );
  expect(mocks.select).not.toHaveBeenCalled();
 });
 it("returns an empty, honestly paginated own-college directory only after locked persisted authorization",async()=>{
  const response=await listProjectAdminSnapshots(collegeAdmin,collegeId,{
   q:"mentored capstone",page:1,pageSize:10,
  });
  expect(response).toMatchObject({
   items:[],total:0,page:1,pageSize:10,totalPages:1,
  });
  expect(mocks.persisted).toHaveBeenCalledOnce();
  expect(mocks.select).toHaveBeenCalledTimes(2);
 });
 it("requires a selected college for platform Super Admin and refuses a mismatched organization",async()=>{
  const unselected={...superAdmin,adminScope:null};
  await expect(listProjectAdminSnapshots(unselected,collegeId,{})).rejects.toBeDefined();
  const wrong={...superAdmin,adminScope:{collegeId:otherId,organizationId:org}};
  await expect(listProjectAdminSnapshots(wrong,collegeId,{})).rejects.toBeDefined();
  expect(mocks.transaction).not.toHaveBeenCalled();
  expect(mocks.select).not.toHaveBeenCalled();
 });
 it("denies a learner, TPO, suspended membership or disabled account before the private read transaction",async()=>{
  const base=collegeAdmin.membership!;
  for(const context of [
   {...collegeAdmin,membership:{...base,roles:["LEARNER" as const]}},
   {...collegeAdmin,membership:{...base,roles:["TPO" as const]}},
   {...collegeAdmin,membership:{...base,status:"SUSPENDED" as const}},
   {...collegeAdmin,user:{...collegeAdmin.user,platformStatus:"DISABLED" as const}},
  ]){
   await expect(listProjectAdminSnapshots(context,collegeId,{})).rejects.toBeDefined();
  }
  expect(mocks.transaction).not.toHaveBeenCalled();
 });
 it("denies querying another tenant even with a valid College Admin membership",async()=>{
  mocks.college.mockResolvedValue({id:otherId,organizationId:org});
  await expect(listProjectAdminSnapshots(collegeAdmin,otherId,{})).rejects.toBeDefined();
  expect(mocks.transaction).not.toHaveBeenCalled();
 });
 it("accepts a properly selected Super Admin only through persisted platform roles",async()=>{
  const response=await listProjectAdminSnapshots(superAdmin,collegeId,{});
  expect(response.items).toEqual([]);
  expect(mocks.persisted).toHaveBeenCalledWith(expect.anything(),superAdmin,
   "projects.manage",{collegeId,organizationId:org});
 });
});
