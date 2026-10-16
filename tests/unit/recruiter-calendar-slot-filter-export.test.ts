import {describe,expect,it} from "vitest";
import {filterHrCalendarDays} from "@/modules/placements/hr-calendar-category-model";
import {buildHrCalendarCsv} from "@/modules/placements/hr-calendar-export-model";
import type {PlacementCalendarEvent} from "@/modules/placements/placement-calendar-model";

const at=new Date("2026-10-20T09:00:00Z");
const slot:PlacementCalendarEvent={id:"slot:test",kind:"INTERVIEW_SLOT",
 startsAt:at,title:"Interview slot",companyId:"company",companyName:"Example",
 jobId:"job",jobTitle:"Engineer",roundId:"round",roundKind:"INTERVIEW",
 leadId:null,followupId:null,status:"PROPOSED",timezone:"Asia/Kolkata",
 venue:"Campus",note:null,completedAt:null};
const deadline:PlacementCalendarEvent={...slot,id:"deadline:job",kind:"APPLICATION_DEADLINE",
 title:"Application deadline",roundId:null,roundKind:null};

describe("REC-calendar-messages-profile-01 calendar categories and export",()=>{
 it("isolates persisted interview slots in the slot filter without losing ALL",()=>{
  const groups=[{day:"2026-10-20",events:[slot,deadline],resultsDue:[]}];
  expect(filterHrCalendarDays(groups,"SLOTS")[0]!.events.map(x=>x.id)).toEqual(["slot:test"]);
  expect(filterHrCalendarDays(groups,"ROUNDS")[0]!.events).toEqual([]);
  expect(filterHrCalendarDays(groups,"ALL")[0]!.events).toHaveLength(2);
 });
 it("includes slots in SLOTS and ALL CSV but not deadline-only CSV",()=>{
  const events=[slot,deadline];
  const shaped=events.map(event=>({kind:event.kind,title:event.title,
    jobTitle:event.jobTitle,startsAt:event.startsAt,status:event.status,jobId:event.jobId}));
  expect(buildHrCalendarCsv(shaped,[],"SLOTS").exported).toBe(1);
  expect(buildHrCalendarCsv(shaped,[],"SLOTS").csv).toContain("Interview slot");
  expect(buildHrCalendarCsv(shaped,[],"DEADLINES").csv).not.toContain("Interview slot");
  expect(buildHrCalendarCsv(shaped,[],"ALL").exported).toBe(2);
 });
});
