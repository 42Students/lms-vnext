import {beforeEach,describe,expect,it,vi} from "vitest";
import type {RequestContext} from "@/modules/identity/context";
import {AuthorizationError} from "@/modules/permissions/policy";

const mocks=vi.hoisted(()=>({getDb:vi.fn(),scope:vi.fn(),liveActor:vi.fn()}));
vi.mock("@/db/client",()=>({getDb:mocks.getDb}));
vi.mock("@/modules/placements/scope",()=>({requirePlacementManageScope:mocks.scope}));
vi.mock("@/modules/placements/tpo-batch-workspace-read-service",()=>({requireTpoBatchActor:mocks.liveActor}));

import {getTpoStudentsIntelligence} from "@/modules/placements/tpo-students-service";
import {getTpoStudentPlacementHistory} from "@/modules/placements/tpo-student-history-service";

const COLLEGE="11111111-1111-4111-8111-111111111111";
const OTHER="22222222-2222-4222-8222-222222222222";
const ORG="33333333-3333-4333-8333-333333333333";
const LEARNER="44444444-4444-4444-8444-444444444444";
const context:RequestContext={
 user:{id:"55555555-5555-4555-8555-555555555555",identityUid:"tpo-live",
  platformStatus:"ACTIVE",systemRoles:[]},
 membership:{id:"66666666-6666-4666-8666-666666666666",
  organizationId:ORG,collegeId:COLLEGE,status:"ACTIVE",roles:["TPO"]},
};

describe("TPO-BREAK-live-role-private-read-01 confidential TPO student views",()=>{
 beforeEach(()=>{
  vi.resetAllMocks();
  mocks.scope.mockResolvedValue({id:COLLEGE,organizationId:ORG,status:"ACTIVE"});
  mocks.liveActor.mockResolvedValue(COLLEGE);
 });
 it("TPO-BREAK-student-read-actor-01 denies stale sessions after the persisted role is revoked",async()=>{
  mocks.liveActor.mockRejectedValue(new AuthorizationError("placements.manage"));
  await expect(getTpoStudentsIntelligence(context,{collegeId:COLLEGE})).rejects.toBeInstanceOf(AuthorizationError);
  await expect(getTpoStudentPlacementHistory(context,{membershipId:LEARNER})).rejects.toBeInstanceOf(AuthorizationError);
  expect(mocks.getDb).not.toHaveBeenCalled();
  expect(mocks.liveActor).toHaveBeenCalledTimes(2);
 });
 it("TPO-BREAK-student-history-actor-02 refuses persisted actor scope drift before any private query",async()=>{
  mocks.liveActor.mockResolvedValue(OTHER);
  await expect(getTpoStudentsIntelligence(context,{collegeId:COLLEGE})).rejects.toBeInstanceOf(AuthorizationError);
  await expect(getTpoStudentPlacementHistory(context,{membershipId:LEARNER})).rejects.toBeInstanceOf(AuthorizationError);
  expect(mocks.getDb).not.toHaveBeenCalled();
 });
 it("rejects foreign roster college and invalid history IDs before any student data query",async()=>{
  await expect(getTpoStudentsIntelligence(context,{collegeId:OTHER})).rejects.toBeInstanceOf(AuthorizationError);
  await expect(getTpoStudentPlacementHistory(context,{membershipId:"../another-college"})).rejects.toBeDefined();
  expect(mocks.getDb).not.toHaveBeenCalled();
 });
});
