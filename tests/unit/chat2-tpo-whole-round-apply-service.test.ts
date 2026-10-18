import {beforeEach,describe,expect,it,vi} from "vitest";
import type {RequestContext} from "@/modules/identity/context";
const state=vi.hoisted(()=>({
 college:vi.fn(),getDb:vi.fn(),apply:vi.fn(),rows:[] as unknown[][],
}));
vi.mock("server-only",()=>({}));
vi.mock("@/db/client",()=>({getDb:state.getDb}));
vi.mock("@/modules/placements/tpo-job-write-base",()=>({
 requireTpoJobCollege:state.college,
}));
vi.mock("@/modules/placements/result-service",()=>({
 applyPlacementRoundResult:state.apply,
}));
import {getTpoRoundApplyPreview,applyTpoWholeRound}
 from "@/modules/placements/tpo-round-apply-service";

const id=(n:number)=>"00000000-0000-4000-8000-"+String(n).padStart(12,"0");
const jobId=id(1),roundId=id(2),nextRound=id(3),first=id(4),second=id(5),appliedId=id(6);
const actor:RequestContext={
 user:{id:"tpo-user",identityUid:"tpo-identity",platformStatus:"ACTIVE",systemRoles:[]},
 membership:{id:"tpo-membership",collegeId:id(9),organizationId:"org-a",status:"ACTIVE",roles:["TPO"]},
};
const scope={roundId,roundName:"Technical interview",roundStatus:"COMPLETED",
 roundKind:"INTERVIEW",jobStatus:"PUBLISHED",jobTitle:"Engineering"};
const rows=[
 {resultId:first,applicationId:id(10),student:"Ada",outcome:"PASS",status:"STAGED",version:1},
 {resultId:second,applicationId:id(11),student:"Bob",outcome:"FAIL",status:"STAGED",version:2},
 {resultId:appliedId,applicationId:id(12),student:"Cara",outcome:"HOLD",status:"APPLIED",version:3},
];
const rounds=[{id:roundId,sequence:1,kind:"INTERVIEW"},{id:nextRound,sequence:2,kind:"GD"}];
function fixture(override:Partial<typeof scope>={}){
 state.rows=[[{...scope,...override}],rows,rounds];
}
function query(result:unknown[]){
 return {
  from(){return this;},innerJoin(){return this;},where(){return this;},
  limit:async()=>result,orderBy:async()=>result,
 };
}
beforeEach(()=>{
 vi.clearAllMocks();
 fixture();
 state.college.mockResolvedValue(id(9));
 state.getDb.mockReturnValue({select:()=>query(state.rows.shift()??[])});
 state.apply.mockResolvedValue({status:"APPLIED"});
});

describe("TPO-drive-workspace-42 whole-round preview/apply authorization and partial persistence",()=>{
 it("TPO-drive-workspace-42 rejects revoked TPO college permission before private result fetch",async()=>{
  state.college.mockRejectedValueOnce(new Error("COLLEGE_REVOKED"));
  await expect(getTpoRoundApplyPreview(actor,jobId,roundId)).rejects.toThrow("COLLEGE_REVOKED");
  expect(state.getDb).not.toHaveBeenCalled();
  expect(state.apply).not.toHaveBeenCalled();
 });
 it("TPO-drive-workspace-42 denies invalid IDs before database read and does not issue guessed scope",async()=>{
  await expect(getTpoRoundApplyPreview(actor,"../foreign",roundId)).rejects.toThrow();
  await expect(getTpoRoundApplyPreview(actor,jobId,"not-a-round")).rejects.toThrow();
  expect(state.getDb).not.toHaveBeenCalled();
 });
 it("TPO-drive-workspace-42 produces honest next-round destinations, status totals and immutable preview hash",async()=>{
  const firstPreview=await getTpoRoundApplyPreview(actor,jobId,roundId);
  expect(firstPreview.ready).toBe(true);
  expect(firstPreview).toMatchObject({
   staged:2,applied:1,outcomes:{PASS:1,FAIL:1,HOLD:0,ABSENT:0},
   destinations:{PASS:"Group discussion",FAIL:"Not cleared",HOLD:"Waitlisted",ABSENT:"Absent"},
  });
  expect(firstPreview.rows).toHaveLength(3);
  expect(firstPreview.rows[0]).toMatchObject({destination:"Group discussion",student:"Ada"});
  expect(firstPreview.skippedUnrecordedNote).toContain("not automatically failed");
  expect(firstPreview.previewToken).toMatch(/^[0-9a-f]{64}$/);
  fixture();const secondPreview=await getTpoRoundApplyPreview(actor,jobId,roundId);
  expect(secondPreview.previewToken).toBe(firstPreview.previewToken);
 });
 it("TPO-drive-workspace-42 never applies a forged confirmation, stale token or a non-completed round",async()=>{
  await expect(applyTpoWholeRound(actor,jobId,roundId,{
   confirmed:false,expectedPreviewToken:"a".repeat(64),
  })).rejects.toThrow();
  expect(state.getDb).not.toHaveBeenCalled();
  await expect(applyTpoWholeRound(actor,jobId,roundId,{
   confirmed:true,expectedPreviewToken:"b".repeat(64),
  })).rejects.toMatchObject({code:"PLACEMENT_JOB_PREVIEW_STALE"});
  expect(state.apply).not.toHaveBeenCalled();
  fixture({roundStatus:"SCHEDULED"});
  await expect(applyTpoWholeRound(actor,jobId,roundId,{
   confirmed:true,expectedPreviewToken:"c".repeat(64),
  })).rejects.toMatchObject({code:"PLACEMENT_RESULT_ROUND_NOT_READY"});
  expect(state.apply).not.toHaveBeenCalled();
 });
 it("TPO-drive-workspace-42 applies only staged outcomes and reports each rejected result without leaking private errors",async()=>{
  const preview=await getTpoRoundApplyPreview(actor,jobId,roundId);
  fixture();
  state.apply.mockImplementation(async (_context:RequestContext,resultId:string)=>{
   if(resultId===second)throw new Error("private postgres password invalid");
   return {status:"APPLIED"};
  });
  const result=await applyTpoWholeRound(actor,jobId,roundId,{
   confirmed:true,expectedPreviewToken:preview.previewToken,
  });
  expect(state.apply).toHaveBeenCalledTimes(2);
  expect(state.apply).toHaveBeenCalledWith(actor,first);
  expect(state.apply).toHaveBeenCalledWith(actor,second);
  expect(result).toMatchObject({total:3,previouslyApplied:1,applied:1,skipped:1,unchanged:1});
  expect(result.results.find(item=>item.resultId===second)).toMatchObject({
   status:"skipped",reason:"Result was not applied. Refresh this round and try again.",
  });
  expect(JSON.stringify(result)).not.toMatch(/password|private postgres/);
 });
});
