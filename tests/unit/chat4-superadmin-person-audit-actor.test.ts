import { beforeEach, describe, expect, it, vi } from "vitest";
import type { RequestContext } from "@/modules/identity/context";

const mocks=vi.hoisted(()=>({
 member:vi.fn(),guard:vi.fn(),transaction:vi.fn(),select:vi.fn(),
 limit:vi.fn(),rows:[] as Array<Record<string,unknown>>,
}));
vi.mock("@/modules/people/admin-membership-detail-service",()=>({
 getSuperAdminMembershipDetail:mocks.member,
}));
vi.mock("@/modules/permissions/persisted-actor",()=>({
 assertPersistedPlatformPermission:mocks.guard,
}));
vi.mock("@/db/client",()=>({
 getDb:()=>({
  transaction:async(fn:(tx:unknown)=>Promise<unknown>)=>{
   mocks.transaction();
   const tx={select:()=>{
    mocks.select();
    return {from(){return this;},where(){return this;},orderBy(){return this;},
     limit(n:number){mocks.limit(n);return Promise.resolve(mocks.rows);},
    };
   }};
   return fn(tx);
  },
 }),
}));
import { listSuperAdminPersonAudit } from "@/modules/people/super-admin-person-audit-service";

const collegeId="11111111-1111-4111-8111-111111111111";
const org="aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const membershipId="22222222-2222-4222-8222-222222222222";
const actor:RequestContext={
 user:{id:"super-admin",identityUid:"sa",platformStatus:"ACTIVE",systemRoles:["SUPER_ADMIN"]},
 membership:null,adminScope:{collegeId,organizationId:org},
};
beforeEach(()=>{
 for(const fn of [mocks.member,mocks.guard,mocks.transaction,mocks.select,mocks.limit])fn.mockReset();
 mocks.rows.length=0;
 mocks.guard.mockResolvedValue(undefined);
 mocks.member.mockResolvedValue({id:membershipId,name:"Student A"});
});
describe("SA-people-audit-ACTOR-01 person audit data after stale Super Admin role revocation",()=>{
 it("does not query a global membership or audit trail without an explicit selected college",async()=>{
  const root:RequestContext={...actor,adminScope:null};
  await expect(listSuperAdminPersonAudit(root,membershipId)).resolves.toBeNull();
  expect(mocks.member).not.toHaveBeenCalled();
  expect(mocks.transaction).not.toHaveBeenCalled();
 });
 it("does not open the activity table for an absent or foreign-scoped membership",async()=>{
  mocks.member.mockResolvedValueOnce(null);
  await expect(listSuperAdminPersonAudit(actor,membershipId)).resolves.toBeNull();
  expect(mocks.transaction).not.toHaveBeenCalled();
  expect(mocks.select).not.toHaveBeenCalled();
 });
 it("denies a revoked administrator inside the event-read transaction",async()=>{
  mocks.guard.mockRejectedValueOnce(new Error("SUPER_ADMIN_REVOKED"));
  await expect(listSuperAdminPersonAudit(actor,membershipId))
   .rejects.toThrow("SUPER_ADMIN_REVOKED");
  expect(mocks.guard).toHaveBeenCalledWith(expect.anything(),actor,"people.manage",{
   collegeId,organizationId:org,
  });
  expect(mocks.select).not.toHaveBeenCalled();
 });
 it("returns only the selected membership and 100 event projections after live actor verification",async()=>{
  const event={id:"event",occurredAt:new Date("2099-10-18T00:00:00Z"),
   eventType:"IDENTITY_ROLE_ASSIGNED",importance:"NORMAL",
   summary:"Administrator changed the membership",module:"IDENTITY",
   subjectType:"membership"};
  mocks.rows.push(event);
  const result=await listSuperAdminPersonAudit(actor,membershipId);
  expect(result).toEqual({
   membership:{id:membershipId,name:"Student A"},events:[event],
  });
  expect(mocks.transaction).toHaveBeenCalledOnce();
  expect(mocks.guard).toHaveBeenCalledOnce();
  expect(mocks.select).toHaveBeenCalledOnce();
  expect(mocks.limit).toHaveBeenCalledWith(100);
  expect(JSON.stringify(result)).not.toContain("raw_metadata");
 });
});
