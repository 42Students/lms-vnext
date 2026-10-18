import {beforeEach,describe,expect,it,vi} from "vitest";
import {readFileSync} from "node:fs";
import type {RequestContext} from "@/modules/identity/context";
import {AuthorizationError} from "@/modules/permissions/policy";

const mock=vi.hoisted(()=>({
 actor:vi.fn(),writerActor:vi.fn(),scope:vi.fn(),db:vi.fn(),
}));
vi.mock("@/db/client",()=>({getDb:mock.db}));
vi.mock("@/modules/placements/tpo-batch-workspace-read-service",()=>({
 requireTpoBatchActor:mock.actor,
}));
vi.mock("@/modules/placements/tpo-job-write-base",()=>({
 requireTpoJobActor:mock.writerActor,
}));
vi.mock("@/modules/placements/scope",()=>({requirePlacementManageScope:mock.scope}));
import {createPlacementDebarment,liftPlacementDebarment,
 countDebarredPlacementDrive} from "@/modules/placements/debarment-service";

const COLLEGE="aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const LEARNER="bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
const DEBARMENT="cccccccc-cccc-4ccc-8ccc-cccccccccccc";
const JOB="dddddddd-dddd-4ddd-8ddd-dddddddddddd";
const ctx:RequestContext={
 user:{id:"eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee",identityUid:"debar-tpo",
  platformStatus:"ACTIVE",systemRoles:[]},
 membership:{id:"ffffffff-ffff-4fff-8fff-ffffffffffff",collegeId:COLLEGE,
  organizationId:"11111111-1111-4111-8111-111111111111",status:"ACTIVE",roles:["TPO"]},
};

describe("TPO-students-06/07 debarment role revocation and tenant isolation",()=>{
 beforeEach(()=>{
  vi.resetAllMocks();
  mock.actor.mockResolvedValue(COLLEGE);
  mock.scope.mockResolvedValue({id:COLLEGE,organizationId:ctx.membership!.organizationId});
 });
 it("fails closed for a revoked TPO before debarment, lifting or drive-event lookup",async()=>{
  mock.actor.mockRejectedValue(new AuthorizationError("placements.manage"));
  await expect(createPlacementDebarment(ctx,{
   collegeId:COLLEGE,membershipId:LEARNER,reason:"Repeated unexplained absence",
   untilDrives:2,
  })).rejects.toBeInstanceOf(AuthorizationError);
  await expect(liftPlacementDebarment(ctx,{
   debarmentId:DEBARMENT,reason:"Restriction reviewed",
  })).rejects.toBeInstanceOf(AuthorizationError);
  await expect(countDebarredPlacementDrive(ctx,{
   debarmentId:DEBARMENT,jobId:JOB,
  })).rejects.toBeInstanceOf(AuthorizationError);
  expect(mock.db).not.toHaveBeenCalled();
  expect(mock.scope).not.toHaveBeenCalled();
 });
 it("does not disclose a debarment or write a record for a different college",async()=>{
  mock.actor.mockResolvedValue("22222222-2222-4222-8222-222222222222");
  await expect(createPlacementDebarment(ctx,{
   collegeId:COLLEGE,membershipId:LEARNER,reason:"Required attendance",
   untilDate:"2099-01-01",
  })).rejects.toBeInstanceOf(AuthorizationError);
  expect(mock.db).not.toHaveBeenCalled();
 });
 it("checks persisted role inside every write transaction after the initial actor check",()=>{
  const src=readFileSync(new URL("../../src/modules/placements/debarment-service.ts",import.meta.url),"utf8");
  expect(src.match(/await requireTpoJobActor\(tx,context\)/g)).toHaveLength(3);
  expect(src).toContain("eq(placementDebarments.collegeId,collegeId)");
  expect(src).toContain("await recordDebarmentNotice(tx,college,learner.userId,context.user.id,row.id,\"DEBARRED\")");
  expect(src).toContain("await recordDebarmentNotice(tx,college,learner.userId,context.user.id,updated.id,\"DEBARMENT_LIFTED\")");
 });
});
