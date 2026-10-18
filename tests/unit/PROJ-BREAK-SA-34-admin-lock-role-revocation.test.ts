import {beforeEach,describe,expect,it,vi} from "vitest";
import type {RequestContext} from "@/modules/identity/context";

const mocks=vi.hoisted(()=>({
  requireProjectManageAccess:vi.fn(),
  assertPersistedPlatformPermission:vi.fn(),
  getDb:vi.fn(),
  recordActivityEventInTransaction:vi.fn(),
}));
vi.mock("server-only",()=>({}));
vi.mock("@/db/client",()=>({getDb:mocks.getDb}));
vi.mock("@/modules/projects/access",()=>({requireProjectManageAccess:mocks.requireProjectManageAccess}));
vi.mock("@/modules/permissions/persisted-actor",()=>({
  assertPersistedPlatformPermission:mocks.assertPersistedPlatformPermission,
}));
vi.mock("@/modules/activity/service",()=>({
  recordActivityEventInTransaction:mocks.recordActivityEventInTransaction,
}));

import {lockAdminProjectSubmission} from "@/modules/projects/admin-submission-review-service";

const collegeId="22222222-2222-4222-8222-222222222222";
const organizationId="33333333-3333-4333-8333-333333333333";
const projectId="44444444-4444-4444-8444-444444444444";
const submissionId="55555555-5555-4555-8555-555555555555";
const membershipId="66666666-6666-4666-8666-666666666666";
const actor:RequestContext={
  user:{id:"11111111-1111-4111-8111-111111111111",identityUid:"identity-admin",
    platformStatus:"ACTIVE",systemRoles:[]},
  adminScope:null,
  membership:{id:membershipId,collegeId,organizationId,status:"ACTIVE",roles:["COLLEGE_ADMIN"]},
};

describe("PROJ-BREAK-SA-34 persisted actor guard precedes project and submission row locks",()=>{
  const select=vi.fn(),update=vi.fn(),insert=vi.fn();
  beforeEach(()=>{
    for(const mock of Object.values(mocks))mock.mockReset();
    select.mockReset();update.mockReset();insert.mockReset();
    mocks.requireProjectManageAccess.mockResolvedValue({
      project:{id:projectId},collegeId,organizationId,access:"ADMIN",
    });
    mocks.assertPersistedPlatformPermission.mockResolvedValue(actor);
    const tx={select,update,insert};
    type Tx=typeof tx;
    mocks.getDb.mockReturnValue({
      transaction:vi.fn(async(fn:(client:Tx)=>Promise<unknown>)=>fn(tx)),
    });
  });

  it("denies role removed after opening the dialog without taking project or submission locks",async()=>{
    mocks.assertPersistedPlatformPermission.mockRejectedValueOnce(new Error("PERMISSION_REVOKED"));
    await expect(lockAdminProjectSubmission(actor,projectId,submissionId,{reason:"Reviewer lock"}))
      .rejects.toThrow("PERMISSION_REVOKED");
    expect(mocks.assertPersistedPlatformPermission).toHaveBeenCalledWith(
      expect.anything(),actor,"projects.manage",{collegeId,organizationId},
    );
    expect(select).not.toHaveBeenCalled();
    expect(update).not.toHaveBeenCalled();
    expect(insert).not.toHaveBeenCalled();
    expect(mocks.recordActivityEventInTransaction).not.toHaveBeenCalled();
  });

  it("denies a stale request membership changed to a different College Admin before reading the submission",async()=>{
    const differentMembership={
      ...actor,membership:{...actor.membership!,id:"77777777-7777-4777-8777-777777777777"},
    };
    mocks.assertPersistedPlatformPermission.mockResolvedValueOnce(differentMembership);
    await expect(lockAdminProjectSubmission(actor,projectId,submissionId,{reason:"Reviewer lock"}))
      .rejects.toMatchObject({code:"PROJECT_LIFECYCLE_ACCESS_DENIED"});
    expect(select).not.toHaveBeenCalled();
    expect(update).not.toHaveBeenCalled();
    expect(insert).not.toHaveBeenCalled();
  });

  it("rejects blank or extra-field lock reasons without inserting an event",async()=>{
    for(const command of [{reason:""},{reason:"OK",overrideLock:true},{reason:"x".repeat(4001)}]){
      await expect(lockAdminProjectSubmission(actor,projectId,submissionId,command)).rejects.toThrow();
    }
    expect(mocks.getDb).not.toHaveBeenCalled();
    expect(select).not.toHaveBeenCalled();
    expect(mocks.recordActivityEventInTransaction).not.toHaveBeenCalled();
  });
});
