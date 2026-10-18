import { beforeEach, describe, expect, it, vi } from "vitest";
import { getDb } from "@/db/client";
import { getSuperAdminTenantLifecycleDetail } from "@/modules/colleges/admin-tenant-lifecycle-service";
import { recordActivityEventInTransaction } from "@/modules/activity/service";
import { assertPersistedPlatformPermission } from "@/modules/permissions/persisted-actor";
import { revokeCollegeAdminSessions } from "@/modules/colleges/admin-session-service";
import type { RequestContext } from "@/modules/identity/context";

vi.mock("@/db/client",()=>({getDb:vi.fn()}));
vi.mock("@/modules/colleges/admin-tenant-lifecycle-service",
  ()=>({getSuperAdminTenantLifecycleDetail:vi.fn()}));
vi.mock("@/modules/activity/service",()=>({recordActivityEventInTransaction:vi.fn()}));
vi.mock("@/modules/permissions/persisted-actor",
  ()=>({assertPersistedPlatformPermission:vi.fn()}));

const collegeId="11111111-1111-4111-8111-111111111111";
const organizationId="22222222-2222-4222-8222-222222222222";
const userId="33333333-3333-4333-8333-333333333333";
const membershipId="44444444-4444-4444-8444-444444444444";
const actor:RequestContext={
  user:{id:"55555555-5555-4555-8555-555555555555",
    identityUid:"active-platform-admin",platformStatus:"ACTIVE",
    systemRoles:["SUPER_ADMIN"]},
  membership:null,
  adminScope:{collegeId,organizationId},
};
const limit=vi.fn();
const execute=vi.fn();
const transaction=vi.fn();
const select=vi.fn();
const db={select,transaction};
beforeEach(()=>{
  vi.resetAllMocks();
  select.mockImplementation(()=>({
    from:()=>({innerJoin:()=>({innerJoin:()=>({
      where:()=>({limit}),
    })})}),
  }));
  vi.mocked(getDb).mockReturnValue(db as never);
  vi.mocked(getSuperAdminTenantLifecycleDetail).mockResolvedValue({
    id:collegeId,organizationId,
  } as never);
  limit.mockResolvedValue([{id:membershipId,name:"College Admin"}]);
  transaction.mockImplementation(async (fn:(tx:{execute:typeof execute})=>Promise<unknown>) =>
    fn({execute}));
  vi.mocked(assertPersistedPlatformPermission).mockResolvedValue(undefined as never);
  vi.mocked(recordActivityEventInTransaction).mockResolvedValue(undefined as never);
});

describe("AUTH-sessions-09 transactional admin revoke adversarial contracts",()=>{
  it("AUTH-sessions-09 rejects learner, disabled account, or mismatched acting-college scope",async()=>{
    for(const invalid of [
      {...actor,user:{...actor.user,systemRoles:[]}},
      {...actor,user:{...actor.user,platformStatus:"DISABLED" as const}},
      {...actor,adminScope:{collegeId:"another-college",organizationId}},
    ]){
      await expect(revokeCollegeAdminSessions(invalid,collegeId,userId)).rejects.toThrow();
      expect(execute).not.toHaveBeenCalled();
      expect(recordActivityEventInTransaction).not.toHaveBeenCalled();
    }
  });

  it("AUTH-sessions-09 refuses arbitrary target outside the selected college's administrator roster",async()=>{
    limit.mockResolvedValueOnce([]);
    await expect(revokeCollegeAdminSessions(actor,collegeId,userId)).rejects.toThrow();
    expect(transaction).not.toHaveBeenCalled();
    expect(execute).not.toHaveBeenCalled();
  });

  it("AUTH-sessions-09 denies after persisted role revocation before any UPDATE",async()=>{
    vi.mocked(assertPersistedPlatformPermission).mockRejectedValueOnce(new Error("actor revoked"));
    await expect(revokeCollegeAdminSessions(actor,collegeId,userId)).rejects.toThrow("actor revoked");
    expect(transaction).toHaveBeenCalledOnce();
    expect(execute).not.toHaveBeenCalled();
    expect(recordActivityEventInTransaction).not.toHaveBeenCalled();
  });

  it("AUTH-sessions-09 zero-row retry is idempotent and does not append a second audit",async()=>{
    execute.mockResolvedValueOnce({rows:[]});
    const result=await revokeCollegeAdminSessions(actor,collegeId,userId);
    expect(result).toEqual({revoked:0});
    expect(execute).toHaveBeenCalledOnce();
    expect(recordActivityEventInTransaction).not.toHaveBeenCalled();
  });

  it("AUTH-sessions-09 revokes all live sessions and audits exactly the affected count",async()=>{
    execute.mockResolvedValueOnce({rows:[{id:"device-1"},{id:"device-2"}]});
    const result=await revokeCollegeAdminSessions(actor,collegeId,userId);
    expect(result).toEqual({revoked:2});
    expect(assertPersistedPlatformPermission).toHaveBeenCalledWith(
      expect.objectContaining({execute}),
      actor,"college.manage",{organizationId,collegeId},
    );
    expect(recordActivityEventInTransaction).toHaveBeenCalledOnce();
    expect(recordActivityEventInTransaction).toHaveBeenCalledWith(
      expect.objectContaining({execute}),actor,
      expect.objectContaining({collegeId,organizationId,subjectId:userId,
        metadata:{revoked:2}}),
    );
  });

  it("AUTH-sessions-09 propagates an audit or DB error rather than falsely reporting success",async()=>{
    execute.mockResolvedValueOnce({rows:[{id:"device-1"}]});
    vi.mocked(recordActivityEventInTransaction).mockRejectedValueOnce(new Error("audit unavailable"));
    await expect(revokeCollegeAdminSessions(actor,collegeId,userId)).rejects.toThrow("audit unavailable");
    expect(transaction).toHaveBeenCalledOnce();
    expect(recordActivityEventInTransaction).toHaveBeenCalledOnce();
  });
});
