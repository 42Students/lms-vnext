import {describe,expect,it} from "vitest";
import {roundApplyInputSchema,roundApplyPreviewToken,roundApplyFailureReason,summarizeRoundApply} from "@/modules/placements/tpo-round-apply-model";
import {roundReorderLockMessage,moveRound} from "@/modules/placements/tpo-round-reorder-model";
import {tpoInterviewSlotActionSchema,sameInterviewRoom,overlapsInterviewRoom,planInterviewDay} from "@/modules/placements/tpo-interview-slot-model";
import {tpoLiveRoundTiming} from "@/modules/placements/tpo-live-round-timing-model";
import {projectTpoInterviewReadiness} from "@/modules/placements/tpo-interview-readiness-model";
import {tpoRoundResultEntryFormSchema} from "@/modules/placements/tpo-round-result-entry-model";

const id=(n:number)=>"00000000-0000-4000-8000-"+String(n).padStart(12,"0");
const date=(iso:string)=>new Date(iso);
const resultRows=[
 {resultId:id(1),applicationId:id(2),student:"Ada",outcome:"PASS",status:"STAGED",version:1},
 {resultId:id(3),applicationId:id(4),student:"B",outcome:"HOLD",status:"STAGED",version:2},
 {resultId:id(5),applicationId:id(6),student:"C",outcome:"FAIL",status:"APPLIED",version:3},
];

describe("chat-2 interview, round and slot behavioural hardening",()=>{
 it("TPO-drive-workspace-42 accepts only confirmed SHA-256 round previews",()=>{
  expect(roundApplyInputSchema.safeParse({confirmed:true,expectedPreviewToken:"a".repeat(64)}).success).toBe(true);
  for(const bad of ["z".repeat(64),"A".repeat(64)," ".repeat(64),"a".repeat(63)]){
   expect(roundApplyInputSchema.safeParse({confirmed:true,expectedPreviewToken:bad}).success).toBe(false);
  }
  expect(roundApplyInputSchema.safeParse({confirmed:false,expectedPreviewToken:"a".repeat(64)}).success).toBe(false);
  expect(roundApplyInputSchema.safeParse({confirmed:true,expectedPreviewToken:"a".repeat(64),collegeId:id(1)}).success).toBe(false);
 });
 it("TPO-drive-workspace-42 binds apply approval to row versions, states, identities and round",()=>{
  const first=roundApplyPreviewToken(id(9),resultRows);
  expect(first).toMatch(/^[0-9a-f]{64}$/);
  expect(first).toBe(roundApplyPreviewToken(id(9),[...resultRows].reverse()));
  expect(first).not.toBe(roundApplyPreviewToken(id(8),resultRows));
  expect(first).not.toBe(roundApplyPreviewToken(id(9),resultRows.map((r,i)=>i===0?{...r,version:2}:r)));
  expect(first).not.toBe(roundApplyPreviewToken(id(9),resultRows.map((r,i)=>i===0?{...r,status:"APPLIED"}:r)));
  expect(first).not.toBe(roundApplyPreviewToken(id(9),resultRows.map((r,i)=>i===0?{...r,applicationId:id(7)}:r)));
 });
 it("TPO-drive-workspace-42 counts persisted round states only and hides internal failure reasons",()=>{
  expect(summarizeRoundApply(resultRows)).toEqual({staged:2,applied:1,outcomes:{PASS:1,FAIL:0,HOLD:1,ABSENT:0}});
  expect(roundApplyFailureReason(new Error("password=secret; relation placement_results"))).toBe("Result was not applied. Refresh this round and try again.");
 });
 it("TPO-drive-workspace-37 locks unknown, ended and in-progress rounds instead of guessing",()=>{
  const base={jobStatus:"DRAFT",roundStatuses:["PENDING","PENDING"],hasExecutionArtifacts:false};
  expect(roundReorderLockMessage(base)).toBeNull();
  expect(roundReorderLockMessage({...base,jobStatus:"PUBLISHED"})).toBeNull();
  for(const status of ["CLOSED","CANCELLED","ARCHIVED","UNRECOGNIZED",""]){
   expect(roundReorderLockMessage({...base,jobStatus:status})).toBe("The order is locked because this drive has ended.");
  }
  expect(roundReorderLockMessage({...base,hasExecutionArtifacts:true})).toContain("results or students");
  expect(roundReorderLockMessage({...base,roundStatuses:["PENDING","COMPLETED"]})).toContain("results or students");
  expect(roundReorderLockMessage({...base,roundStatuses:["PENDING"]})).toContain("at least two rounds");
 });
 it("TPO-drive-workspace-37 rejects duplicate IDs and stale/invalid reorder indices without mutation",()=>{
  const ids=["a","b","c"];
  expect(moveRound(ids,"b",0)).toEqual(["b","a","c"]);
  expect(ids).toEqual(["a","b","c"]);
  for(const index of [-1,3,1.5,Number.NaN]){
   expect(moveRound(ids,"a",index)).toEqual(ids);
  }
  expect(moveRound(ids,"foreign",1)).toEqual(ids);
  expect(moveRound(["a","a"],"a",1)).toEqual(["a","a"]);
 });
 it("TPO-drive-workspace-44 accepts only explicit confirmed bounded slot actions",()=>{
  const valid={action:"BOOK",confirmed:true,slotId:id(1),applicationId:id(2),expectedVersion:1};
  expect(tpoInterviewSlotActionSchema.safeParse(valid).success).toBe(true);
  for(const bad of [
   {...valid,confirmed:false},{...valid,expectedVersion:0},{...valid,expectedVersion:1.5},
   {...valid,slotId:"../../other"},{...valid,collegeId:id(3)}
  ])expect(tpoInterviewSlotActionSchema.safeParse(bad).success).toBe(false);
 });
 it("TPO-drive-workspace-44 compares rooms canonically and excludes touching intervals",()=>{
  expect(sameInterviewRoom(" ＨＡＬＬ A ","hall a")).toBe(true);
  const occupied=[{room:"Hall A",startsAt:date("2099-01-01T10:00:00Z"),endsAt:date("2099-01-01T10:30:00Z")}];
  expect(overlapsInterviewRoom({room:"hall a",startsAt:date("2099-01-01T10:30:00Z"),endsAt:date("2099-01-01T11:00:00Z")},occupied)).toBe(false);
  expect(overlapsInterviewRoom({room:"hall a",startsAt:date("2099-01-01T10:29:00Z"),endsAt:date("2099-01-01T11:00:00Z")},occupied)).toBe(true);
  expect(overlapsInterviewRoom({room:"Hall B",startsAt:date("2099-01-01T10:29:00Z"),endsAt:date("2099-01-01T11:00:00Z")},occupied)).toBe(false);
  expect(overlapsInterviewRoom({room:"Hall A",startsAt:date("invalid"),endsAt:date("2099-01-01T11:00:00Z")},occupied)).toBe(true);
 });
 it("TPO-drive-workspace-44 plans ordered slots for every room and forbids duplicate physical rooms",()=>{
  const input={startsAt:"2099-01-01T03:30:00Z",durationMinutes:30,gapMinutes:5,slotsPerRoom:2,rooms:["Hall A","Hall B"]};
  const slots=planInterviewDay(input);
  expect(slots).toHaveLength(4);
  expect(slots.map(x=>x.room)).toEqual(["Hall A","Hall A","Hall B","Hall B"]);
  expect(slots[1].startsAt.toISOString()).toBe("2099-01-01T04:05:00.000Z");
  expect(()=>planInterviewDay({...input,rooms:["Hall A"," hall a "]})).toThrow("Room names must be different");
  expect(()=>planInterviewDay({...input,slotsPerRoom:101})).toThrow("Invalid interview day configuration");
  expect(()=>planInterviewDay({...input,startsAt:"2099-01-01T18:00:00Z",durationMinutes:40,slotsPerRoom:1})).toThrow("before midnight");
 });
 it("TPO-drive-workspace-44 uses server time for live round timing and bounds corrupted durations",()=>{
  const info={scheduledAt:"2099-01-01T10:00:00Z",durationMinutes:60};
  expect(tpoLiveRoundTiming(info,"2099-01-01T10:25:00Z")).toEqual({elapsedMinutes:25,remainingMinutes:35});
  expect(tpoLiveRoundTiming(info,"2099-01-01T09:59:59Z")).toEqual({elapsedMinutes:null,remainingMinutes:null});
  expect(tpoLiveRoundTiming({...info,durationMinutes:1441},"2099-01-01T10:25:00Z")).toEqual({elapsedMinutes:null,remainingMinutes:null});
 });
 it("TPO-drive-workspace-44 readiness refuses impossible durations while preserving pending and scheduled states",()=>{
  const base={id:id(1),jobId:id(9),jobTitle:"Engineer",companyName:"Acme",name:"Interview",kind:"INTERVIEW",status:"SCHEDULED",mode:null,venue:null,scheduledAt:"2099-01-01T10:10:00Z",durationMinutes:30};
  const out=projectTpoInterviewReadiness([
   base,{...base,id:id(2),durationMinutes:1441},
   {...base,id:id(3),status:"PENDING",scheduledAt:null},
   {...base,id:id(4),status:"CANCELLED"},
   {...base,id:id(5),kind:"TALK"},
  ],"2099-01-01T10:00:00Z",14);
  expect(out.counts).toEqual({upcoming:1,happeningNow:0,pendingSchedule:1,durationUnknown:1,startedEarlier:0});
  expect(out.rows.map(x=>x.id)).toEqual([id(3),id(1),id(2)]);
 });
 it("TPO-drive-workspace-40 validates hold ranks and converts a note to candidate-facing text",()=>{
  const input={applicationId:id(1),expectedCurrentResultId:null,outcome:"HOLD",note:"Please wait for the next round.",waitlistRank:"2"};
  const result=tpoRoundResultEntryFormSchema.safeParse(input);
  expect(result.success).toBe(true);
  if(result.success)expect(result.data.result).toEqual({applicationId:id(1),outcome:"HOLD",waitlistRank:2,candidateMessage:"Please wait for the next round."});
  for(const rank of ["0","1e3","0x10","2.5","-1"]){
   expect(tpoRoundResultEntryFormSchema.safeParse({...input,waitlistRank:rank}).success).toBe(false);
  }
  expect(tpoRoundResultEntryFormSchema.safeParse({...input,companyId:id(2)}).success).toBe(false);
 });
});
