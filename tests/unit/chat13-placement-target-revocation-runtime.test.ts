import { beforeEach, describe, expect, it, vi } from "vitest";
import type { RequestContext } from "@/modules/identity/context";

const mocks=vi.hoisted(()=>({
  getDb:vi.fn(),
  requirePlacementManageScope:vi.fn(),
  assertPersistedPlatformPermission:vi.fn(),
}));
vi.mock("@/db/client",()=>({getDb:mocks.getDb}));
vi.mock("@/modules/placements/scope",()=>({
  requirePlacementManageScope:mocks.requirePlacementManageScope,
}));
vi.mock("@/modules/permissions/persisted-actor",()=>({
  assertPersistedPlatformPermission:mocks.assertPersistedPlatformPermission,
}));

import {replacePlacementJobCohortTargets} from "@/modules/placements/cohort-target-service";

const ctx:RequestContext={
  user:{id:"11111111-1111-4111-8111-111111111111",identityUid:"auth-admin",platformStatus:"ACTIVE",systemRoles:["SUPER_ADMIN"]},
  adminScope:{organizationId:"22222222-2222-4222-8222-222222222222",collegeId:"33333333-3333-4333-8333-333333333333"},
  membership:null,
};
const command={
 collegeId:"33333333-3333-4333-8333-333333333333",
 jobId:"44444444-4444-4444-8444-444444444444",
 cohortIds:["55555555-5555-4555-8555-555555555555"],
};

describe("SA-TARGET-REVOKE-07 rechecks persisted actor inside draft audience transaction",()=>{
 beforeEach(()=>{
  for(const fn of Object.values(mocks))fn.mockReset();
  mocks.requirePlacementManageScope.mockResolvedValue({
   id:command.collegeId,organizationId:ctx.adminScope!.organizationId,status:"ACTIVE",
  });
 });

 it("rejects a Super Admin whose system role was revoked after request authentication without touching targets",async()=>{
  const deleting=vi.fn(),inserting=vi.fn(),selecting=vi.fn();
  const tx={delete:deleting,insert:inserting,select:selecting};
  const transaction=vi.fn(async(handler:(tx:typeof tx)=>Promise<unknown>)=>handler(tx));
  mocks.getDb.mockReturnValue({transaction});
  mocks.assertPersistedPlatformPermission.mockRejectedValue(new Error("FORBIDDEN"));

  await expect(replacePlacementJobCohortTargets(ctx,command)).rejects.toThrow("FORBIDDEN");
  expect(mocks.requirePlacementManageScope).toHaveBeenCalledWith(ctx,command.collegeId);
  expect(mocks.assertPersistedPlatformPermission).toHaveBeenCalledWith(
   tx,ctx,"placements.manage",{
    collegeId:command.collegeId,organizationId:ctx.adminScope!.organizationId,
   },
  );
  expect(deleting).not.toHaveBeenCalled();
  expect(inserting).not.toHaveBeenCalled();
  expect(selecting).not.toHaveBeenCalled();
  expect(transaction).toHaveBeenCalledTimes(1);
 });

 it("rejects malformed and duplicate cohort IDs before reading scope or opening a transaction",async()=>{
  await expect(replacePlacementJobCohortTargets(ctx,{
   ...command,cohortIds:[command.cohortIds[0],command.cohortIds[0]],
  })).rejects.toThrow();
  await expect(replacePlacementJobCohortTargets(ctx,{
   ...command,cohortIds:["../../foreign-college"],
  })).rejects.toThrow();
  expect(mocks.requirePlacementManageScope).not.toHaveBeenCalled();
  expect(mocks.getDb).not.toHaveBeenCalled();
  expect(mocks.assertPersistedPlatformPermission).not.toHaveBeenCalled();
 });
});
