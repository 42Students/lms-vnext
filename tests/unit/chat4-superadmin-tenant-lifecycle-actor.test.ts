import {beforeEach,describe,expect,it,vi} from "vitest";
import type {RequestContext} from "@/modules/identity/context";
import {
 getSuperAdminTenantLifecycleDirectory,
 getSuperAdminTenantLifecycleDetail,
 exportSuperAdminTenantDirectory,
} from "@/modules/colleges/admin-tenant-lifecycle-service";

const mocks=vi.hoisted(()=>({
 guard:vi.fn(),
 listOrganizations:vi.fn(),
 sourceSelect:vi.fn(),
 txSelect:vi.fn(),
 transaction:vi.fn(),
 results:{total:1,items:[] as Array<Record<string,unknown>>},
}));
vi.mock("@/modules/permissions/persisted-actor",()=>({
 assertPersistedPlatformPermission:mocks.guard,
}));
vi.mock("@/modules/organizations/service",()=>({
 listOrganizations:mocks.listOrganizations,
}));
vi.mock("@/db/client",async()=>{
 const {sql}=await import("drizzle-orm");
 const query=()=>({
  from(){return this;},innerJoin(){return this;},where(){return this;},
  as(){return {id:sql`college_id`,name:sql`college_name`};},
 });
 const tx={
  select:(projection?:unknown)=>{
   mocks.txSelect(projection);
   const call=mocks.txSelect.mock.calls.length;
   return {
    from(){
     if(call===1 && projection && typeof projection==="object" && "total" in projection)
      return Promise.resolve([{total:mocks.results.total}]);
     return {
      where(){return this;},orderBy(){return this;},
      limit(n:number){
       if(n===1||n===1001)return Promise.resolve(mocks.results.items);
       return this;
      },
      offset(){return Promise.resolve(mocks.results.items);},
     };
    },
   };
  },
 };
 return {getDb:()=>({
  select:(projection?:unknown)=>{mocks.sourceSelect(projection);return query();},
  transaction:async(callback:(transaction:typeof tx)=>Promise<unknown>)=>{
   mocks.transaction();
   return callback(tx);
  },
 })};
});
const college="11111111-1111-4111-8111-111111111111";
const org="aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const actor:RequestContext={
 user:{id:"admin",identityUid:"admin",platformStatus:"ACTIVE",systemRoles:["SUPER_ADMIN"]},
 membership:null,adminScope:{collegeId:college,organizationId:org},
};
beforeEach(()=>{
 for(const v of [mocks.guard,mocks.listOrganizations,mocks.sourceSelect,mocks.txSelect,mocks.transaction])v.mockReset();
 mocks.results.total=1;mocks.results.items=[];
 mocks.guard.mockResolvedValue(actor);
 mocks.listOrganizations.mockResolvedValue([{id:org,name:"College parent"}]);
});

describe("Super Admin persisted tenant-directory authority and audit-safe export",()=>{
 it("SA-tenants-lifecycle-ACTOR-01 revoked role blocks directory records even after a valid request snapshot",async()=>{
  mocks.guard.mockRejectedValueOnce(new Error("PERSISTED_ROLE_REVOKED"));
  await expect(getSuperAdminTenantLifecycleDirectory(actor,{page:1,status:"ACTIVE"}))
   .rejects.toThrow("PERSISTED_ROLE_REVOKED");
  expect(mocks.guard).toHaveBeenCalledWith(expect.anything(),actor,"college.read",{
   collegeId:college,organizationId:org,
  });
  expect(mocks.transaction).toHaveBeenCalledOnce();
  expect(mocks.txSelect).not.toHaveBeenCalled();
 });
 it("SA-tenants-lifecycle-ACTOR-02 page counts, page data and organization options are returned only after persisted guard",async()=>{
  mocks.results.items=[{id:college,name:"College"}];
  const data=await getSuperAdminTenantLifecycleDirectory(actor,{page:1,status:"ACTIVE"});
  expect(data.items).toEqual(mocks.results.items);
  expect(data.organizations).toEqual([{id:org,name:"College parent"}]);
  expect(data.total).toBe(1);
  expect(data.totalPages).toBe(1);
  expect(mocks.guard).toHaveBeenCalledOnce();
  expect(mocks.txSelect).toHaveBeenCalledTimes(2);
 });
 it("SA-tenants-lifecycle-ACTOR-03 missing or malformed college ID denies detail without SQL and wrong-role service errors do not leak tenant rows",async()=>{
  await expect(getSuperAdminTenantLifecycleDetail(actor,"bad-id"))
   .rejects.toBeDefined();
  expect(mocks.txSelect).not.toHaveBeenCalled();
  mocks.guard.mockRejectedValueOnce(new Error("REVOKED"));
  await expect(getSuperAdminTenantLifecycleDetail(actor,college)).rejects.toThrow("REVOKED");
  expect(mocks.txSelect).not.toHaveBeenCalled();
 });
 it("SA-tenants-lifecycle-ACTOR-04 tenant CSV export denies revoked Super Admin before any dataset query",async()=>{
  mocks.guard.mockRejectedValueOnce(new Error("REVOKED"));
  await expect(exportSuperAdminTenantDirectory(actor,{q:"",organizationId:org,status:"ACTIVE"}))
   .rejects.toThrow("REVOKED");
  expect(mocks.txSelect).not.toHaveBeenCalled();
  mocks.results.items=[];
  const result=await exportSuperAdminTenantDirectory(actor,{q:"",organizationId:org,status:"ACTIVE"});
  expect(result).toMatchObject({exported:0,truncated:false,cap:1000});
  expect(mocks.txSelect).toHaveBeenCalledOnce();
 });
});
