import {beforeEach,describe,expect,it,vi} from "vitest";
import type {RequestContext} from "@/modules/identity/context";

const mocks=vi.hoisted(()=>({
 guard:vi.fn(),tx:vi.fn(),select:vi.fn(),
 rows:[] as unknown[],
}));
vi.mock("@/modules/permissions/persisted-actor",()=>({
 assertPersistedPlatformPermission:mocks.guard,
}));
vi.mock("@/db/client",()=>({
 getDb:()=>({
  transaction:async(fn:(tx:unknown)=>Promise<unknown>)=>{
   mocks.tx();
   const db={select:()=>{
    mocks.select();
    return {from(){return this;},innerJoin(){return this;},where(){return this;},
     orderBy(){return this;},limit:()=>Promise.resolve(mocks.rows),
     then:(resolve:(value:unknown)=>unknown,reject:(error:unknown)=>unknown)=>
      Promise.resolve(mocks.rows).then(resolve,reject),
    };
   }};
   return fn(db);
  },
 }),
}));
import {listColleges} from "@/modules/colleges/service";
const org="aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const college="11111111-1111-4111-8111-111111111111";
const user="33333333-3333-4333-8333-333333333333";
const sa:RequestContext={
 user:{id:user,identityUid:"sa",platformStatus:"ACTIVE",systemRoles:["SUPER_ADMIN"]},
 membership:null,adminScope:{collegeId:college,organizationId:org},
};
const ca:RequestContext={
 user:{id:user,identityUid:"ca",platformStatus:"ACTIVE",systemRoles:[]},
 membership:{id:"44444444-4444-4444-8444-444444444444",
  collegeId:college,organizationId:org,status:"ACTIVE",roles:["COLLEGE_ADMIN"]},
};
beforeEach(()=>{
 for(const fn of [mocks.guard,mocks.tx,mocks.select])fn.mockReset();
 mocks.rows.length=0;mocks.rows.push({id:college,organizationId:org,
  name:"IIT Dharwad",code:"IITD"});
 mocks.guard.mockResolvedValue(undefined);
});
describe("SA-COLLEGES-ACTOR-10 persisted tenant listing access",()=>{
 it.each([["Super Admin",sa],["College Admin",ca]])(
  "refuses a revoked %s before reading even one tenant identifier",async(_role,context)=>{
   mocks.guard.mockRejectedValueOnce(new Error("REVOKED"));
   await expect(listColleges(context)).rejects.toThrow("REVOKED");
   expect(mocks.tx).toHaveBeenCalledOnce();
   expect(mocks.guard).toHaveBeenCalledWith(expect.anything(),context,
    "college.read",{collegeId:college,organizationId:org});
   expect(mocks.select).not.toHaveBeenCalled();
  });
 it.each([["Super Admin",sa],["College Admin",ca]])(
  "returns selected-tenant rows under the persisted %s role guard",async(_role,context)=>{
   const items=await listColleges(context);
   expect(items).toEqual([{id:college,organizationId:org,
    name:"IIT Dharwad",code:"IITD"}]);
   expect(mocks.guard).toHaveBeenCalledOnce();
   expect(mocks.select).toHaveBeenCalledOnce();
  });
 it("rejects cross-organization URL override before disclosing a college directory row",async()=>{
  await expect(listColleges(sa,"bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb"))
   .rejects.toBeDefined();
  expect(mocks.select).not.toHaveBeenCalled();
 });
 it("rejects disabled actors even if the request context claims Super Admin privileges",async()=>{
  const disabled={...sa,user:{...sa.user,platformStatus:"DISABLED" as const}};
  await expect(listColleges(disabled)).rejects.toBeDefined();
  expect(mocks.select).not.toHaveBeenCalled();
 });
});
