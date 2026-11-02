import {describe,expect,it} from "vitest";
import {
 legacyTaskStatus,legacyTaskDisplayStatus,legacyDeliveryEventLabel,legacyRevisionCountFromVersion,
 canonicalTaskType,legacyTaskPriority,legacyOrdinal,legacyMeetingStatus,legacyPhaseLabel,
 legacyRelativeDueLabel,compareLegacyOrder,sourceProjectIdentity,
} from "@/modules/projects/project-legacy-parity-model";

describe("PHASE1-LEGACYTASK legacy task status mapping",()=>{
 it("PHASE1-LEGACYTASK-01 maps every legacy alias to its canonical status, ignoring case, padding and spaces",()=>{
  const cases:[string,string][]=[
   ["TO_DO","TODO"],["TODO","TODO"],["to do","TODO"],["  To Do  ","TODO"],
   ["IN_PROGRESS","IN_PROGRESS"],["started","IN_PROGRESS"],["in progress","IN_PROGRESS"],
   ["BLOCKED","BLOCKED"],["blocked","BLOCKED"],
   ["IN_REVIEW","IN_REVIEW"],["review","IN_REVIEW"],["In Review","IN_REVIEW"],
   ["DONE","DONE"],["completed","DONE"],
  ];
  for(const [raw,status] of cases)expect(legacyTaskStatus(raw),raw).toBe(status);
 });
 it("PHASE1-LEGACYTASK-02 returns null for unknown, empty, prototype and non-string values",()=>{
  for(const bad of ["","  ","CANCELLED","ARCHIVED","__proto__","constructor","toString","hasOwnProperty","IN-PROGRESS","TO-DO",null,undefined,3,{},[],true])
   expect(legacyTaskStatus(bad),String(bad)).toBeNull();
 });
 it("PHASE1-LEGACYTASK-03 shows the exact legacy display label for each status and a safe fallback",()=>{
  expect(legacyTaskDisplayStatus("TODO")).toBe("To do");
  expect(legacyTaskDisplayStatus("started")).toBe("In progress");
  expect(legacyTaskDisplayStatus("BLOCKED")).toBe("Blocked");
  expect(legacyTaskDisplayStatus("review")).toBe("In review");
  expect(legacyTaskDisplayStatus("completed")).toBe("Done");
  for(const bad of ["","nope",null,undefined,42,"constructor"])
   expect(legacyTaskDisplayStatus(bad),String(bad)).toBe("Unknown status");
 });
 it("PHASE1-LEGACYTASK-04 normalises task types to the four known values and defaults to STORY",()=>{
  for(const t of ["STORY","BUG","CHORE","SPIKE"])expect(canonicalTaskType(t)).toBe(t);
  expect(canonicalTaskType(" bug ")).toBe("BUG");
  expect(canonicalTaskType("spike")).toBe("SPIKE");
  for(const bad of ["","  ","EPIC","TASK","constructor",null,undefined,5,{}])expect(canonicalTaskType(bad),String(bad)).toBe("STORY");
 });
 it("PHASE1-LEGACYTASK-05 normalises priorities to the four known values and defaults to MEDIUM",()=>{
  for(const p of ["LOW","MEDIUM","HIGH","CRITICAL"])expect(legacyTaskPriority(p)).toBe(p);
  expect(legacyTaskPriority(" high ")).toBe("HIGH");
  expect(legacyTaskPriority("critical")).toBe("CRITICAL");
  for(const bad of ["","URGENT","P0","constructor",null,undefined,1,{}])expect(legacyTaskPriority(bad),String(bad)).toBe("MEDIUM");
 });
});

describe("PHASE1-LEGACYEVENT delivery event labels",()=>{
 it("PHASE1-LEGACYEVENT-01 maps every known delivery event, tolerating case, spaces and punctuation",()=>{
  const cases:[string,string][]=[
   ["DRAFT_SAVED","Draft saved"],["draft created","Draft saved"],["DRAFT_UPDATED","Draft updated"],
   ["SUBMITTED","Submitted"],["re-submitted","re-submitted"],["RESUBMITTED","Resubmitted"],
   ["reviewed","Reviewed"],["Changes Requested","Changes requested"],["changes-requested","Changes requested"],
   ["APPROVED","Approved"],["locked","Locked"],["REOPENED","Reopened"],["attachments changed","Attachments changed"],
  ];
  for(const [raw,label] of cases)expect(legacyDeliveryEventLabel(raw),raw).toBe(label);
 });
 it("PHASE1-LEGACYEVENT-02 keeps an unknown event readable, trimmed and capped at 60 characters",()=>{
  expect(legacyDeliveryEventLabel("  Custom thing  ")).toBe("Custom thing");
  expect(legacyDeliveryEventLabel("x".repeat(100))).toBe("x".repeat(60));
 });
 it("PHASE1-LEGACYEVENT-03 never returns an empty label and does not leak prototype members",()=>{
  expect(legacyDeliveryEventLabel("")).toBe("Recorded change");
  expect(legacyDeliveryEventLabel("   ")).toBe("Recorded change");
  expect(legacyDeliveryEventLabel("constructor")).toBe("constructor");
  expect(legacyDeliveryEventLabel("__proto__")).toBe("__proto__");
  expect(typeof legacyDeliveryEventLabel("toString")).toBe("string");
 });
});

describe("PHASE1-LEGACYNUM legacy number and ordering rules",()=>{
 it("PHASE1-LEGACYNUM-01 revision count is version minus one for versions starting at one",()=>{
  expect(legacyRevisionCountFromVersion(1)).toBe(0);
  expect(legacyRevisionCountFromVersion(2)).toBe(1);
  expect(legacyRevisionCountFromVersion(100)).toBe(99);
  for(const bad of [0,-1,1.5,Number.NaN,Number.POSITIVE_INFINITY,Number.MAX_SAFE_INTEGER+2])
   expect(legacyRevisionCountFromVersion(bad),String(bad)).toBeNull();
 });
 it("PHASE1-LEGACYNUM-02 ordinals convert from a base and reject values below it or not integers",()=>{
  expect(legacyOrdinal(0)).toBe(0);
  expect(legacyOrdinal(7)).toBe(7);
  expect(legacyOrdinal(1,1)).toBe(0);
  expect(legacyOrdinal(5,1)).toBe(4);
  expect(legacyOrdinal(0,1)).toBeNull();
  for(const bad of [null,undefined,-1,1.5,Number.NaN,Number.MAX_SAFE_INTEGER+2])
   expect(legacyOrdinal(bad as number|null|undefined),String(bad)).toBeNull();
 });
 it("PHASE1-LEGACYNUM-03 sorts by mapped legacy order, then sequence, then id, deterministically",()=>{
  const row=(legacySortOrder:number|null,sequence:number,id:string)=>({legacySortOrder,sequence,id});
  const rows=[row(null,3,"c"),row(2,9,"b"),row(2,1,"a"),row(null,1,"z"),row(1,5,"y"),row(2,1,"0")];
  const sorted=[...rows].sort(compareLegacyOrder).map(r=>r.id);
  expect(sorted).toEqual(["z","y","0","a","b","c"]);
  expect([...rows].reverse().sort(compareLegacyOrder).map(r=>r.id)).toEqual(sorted);
  expect(compareLegacyOrder(row(1,1,"a"),row(1,1,"a"))).toBe(0);
 });
 it("PHASE1-LEGACYNUM-04 shows the legacy numeric project id when mapped, otherwise the UUID",()=>{
  const id="11111111-1111-4111-8111-111111111111";
  expect(sourceProjectIdentity(42,id)).toBe("42");
  expect(sourceProjectIdentity(null,id)).toBe(id);
  expect(sourceProjectIdentity(Number.NaN,id)).toBe(id);
  expect(sourceProjectIdentity(1.5,id)).toBe(id);
  expect(sourceProjectIdentity(Number.MAX_SAFE_INTEGER+2,id)).toBe(id);
 });
});

describe("PHASE1-LEGACYTEXT meeting and phase labels",()=>{
 it("PHASE1-LEGACYTEXT-01 meeting status wording matches the legacy copy",()=>{
  expect(legacyMeetingStatus("DRAFT",null)).toBe("Scheduling requested");
  expect(legacyMeetingStatus("REQUESTED","https://meet.example/x")).toBe("Scheduling requested");
  expect(legacyMeetingStatus("SCHEDULED","https://meet.example/x")).toBe("Meeting link available");
  expect(legacyMeetingStatus("SCHEDULED",null)).toBe("Meeting link not added");
  expect(legacyMeetingStatus("SCHEDULED","")).toBe("Meeting link not added");
  expect(legacyMeetingStatus("CANCELLED",null)).toBe("Meeting link not added");
 });
 it("PHASE1-LEGACYTEXT-02 phase labels are trimmed, capped at 80 characters, and empty becomes null",()=>{
  expect(legacyPhaseLabel("  Phase 1  ")).toBe("Phase 1");
  expect(legacyPhaseLabel("p".repeat(120))).toBe("p".repeat(80));
  for(const empty of [null,"","   "])expect(legacyPhaseLabel(empty),String(empty)).toBeNull();
 });
 it("PHASE1-LEGACYTEXT-03 due labels prefer the relative label, then the date, then the legacy empty copy",()=>{
  expect(legacyRelativeDueLabel("  Due in 3 days ","2026-01-01")).toBe("Due in 3 days");
  expect(legacyRelativeDueLabel(null,"2026-01-01")).toBe("2026-01-01");
  expect(legacyRelativeDueLabel("   ","2026-01-01")).toBe("2026-01-01");
  expect(legacyRelativeDueLabel(null,null)).toBe("No due date");
  expect(legacyRelativeDueLabel("",null)).toBe("No due date");
 });
});
