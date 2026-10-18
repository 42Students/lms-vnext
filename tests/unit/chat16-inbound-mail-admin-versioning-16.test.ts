import {afterEach,beforeEach,describe,expect,it,vi} from "vitest";
import {getDb} from "@/db/client";
import type {RequestContext} from "@/modules/identity/context";
import {changeInboundMailStatusForAdmin,drizzleInboundMailAdminRepository} from "@/modules/inbound-mail/admin-service";

vi.mock("@/db/client",()=>({getDb:vi.fn()}));

const id="11111111-1111-4111-8111-111111111111";
const admin:RequestContext={
 user:{id:"sa",identityUid:"identity-sa",platformStatus:"ACTIVE",systemRoles:["SUPER_ADMIN"]},
 membership:null,
};
const mutation={id,expectedStatus:"NEW",expectedVersion:2,status:"RESOLVED"};
const updateDb=(rows:readonly {id:string;status:"NEW"|"TRIAGED"|"RESOLVED";version:number}[])=>{
 const returning=vi.fn(async()=>rows);
 const where=vi.fn(()=>({returning}));
 const set=vi.fn(()=>({where}));
 const update=vi.fn(()=>({set}));
 vi.mocked(getDb).mockReturnValue({update} as unknown as ReturnType<typeof getDb>);
 return {returning,where,set,update};
};
beforeEach(()=>{
 vi.clearAllMocks();
 vi.spyOn(drizzleInboundMailAdminRepository,"tableExists").mockResolvedValue(true);
});
afterEach(()=>vi.restoreAllMocks());

describe("chat-16 inbound mail admin versioned triage service",()=>{
 it("inbound-mail-write-16 denies the wrong role, disabled Super Admin and acting-in-college impersonation",async()=>{
  const invalid:RequestContext[]=[
   {...admin,user:{...admin.user,systemRoles:[]}},
   {...admin,user:{...admin.user,platformStatus:"DISABLED"}},
   {...admin,adminScope:{organizationId:"other-org",collegeId:null}},
   {...admin,adminScope:{organizationId:null,collegeId:"other-college"}},
  ];
  for(const ctx of invalid){
   await expect(changeInboundMailStatusForAdmin(ctx,mutation)).rejects.toThrow();
  }
  expect(drizzleInboundMailAdminRepository.tableExists).not.toHaveBeenCalled();
  expect(getDb).not.toHaveBeenCalled();
 });
 it("inbound-mail-write-17 rejects forged version, unsupported state and mass-assignment before storage",async()=>{
  const invalid=[
   {...mutation,id:"not-a-uuid"},
   {...mutation,expectedVersion:-1},
   {...mutation,expectedVersion:1.5},
   {...mutation,status:"NEW"},
   {...mutation,status:"INVALID"},
   {...mutation,arbitraryRecipient:"victim@example.org"},
  ];
  for(const input of invalid){
   await expect(changeInboundMailStatusForAdmin(admin,input)).rejects.toThrow();
  }
  expect(drizzleInboundMailAdminRepository.tableExists).not.toHaveBeenCalled();
  expect(getDb).not.toHaveBeenCalled();
 });
 it("inbound-mail-write-18 does not mark unavailable storage as a completed mutation",async()=>{
  vi.mocked(drizzleInboundMailAdminRepository.tableExists).mockResolvedValue(false);
  await expect(changeInboundMailStatusForAdmin(admin,mutation)).resolves.toEqual({kind:"UNAVAILABLE"});
  expect(getDb).not.toHaveBeenCalled();
 });
 it("inbound-mail-write-19 reports a version or status race as stale, never success",async()=>{
  const mocks=updateDb([]);
  await expect(changeInboundMailStatusForAdmin(admin,mutation)).resolves.toEqual({kind:"STALE"});
  expect(mocks.update).toHaveBeenCalledTimes(1);
  expect(mocks.set).toHaveBeenCalledWith(expect.objectContaining({status:"RESOLVED"}));
  expect(mocks.where).toHaveBeenCalledTimes(1);
 });
 it("inbound-mail-write-21 allows NEW to TRIAGED with optimistic version lock",async()=>{
  const mocks=updateDb([{id,status:"TRIAGED",version:3}]);
  await expect(changeInboundMailStatusForAdmin(admin,{...mutation,status:"TRIAGED"}))
   .resolves.toEqual({kind:"UPDATED",id,status:"TRIAGED",version:3});
  expect(mocks.set).toHaveBeenCalledWith(expect.objectContaining({status:"TRIAGED"}));
 });
 it("inbound-mail-write-22 rejects RESOLVED to TRIAGED without reopening",async()=>{
  await expect(changeInboundMailStatusForAdmin(admin,{
    ...mutation,expectedStatus:"RESOLVED",status:"TRIAGED",
  })).rejects.toThrow("Unsupported inbound mail transition");
  expect(drizzleInboundMailAdminRepository.tableExists).not.toHaveBeenCalled();
 });
 it("inbound-mail-write-20 returns the persisted state and version after a guarded update",async()=>{
  const mocks=updateDb([{id,status:"RESOLVED",version:3}]);
  await expect(changeInboundMailStatusForAdmin(admin,mutation)).resolves.toEqual({
   kind:"UPDATED",id,status:"RESOLVED",version:3,
  });
  expect(mocks.returning).toHaveBeenCalledTimes(1);
 });
});
