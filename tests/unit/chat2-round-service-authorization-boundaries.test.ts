import {beforeEach,describe,expect,it,vi} from "vitest";
import type {RequestContext} from "@/modules/identity/context";
const state=vi.hoisted(()=>({getDb:vi.fn(),scope:vi.fn(),tx:vi.fn()}));
vi.mock("@/db/client",()=>({getDb:state.getDb}));
vi.mock("@/modules/placements/scope",()=>({requirePlacementManageScope:state.scope}));
import {
 listPlacementRounds,getPlacementRound,createPlacementRound,updatePlacementRound,
 actOnPlacementRound,getTpoRoundReorderReadiness,reorderPlacementRounds,
} from "@/modules/placements/round-service";

const jobId="00000000-0000-4000-8000-000000000001";
const roundId="00000000-0000-4000-8000-000000000002";
const ctx:RequestContext={
 user:{id:"tpo",identityUid:"tpo-uid",platformStatus:"ACTIVE",systemRoles:[]},
 membership:{id:"member",collegeId:"college-a",organizationId:"org-a",status:"ACTIVE",roles:["TPO"]},
};
const job={id:jobId,collegeId:"college-a",status:"PUBLISHED",title:"Developer"};
beforeEach(()=>{
 vi.clearAllMocks();
 state.getDb.mockReturnValue({
  select:()=>({from:()=>({where:()=>({limit:async()=>[job]})})}),
  transaction:state.tx,
 });
 state.scope.mockResolvedValue({id:"college-a",organizationId:"org-a"});
});

describe("TPO-drive-workspace-37 round service input and tenant authorization",()=>{
 it("TPO-drive-workspace-37 rejects invalid job/round route IDs before DB I/O",async()=>{
  await expect(listPlacementRounds(ctx,"../foreign")).rejects.toThrow();
  await expect(getPlacementRound(ctx,"not-a-uuid")).rejects.toThrow();
  await expect(createPlacementRound(ctx,"../foreign",{kind:"INTERVIEW",name:"Round"})).rejects.toThrow();
  await expect(updatePlacementRound(ctx,"../foreign",{name:"Changed"})).rejects.toThrow();
  await expect(actOnPlacementRound(ctx,"../foreign",{action:"COMPLETE"})).rejects.toThrow();
  await expect(getTpoRoundReorderReadiness(ctx,"../foreign")).rejects.toThrow();
  await expect(reorderPlacementRounds(ctx,"../foreign",{roundIds:[roundId]})).rejects.toThrow();
  expect(state.getDb).not.toHaveBeenCalled();
  expect(state.scope).not.toHaveBeenCalled();
  expect(state.tx).not.toHaveBeenCalled();
 });
 it("TPO-drive-workspace-37 blocks malformed creation, update, transitions and reordered foreign identities",async()=>{
  for(const body of [
   {},
   {name:"Round",collegeId:"forged"},
   {name:"Round",kind:"INVALID"},
  ])await expect(createPlacementRound(ctx,jobId,body as never)).rejects.toThrow();
  for(const body of [{},{name:"Updated",collegeId:"forged"}])
   await expect(updatePlacementRound(ctx,roundId,body)).rejects.toThrow();
  for(const body of [{action:"COMPLETE",collegeId:"forged"},{action:"APPROVE"},
   {action:"SCHEDULE"},{action:"CANCEL",reason:"x"}]){
   if(body.action==="CANCEL")continue; // reason length is not mandatory for cancel at this stage
   await expect(actOnPlacementRound(ctx,roundId,body as never)).rejects.toThrow();
  }
  for(const body of [{roundIds:[]},{roundIds:[roundId,roundId]},
   {roundIds:[roundId,"../foreign"]},{roundIds:[roundId],collegeId:"forged"}])
   await expect(reorderPlacementRounds(ctx,jobId,body)).rejects.toThrow();
  expect(state.getDb).not.toHaveBeenCalled();
  expect(state.tx).not.toHaveBeenCalled();
 });
 it("TPO-drive-workspace-37 refuses foreign college scope before creating rounds or opening a transaction",async()=>{
  state.scope.mockRejectedValue(new Error("COLLEGE_SCOPE_DENIED"));
  await expect(listPlacementRounds(ctx,jobId)).rejects.toThrow("COLLEGE_SCOPE_DENIED");
  await expect(createPlacementRound(ctx,jobId,{kind:"INTERVIEW",name:"Technical"}))
   .rejects.toThrow("COLLEGE_SCOPE_DENIED");
  await expect(getTpoRoundReorderReadiness(ctx,jobId)).rejects.toThrow("COLLEGE_SCOPE_DENIED");
  await expect(reorderPlacementRounds(ctx,jobId,{roundIds:[roundId]}))
   .rejects.toThrow("COLLEGE_SCOPE_DENIED");
  expect(state.tx).not.toHaveBeenCalled();
 });
});
