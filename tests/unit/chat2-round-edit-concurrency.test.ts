import {beforeEach,describe,expect,it,vi} from "vitest";
import {readFileSync} from "node:fs";
import type {RequestContext} from "@/modules/identity/context";
const state=vi.hoisted(()=>({
 getDb:vi.fn(),scope:vi.fn(),
 loaded:[] as unknown[],updated:[] as unknown[],
 events:[] as unknown[],writes:[] as unknown[],
}));
vi.mock("@/db/client",()=>({getDb:state.getDb}));
vi.mock("@/modules/placements/scope",()=>({requirePlacementManageScope:state.scope}));
import {updatePlacementRound} from "@/modules/placements/round-service";

const roundId="00000000-0000-4000-8000-000000000001";
const version=new Date("2099-07-01T00:00:00.123Z");
const round={id:roundId,name:"Round 1",status:"PENDING",updatedAt:version};
const job={id:"job-1",collegeId:"college-a",status:"PUBLISHED"};
const actor:RequestContext={
 user:{id:"staff",identityUid:"staff-uid",platformStatus:"ACTIVE",systemRoles:[]},
 membership:{id:"membership",collegeId:"college-a",organizationId:"org-a",status:"ACTIVE",roles:["TPO"]},
};
beforeEach(()=>{
 vi.clearAllMocks();
 state.loaded=[{round,job}];
 state.updated=[];state.events.length=0;state.writes.length=0;
 state.scope.mockResolvedValue({id:"college-a",organizationId:"org-a"});
 const tx={
  update:()=>({
   set:(value:unknown)=>{state.writes.push(value);return {
    where:()=>({returning:async()=>state.updated}),
   };},
  }),
  insert:()=>({values:async(value:unknown)=>{state.events.push(value)}}),
 };
 state.getDb.mockReturnValue({
  select:()=>({from:()=>({innerJoin:()=>({
   where:()=>({limit:async()=>state.loaded}),
  })})}),
  transaction:(fn:(txArg:typeof tx)=>Promise<unknown>)=>fn(tx),
 });
});
describe("TPO-drive-workspace-37 optimistic round draft edits",()=>{
 it("TPO-drive-workspace-37 refuses an overlapping editor's stale compare-and-swap without emitting an event",async()=>{
  await expect(updatePlacementRound(actor,roundId,{name:"Updated name"}))
   .rejects.toMatchObject({code:"PLACEMENT_ROUND_NOT_EDITABLE"});
  expect(state.writes).toHaveLength(1);
  expect(state.events).toHaveLength(0);
 });
 it("TPO-drive-workspace-37 persists an accepted edit and writes exactly one round event",async()=>{
  const saved={...round,name:"Updated name",updatedAt:new Date("2099-07-01T00:00:00.124Z")};
  state.updated=[saved];
  const result=await updatePlacementRound(actor,roundId,{name:"Updated name"});
  expect(result).toMatchObject({id:roundId,name:"Updated name"});
  expect(state.events).toHaveLength(1);
  expect(state.events[0]).toMatchObject({
   roundId,eventType:"UPDATED",actorUserId:actor.user.id,
  });
 });
 it("TPO-drive-workspace-37 uses the millisecond persisted version in the SQL CAS and monotonic update token",()=>{
  const source=readFileSync("src/modules/placements/round-service.ts","utf8");
  const section=source.slice(source.indexOf("export async function updatePlacementRound("),
   source.indexOf("export async function actOnPlacementRound("));
  expect(section).toContain("current.round.updatedAt.toISOString()");
  expect(section).toContain("date_trunc('milliseconds'");
  expect(section).toContain("greatest(clock_timestamp()");
  expect(section).toContain("expectedUpdatedAt");
  expect(section.indexOf("date_trunc('milliseconds'"))
   .toBeLessThan(section.lastIndexOf(".returning()"));
 });
});
