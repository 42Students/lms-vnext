import {describe,expect,it} from "vitest";
import {
 HR_DRIVE_ROUND_PRESETS,applyHrRoundPreset,
} from "@/modules/placements/hr-drive-round-presets";
import type {HrDriveDraft} from "@/modules/placements/hr-drive-draft-model";
import {
 HR_ROUND_OUTCOMES,hrInlineRoundResultFilters,hrInlineRoundResultsHref,
} from "@/modules/placements/hr-inline-round-results-model";
import {
 hrScheduledRoundRows,hrRoundConflictLabels,hrRoundConflictLinks,
 type RoundScheduleRow,
} from "@/modules/placements/hr-round-schedule-model";

const base=(id:string,start:string,durationMinutes:number|null=30):RoundScheduleRow=>({
 id,name:"Round "+id,sequence:Number(id),status:"SCHEDULED",
 scheduledAt:new Date(start),durationMinutes,mode:"ON_CAMPUS",venue:"Main Hall",
});
const fixtures=[
 base("1","2099-07-01T10:00:00Z"),
 base("2","2099-07-01T10:15:00Z"),
 base("3","2099-07-01T10:30:00Z"),
];

describe("HR-rounds-01 employer presets, scoped result tabs, and scheduling conflict evidence",()=>{
 it("HR-rounds-01 round templates are immutable and do not mutate existing employer drafts",()=>{
  const draft={rounds:[{kind:"INTERVIEW",name:"Custom"}],title:"Old"} as unknown as HrDriveDraft;
  const original=JSON.stringify(draft);
  expect(HR_DRIVE_ROUND_PRESETS.map(item=>item.id))
   .toEqual(["INTERVIEW_ONLY","TEST_INTERVIEW","FULL_PROCESS"]);
  for(const preset of HR_DRIVE_ROUND_PRESETS){
   const changed=applyHrRoundPreset(draft,preset.id);
   expect(changed).not.toBe(draft);
   expect(changed.rounds.map(item=>item.name)).toEqual(preset.rounds.map(row=>row.name));
   expect(changed.rounds[0]).not.toBe(draft.rounds[0]);
  }
  expect(JSON.stringify(draft)).toBe(original);
  expect(applyHrRoundPreset(draft,"NOT_A_PRESET" as never)).toBe(draft);
 });
 it("HR-rounds-01 presents exact source outcomes with truthful counts and no invented statuses",()=>{
  expect(HR_ROUND_OUTCOMES).toEqual(["ALL","RECORDED","UNRECORDED","PASS","FAIL","HOLD","ABSENT"]);
  const input={all:8,recorded:5,unrecorded:3,pass:2,fail:1,hold:1,absent:1};
  const tabs=hrInlineRoundResultFilters(input);
  expect(tabs).toHaveLength(7);
  expect(tabs.find(item=>item.value==="ALL")).toEqual({value:"ALL",label:"All",count:8});
  expect(tabs.find(item=>item.value==="UNRECORDED")).toEqual({value:"UNRECORDED",label:"Not recorded",count:3});
  expect(tabs.find(item=>item.value==="HOLD")).toEqual({value:"HOLD",label:"Hold",count:1});
  expect(hrInlineRoundResultFilters().every(item=>item.count===0)).toBe(true);
 });
 it("HR-rounds-01 safely encodes job and round selectors without URL or query injection",()=>{
  const href=hrInlineRoundResultsHref("job / & ?","round#1","HOLD");
  const url=new URL(href,"https://hr.example.org");
  expect(url.pathname).toBe("/hr/placements/jobs/job%20%2F%20%26%20%3F");
  expect(url.searchParams.get("tab")).toBe("rounds");
  expect(url.searchParams.get("roundId")).toBe("round#1");
  expect(url.searchParams.get("outcome")).toBe("HOLD");
  expect(hrInlineRoundResultsHref("id","round","ALL")).not.toContain("outcome=");
 });
 it("HR-rounds-01 returns deterministic half-open time overlaps and readable cross-links",()=>{
  const rows=hrScheduledRoundRows(fixtures);
  expect(rows.map(row=>row.id)).toEqual(["1","2","3"]);
  expect(rows[0]?.conflicts).toEqual(["2"]);
  expect(rows[1]?.conflicts).toEqual(["1","3"]);
  expect(rows[2]?.conflicts).toEqual(["2"]);
  expect(rows[0]?.endsAt?.toISOString()).toBe("2099-07-01T10:30:00.000Z");
  expect(hrRoundConflictLabels(rows,["2","unknown"])).toEqual(["Round 2 (#2)"]);
  const links=hrRoundConflictLinks(rows,["2","missing"],"job & 1");
  expect(links).toEqual([{
   id:"2",label:"Round 2 (#2)",
   href:"/hr/placements/jobs/job%20%26%201?tab=rounds&roundId=2",
  }]);
 });
 it("HR-rounds-01 refuses malformed dates/fractional, negative or unknown durations instead of inventing a meeting end",()=>{
  const out=hrScheduledRoundRows([
   {...base("1","2099-07-01T10:00:00Z"),durationMinutes:1.5},
   {...base("2","2099-07-01T10:05:00Z"),durationMinutes:-3},
   {...base("3","2099-07-01T10:10:00Z"),durationMinutes:1441},
   {...base("4","2099-07-01T10:15:00Z"),durationMinutes:null},
   {...base("5","2099-07-01T10:20:00Z"),scheduledAt:new Date("bad")},
  ]);
  expect(out.map(row=>row.id)).toEqual(["1","2","3","4"]);
  expect(out.every(row=>row.endsAt===null)).toBe(true);
  expect(out.every(row=>row.conflicts.length===0)).toBe(true);
 });
});
