import {describe,expect,it} from "vitest";
import {buildHrCalendarCsv,HR_CALENDAR_EXPORT_CAP}
 from "@/modules/placements/hr-calendar-export-model";
import {filterHrCalendarDays} from "@/modules/placements/hr-calendar-category-model";
import {hrNextCalendarEvent} from "@/modules/placements/hr-calendar-next-event-model";
import {parseIstLocalSlot} from "@/modules/placements/hr-interview-slot-model";

const day=new Date("2026-10-18T18:29:00.000Z");
const events=[
 {kind:"ROUND",title:"Interview",jobTitle:"Engineer",startsAt:new Date("2026-10-19T04:30:00Z"),status:"SCHEDULED",jobId:"job-a"},
 {kind:"INTERVIEW_SLOT",title:"Slot",jobTitle:"Engineer",startsAt:new Date("2026-10-19T05:00:00Z"),status:"PROPOSED",jobId:"job-a"},
 {kind:"APPLICATION_DEADLINE",title:"Applications close",jobTitle:"Engineer",startsAt:new Date("2026-10-18T18:30:00Z"),status:"PUBLISHED",jobId:"job-a"},
];
const dues=[{id:"due",jobTitle:"Engineer",roundName:"Technical",dueAt:new Date("2026-10-19T08:00:00Z"),jobId:"job-a"}];

describe("HR-BREAK-calendar-01: IST deadlines, category and CSV robustness",()=>{
 it("uses IST midnight without shifting 00:00 or 23:59 deadlines a day",()=>{
  expect(parseIstLocalSlot("2026-10-19T00:00")).toBe("2026-10-19T00:00:00+05:30");
  expect(parseIstLocalSlot("2026-10-19T23:59")).toBe("2026-10-19T23:59:00+05:30");
  expect(()=>parseIstLocalSlot("2026-02-29T00:00")).toThrow();
  expect(()=>parseIstLocalSlot("2026-10-19T24:00")).toThrow();
 });
 it("calendar day cards preserve authorized kind filters but never mislabel results-due as interview slots",()=>{
  const input=[{day:"2026-10-19",events:events as never,resultsDue:dues as never}];
  const slots=filterHrCalendarDays(input,"SLOTS");
  expect(slots[0]?.events).toHaveLength(1);
  expect(slots[0]?.resultsDue).toHaveLength(0);
  const deadline=filterHrCalendarDays(input,"DEADLINES");
  expect(deadline[0]?.events).toHaveLength(1);
  expect(deadline[0]?.resultsDue).toHaveLength(0);
  const results=filterHrCalendarDays(input,"RESULTS_DUE");
  expect(results[0]?.events).toHaveLength(0);
  expect(results[0]?.resultsDue).toHaveLength(1);
 });
 it("exports only selected category and does not confuse interview slots with rounds",()=>{
  const all=buildHrCalendarCsv(events,dues,"ALL");
  expect(all.exported).toBe(4);
  expect(all.omitted).toBe(0);
  expect(all.csv).toContain("Date/time (IST)");
  expect(buildHrCalendarCsv(events,dues,"ROUNDS").exported).toBe(1);
  expect(buildHrCalendarCsv(events,dues,"SLOTS").exported).toBe(1);
  expect(buildHrCalendarCsv(events,dues,"RESULTS_DUE").exported).toBe(1);
  expect(buildHrCalendarCsv(events,dues,"DEADLINES").exported).toBe(1);
  expect(all.csv.indexOf("Applications close")).toBeLessThan(all.csv.indexOf("Interview"));
 });
 it("bounds huge export, marks omitted records and neuters spreadsheet formula injection",()=>{
  const inputs=Array.from({length:HR_CALENDAR_EXPORT_CAP+3},(_,i)=>({
   ...events[0]!,title:i===0?"=HYPERLINK(\"https://hostile.example\")":"Interview "+i,
   startsAt:new Date(events[0]!.startsAt.getTime()+i*60_000),
  }));
  const exported=buildHrCalendarCsv(inputs,[],"ALL");
  expect(exported.exported).toBe(HR_CALENDAR_EXPORT_CAP);
  expect(exported.omitted).toBe(3);
  expect(exported.csv).toContain("'=HYPERLINK");
  expect(exported.csv).toContain("Export capped");
  expect(exported.csv.startsWith("\uFEFF")).toBe(true);
 });
 it("next appointment ignores historical items even when the selected day contains both",()=>{
  const next=hrNextCalendarEvent(events.map(({kind,title,startsAt})=>({kind,title,startsAt})),
   dues.map(({roundName,dueAt})=>({roundName,dueAt})),"ALL",day);
  expect(next?.title).toBe("Applications close");
  const roundsOnly=hrNextCalendarEvent(events.map(({kind,title,startsAt})=>({kind,title,startsAt})),[],"ROUNDS",day);
  expect(roundsOnly?.title).toBe("Interview");
 });
});