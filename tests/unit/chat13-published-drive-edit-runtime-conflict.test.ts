import {beforeEach,describe,expect,it,vi} from "vitest";
import type {RequestContext} from "@/modules/identity/context";

const mocks=vi.hoisted(()=>({
  getDb:vi.fn(),
  resolveActingCollege:vi.fn(),
  assertPersistedPlatformPermission:vi.fn(),
}));
vi.mock("server-only",()=>({}));
vi.mock("@/db/client",()=>({getDb:mocks.getDb}));
vi.mock("@/modules/permissions/acting-college",()=>({
  resolveActingCollege:mocks.resolveActingCollege,
}));
vi.mock("@/modules/permissions/persisted-actor",()=>({
  assertPersistedPlatformPermission:mocks.assertPersistedPlatformPermission,
}));
vi.mock("@/modules/activity/service",()=>({
  recordActivityEventInTransaction:vi.fn(),
}));

import {editSuperAdminPublishedDrive} from "@/modules/placements/super-admin-published-drive-edit-service";

const admin:RequestContext={
 user:{id:"11111111-1111-4111-8111-111111111111",
  identityUid:"administrator",systemRoles:["SUPER_ADMIN"],platformStatus:"ACTIVE"},
 adminScope:{collegeId:"22222222-2222-4222-8222-222222222222",
  organizationId:"33333333-3333-4333-8333-333333333333"},
 membership:null,
};
const jobId="44444444-4444-4444-8444-444444444444";
const input={
 confirmed:true,expectedUpdatedAt:"2099-01-02T00:00:00.000Z",
 reason:"Update published description",title:"Graduate Engineering",
 description:"New details",locations:["Hyderabad"],
 applicationDeadline:"2099-12-31T00:00:00.000Z",openings:2,
 minimumAnnualCtcInr:300000,maximumAnnualCtcInr:800000,
};
class SelectedRows<T>{
 constructor(private readonly rows:readonly T[]){}
 from(){return this;}
 where(){return this;}
 for(){return this;}
 limit(){return Promise.resolve(this.rows);}
}

describe("SA-placements-projects-13-409 real service conflict classification",()=>{
 const updating=vi.fn(),inserting=vi.fn();
 const selecting=vi.fn();
 beforeEach(()=>{
  for(const fn of Object.values(mocks))fn.mockReset();
  updating.mockReset();inserting.mockReset();selecting.mockReset();
  mocks.resolveActingCollege.mockResolvedValue({
    collegeId:admin.adminScope!.collegeId,
    organizationId:admin.adminScope!.organizationId,
  });
  mocks.assertPersistedPlatformPermission.mockResolvedValue(admin);
  selecting.mockImplementation(()=>new SelectedRows([{
    id:jobId,status:"PUBLISHED",collegeId:admin.adminScope!.collegeId,
    updatedAt:new Date("2099-01-01T00:00:00.000Z"),
  }]));
  const tx={select:selecting,update:updating,insert:inserting};
  type Transaction=typeof tx;
  mocks.getDb.mockReturnValue({
   transaction:vi.fn(async(fn:(connection:Transaction)=>Promise<unknown>)=>fn(tx)),
  });
 });

 it("classifies a stale selected-college version as typed 409 before update or audit",async()=>{
  await expect(editSuperAdminPublishedDrive(admin,jobId,input))
   .rejects.toMatchObject({code:"PLACEMENT_JOB_STALE"});
  expect(mocks.assertPersistedPlatformPermission).toHaveBeenCalledTimes(1);
  expect(selecting).toHaveBeenCalledTimes(1);
  expect(updating).not.toHaveBeenCalled();
  expect(inserting).not.toHaveBeenCalled();
 });

 it("accepts offset-equivalent version instants rather than inventing a stale conflict",async()=>{
  await expect(editSuperAdminPublishedDrive(admin,jobId,{
   ...input,
   expectedUpdatedAt:"2099-01-01T05:30:00.000+05:30",
   applicationDeadline:"2020-01-01T00:00:00.000Z",
  })).rejects.toMatchObject({code:"PLACEMENT_JOB_INVALID_DEADLINE"});
  expect(selecting).toHaveBeenCalledTimes(1);
  expect(updating).not.toHaveBeenCalled();
 });

 it("blocks a recently revoked actor before any drive selection or mutation",async()=>{
  mocks.assertPersistedPlatformPermission.mockRejectedValueOnce(new Error("FORBIDDEN"));
  await expect(editSuperAdminPublishedDrive(admin,jobId,input)).rejects.toThrow("FORBIDDEN");
  expect(selecting).not.toHaveBeenCalled();
  expect(updating).not.toHaveBeenCalled();
 });
});
