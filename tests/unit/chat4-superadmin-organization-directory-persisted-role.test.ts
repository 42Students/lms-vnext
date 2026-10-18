import {beforeEach,describe,expect,it,vi} from "vitest";
import type {RequestContext} from "@/modules/identity/context";

const mocks=vi.hoisted(()=>({
 guard:vi.fn(),transaction:vi.fn(),select:vi.fn(),rows:[] as unknown[],
}));
vi.mock("@/modules/permissions/persisted-actor",()=>({
 assertPersistedPlatformPermission:mocks.guard,
}));
vi.mock("@/db/client",()=>({
 getDb:()=>({
  transaction:async(fn:(db:unknown)=>Promise<unknown>)=>{
   mocks.transaction();
   const db={select:()=>{
    mocks.select();
    return {
     from(){return this;},innerJoin(){return this;},where(){return this;},
     orderBy(){return this;},
     limit:()=>Promise.resolve(mocks.rows),
     then:(resolve:(value:unknown)=>unknown,reject:(error:unknown)=>unknown)=>
      Promise.resolve(mocks.rows).then(resolve,reject),
    };
   }};
   return fn(db);
  },
 }),
}));
import {listOrganizations} from "@/modules/organizations/service";

const org="aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const college="11111111-1111-4111-8111-111111111111";
const user="33333333-3333-4333-8333-333333333333";
const admin:RequestContext={
 user:{id:user,identityUid:"sa",platformStatus:"ACTIVE",systemRoles:["SUPER_ADMIN"]},
 membership:null,
 adminScope:{collegeId:college,organizationId:org},
};
const collegeAdmin:RequestContext={
 user:{id:user,identityUid:"ca",platformStatus:"ACTIVE",systemRoles:[]},
 membership:{id:"44444444-4444-4444-8444-444444444444",
  collegeId:college,organizationId:org,status:"ACTIVE",roles:["COLLEGE_ADMIN"]},
};
beforeEach(()=>{
 for(const fn of [mocks.guard,mocks.transaction,mocks.select])fn.mockReset();
 mocks.rows.length=0;
 mocks.rows.push({id:org,name:"Dharwad Institute",createdAt:new Date("2099-10-18T04:30:00Z")});
 mocks.guard.mockResolvedValue(undefined);
});
describe("SA-ORGANIZATIONS-ACTOR-09 persisted organization directory authorization",()=>{
 it.each([["Super Admin",admin],["College Admin",collegeAdmin]])(
  "denies %s whose persisted platform role was revoked before an organization SELECT",async(_label,context)=>{
   mocks.guard.mockRejectedValueOnce(new Error("ACTOR_REVOKED"));
   await expect(listOrganizations(context)).rejects.toThrow("ACTOR_REVOKED");
   expect(mocks.transaction).toHaveBeenCalledOnce();
   expect(mocks.guard).toHaveBeenCalledWith(expect.anything(),context,
    "organization.read",{organizationId:org,collegeId:college});
   expect(mocks.select).not.toHaveBeenCalled();
  });
 it("reads the selected college organization only after an authenticated persisted guard",async()=>{
  const result=await listOrganizations(admin);
  expect(result).toHaveLength(1);
  expect(result[0]).toMatchObject({id:org,name:"Dharwad Institute"});
  expect(mocks.guard).toHaveBeenCalledOnce();
  expect(mocks.select).toHaveBeenCalledOnce();
 });
 it("keeps College Admin membership scope in the persisted authorization call",async()=>{
  const result=await listOrganizations(collegeAdmin);
  expect(result[0]).toMatchObject({id:org});
  expect(mocks.guard).toHaveBeenCalledWith(expect.anything(),collegeAdmin,
   "organization.read",{organizationId:org,collegeId:college});
 });
 it("does not expose organizations from a disabled actor whose cached role is still Super Admin",async()=>{
  const disabled={...admin,user:{...admin.user,platformStatus:"DISABLED" as const}};
  await expect(listOrganizations(disabled)).rejects.toBeDefined();
  expect(mocks.select).not.toHaveBeenCalled();
 });
});
