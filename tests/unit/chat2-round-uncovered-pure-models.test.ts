import { describe, expect, it } from "vitest";
import {
  summarizeFailedRoundShares,
  summarizeFailedRoundSharesByBranch,
} from "@/modules/placements/tpo-failure-round-share-model";
import { bulkTpoRoundResultSchema } from "@/modules/placements/tpo-bulk-round-result-model";
import { tpoRoundResultTableQuerySchema } from "@/modules/placements/tpo-round-result-table-model";
import { tpoRoundFailureCsvQuerySchema } from "@/modules/placements/tpo-round-failure-csv-model";
import { HR_DRIVE_ROUND_PRESETS, applyHrRoundPreset } from "@/modules/placements/hr-drive-round-presets";
import { emptyHrDriveDraft } from "@/modules/placements/hr-drive-draft-model";
import { hrScheduledRoundRows, hrRoundConflictLabels, hrRoundConflictLinks, type RoundScheduleRow } from "@/modules/placements/hr-round-schedule-model";
import { HR_ROUND_OUTCOMES, hrInlineRoundResultFilters, hrInlineRoundResultsHref } from "@/modules/placements/hr-inline-round-results-model";
import { isTpoRoundPresetKey, plannedTpoRoundRows, TPO_DRIVE_ROUND_PRESETS } from "@/modules/placements/tpo-drive-round-presets";

const firstId = "11111111-1111-4111-8111-111111111111";
const secondId = "22222222-2222-4222-8222-222222222222";
const thirdId = "33333333-3333-4333-8333-333333333333";

describe("chat-2 round model uncovered behavioural boundaries", () => {
  it("TPO-calendar-reports-48 uses applied decisions as each round's failure denominator and ignores duplicated joins", () => {
    const rows = [
      {id: firstId,roundId:"round-a",roundName:"Aptitude",jobId:"job-a",outcome:"FAIL"},
      {id: firstId,roundId:"round-a",roundName:"Aptitude",jobId:"job-a",outcome:"FAIL"},
      {id: secondId,roundId:"round-a",roundName:"Aptitude",jobId:"job-a",outcome:"PASS"},
      {id: thirdId,roundId:"round-b",roundName:"Interview",jobId:"job-b",outcome:"HOLD"},
    ] as const;
    const snapshot = structuredClone(rows);
    const summary = summarizeFailedRoundShares(rows);
    expect(summary).toHaveLength(2);
    expect(summary[0]).toMatchObject({roundId:"round-a",decisions:2,failed:1,shareOfRoundPercent:50});
    expect(summary[1]).toMatchObject({roundId:"round-b",decisions:1,failed:0,shareOfRoundPercent:0});
    expect(rows).toEqual(snapshot);
    expect(summarizeFailedRoundShares([])).toEqual([]);
  });

  it("TPO-calendar-reports-48 separates current active branches and marks missing enrollment without inventing a department", () => {
    const input = [
      {id:firstId,roundId:"round",roundName:"Interview",jobId:"job",outcome:"FAIL",branchId:null,branchName:null},
      {id:firstId,roundId:"round",roundName:"Interview",jobId:"job",outcome:"FAIL",branchId:null,branchName:null},
      {id:secondId,roundId:"round",roundName:"Interview",jobId:"job",outcome:"PASS",branchId:null,branchName:"  "},
      {id:thirdId,roundId:"round",roundName:"Interview",jobId:"job",outcome:"FAIL",branchId:"dept",branchName:"CSE"},
    ];
    const summary=summarizeFailedRoundSharesByBranch(input);
    expect(summary).toHaveLength(2);
    expect(summary.find(row=>row.branchId===null)).toMatchObject({
      branchName:"Not recorded",decisions:2,failed:1,shareOfRoundPercent:50,
    });
    expect(summary.find(row=>row.branchId==="dept")).toMatchObject({decisions:1,failed:1,shareOfRoundPercent:100});
  });

  it("TPO-drive-workspace-41 enforces explicit confirmation, exact roster identities and non-overlapping HOLD ranks", () => {
    const make = (applicationId:string, outcome:"HOLD"|"PASS", rank?:number) => ({
      expectedCurrentResultId:null,
      result:{applicationId,outcome,...(rank===undefined?{}:{waitlistRank:rank}),
        ...(outcome==="HOLD"?{candidateMessage:"You are waitlisted"}:{})},
    });
    const valid={confirmed:true,entries:[make(firstId,"HOLD",1),make(secondId,"PASS")]};
    expect(bulkTpoRoundResultSchema.safeParse(valid).success).toBe(true);
    for(const bad of [
      {...valid,confirmed:false},
      {...valid,collegeId:firstId},
      {...valid,entries:[]},
      {...valid,entries:[make(firstId,"PASS"),make(firstId,"PASS")]},
      {...valid,entries:[make(firstId,"HOLD",1),make(secondId,"HOLD",1)]},
      {...valid,entries:[make(firstId,"HOLD",0)]},
      {...valid,entries:[{...make(firstId,"PASS"),expectedCurrentResultId:"other"}]},
      {...valid,entries:Array.from({length:26},(_,index)=>make(index.toString(16).padStart(8,"0")+"-1111-4111-8111-111111111111","PASS"))},
    ]) expect(bulkTpoRoundResultSchema.safeParse(bad).success).toBe(false);
  });

  it("TPO-round-query-01 denies tenant injection and malformed pagination filters", () => {
    expect(tpoRoundResultTableQuerySchema.parse({jobId:firstId,roundId:secondId}))
      .toEqual({jobId:firstId,roundId:secondId});
    for(const raw of [
      {jobId:firstId,roundId:"invalid"},
      {jobId:firstId,roundId:secondId,collegeId:thirdId},
      {roundId:secondId},
    ]) expect(tpoRoundResultTableQuerySchema.safeParse(raw).success).toBe(false);
    expect(tpoRoundFailureCsvQuerySchema.parse({})).toEqual({});
    expect(tpoRoundFailureCsvQuerySchema.safeParse({seasonId:firstId,jobId:secondId}).success).toBe(true);
    expect(tpoRoundFailureCsvQuerySchema.safeParse({jobId:"../../secret"}).success).toBe(false);
    expect(tpoRoundFailureCsvQuerySchema.safeParse({collegeId:firstId}).success).toBe(false);
  });

  it("HR-round-presets-01 uses distinct editable copies and preserves untouched employment terms", () => {
    const draft={...emptyHrDriveDraft(),title:"Backend Engineer",ctcLpa:"12"};
    expect(HR_DRIVE_ROUND_PRESETS).toHaveLength(3);
    const selected=applyHrRoundPreset(draft,"FULL_PROCESS");
    expect(selected.title).toBe("Backend Engineer");
    expect(selected.ctcLpa).toBe("12");
    expect(selected.rounds.map(r=>r.kind)).toEqual(["TALK","TEST","GD","INTERVIEW"]);
    expect(selected.rounds[0]).not.toBe(HR_DRIVE_ROUND_PRESETS[2].rounds[0]);
    expect(draft.rounds).toHaveLength(1);
    expect(applyHrRoundPreset(draft,"UNKNOWN" as "FULL_PROCESS")).toBe(draft);
  });

  it("TPO-drives-39 rejects prototype names as presets and numbers the valid rounds without inventing a schedule", () => {
    expect(isTpoRoundPresetKey("constructor")).toBe(false);
    expect(isTpoRoundPresetKey("__proto__")).toBe(false);
    expect(isTpoRoundPresetKey(null)).toBe(false);
    for(const key of Object.keys(TPO_DRIVE_ROUND_PRESETS)){
      expect(isTpoRoundPresetKey(key)).toBe(true);
      if(isTpoRoundPresetKey(key)){
        const rows=plannedTpoRoundRows(key);
        expect(rows.map(r=>r.sequence)).toEqual(rows.map((_,index)=>index+1));
        expect(rows.every(row=>!Object.hasOwn(row,"scheduledAt")&&!Object.hasOwn(row,"venue"))).toBe(true);
      }
    }
    expect(plannedTpoRoundRows("NONE")).toEqual([]);
  });

  it("HR-round-schedule-01 reports true overlaps, not touching boundaries or cancelled rounds", () => {
    const t=new Date("2099-10-20T09:00:00.000Z");
    const row=(id:string,minutes:number,status="SCHEDULED",offset=0):RoundScheduleRow=>({
      id,name:id,sequence:1,status,scheduledAt:new Date(t.getTime()+offset*60_000),
      durationMinutes:minutes,mode:"ON_CAMPUS",venue:"A",
    });
    const result=hrScheduledRoundRows([
      row("a",60),row("b",30,"COMPLETED",30),
      row("touching",30,"SCHEDULED",60),row("cancelled",120,"CANCELLED",30),
      {...row("unscheduled",30),scheduledAt:null},
    ]);
    expect(result.map(r=>r.id)).toEqual(["a","b","touching"]);
    expect(result.find(r=>r.id==="a")?.conflicts).toEqual(["b"]);
    expect(result.find(r=>r.id==="b")?.conflicts).toEqual(["a"]);
    expect(result.find(r=>r.id==="touching")?.conflicts).toEqual([]);
    expect(hrRoundConflictLabels(result,["b","missing"])).toEqual(["b (#1)"]);
    expect(hrRoundConflictLinks(result,["a","missing"],"job/1")).toEqual([
      {id:"a",label:"a (#1)",href:"/hr/placements/jobs/job%2F1?tab=rounds&roundId=a"},
    ]);
  });

  it("HR-round-results-01 keeps outcome filters and deep links scoped to the selected round", () => {
    expect(HR_ROUND_OUTCOMES).toContain("UNRECORDED");
    const filters=hrInlineRoundResultFilters({all:10,recorded:6,unrecorded:4,pass:3,fail:1,hold:1,absent:1});
    expect(filters.find(row=>row.value==="UNRECORDED")).toMatchObject({label:"Not recorded",count:4});
    expect(filters.find(row=>row.value==="PASS")).toMatchObject({count:3});
    expect(hrInlineRoundResultFilters().every(row=>row.count===0)).toBe(true);
    expect(hrInlineRoundResultsHref("job/1","round &1","ALL"))
      .toBe("/hr/placements/jobs/job%2F1?tab=rounds&roundId=round+%261");
    expect(hrInlineRoundResultsHref("job/1","round &1","FAIL"))
      .toContain("&outcome=FAIL");
  });
});
