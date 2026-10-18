import {describe,expect,it} from "vitest";
import {buildHrCalendarCsv,HR_CALENDAR_EXPORT_CAP}
 from "@/modules/placements/hr-calendar-export-model";

const first=new Date("2099-01-01T18:30:00.000Z");
const later=new Date("2099-01-02T18:30:00.000Z");
const events=[
 {kind:"ROUND",title:"=HYPERLINK(\"https://example.invalid\")",
  jobTitle:"+SUM(1,2)",startsAt:first,status:"SCHEDULED",jobId:"job-a"},
 {kind:"INTERVIEW_SLOT",title:"Technical",jobTitle:"Engineer",
  startsAt:later,status:"OFFERED",jobId:"job-a"},
 {kind:"APPLICATION_DEADLINE",title:"Applications close",jobTitle:"Engineer",
  startsAt:later,status:"PUBLISHED",jobId:"job-a"},
];
const due=[{id:"due-1",roundName:"Technical result",jobTitle:"Engineer",
 dueAt:first,jobId:"job-a"}];

describe("HR-CALENDAR-EXPORT-22 authorized employer CSV and client safety",()=>{
 it("exports only permitted event categories with one date/time header in IST",()=>{
  const all=buildHrCalendarCsv(events,due,"ALL");
  expect(all.exported).toBe(4);
  expect(all.omitted).toBe(0);
  expect(all.csv).toContain('"Date/time (IST)"');
  expect(all.csv).toContain("02 Jan 2099");
  expect(all.csv).toContain("03 Jan 2099");
  for(const [kind,count] of [["ROUNDS",1],["SLOTS",1],
   ["DEADLINES",1],["RESULTS_DUE",1]] as const){
   const subset=buildHrCalendarCsv(events,due,kind);
   expect(subset.exported).toBe(count);
   const kept={ROUNDS:"ROUND",SLOTS:"INTERVIEW_SLOT",
    DEADLINES:"APPLICATION_DEADLINE",RESULTS_DUE:"RESULTS_DUE"}[kind];
   expect(subset.csv).toContain('"' + kept + '"');
   for(const excluded of ["ROUND","INTERVIEW_SLOT","APPLICATION_DEADLINE","RESULTS_DUE"])
    if(excluded!==kept)expect(subset.csv).not.toContain('"' + excluded + '"');
  }
  const dueOnly=buildHrCalendarCsv(events,due,"RESULTS_DUE");
  expect(dueOnly.csv).toContain('"RESULTS_DUE"');
  expect(dueOnly.csv).not.toContain('"INTERVIEW_SLOT"');
 });
 it("neutralizes spreadsheet formula execution and preserves quoted CSV cells",()=>{
  const csv=buildHrCalendarCsv(events,due,"ALL").csv;
  expect(csv.startsWith("\uFEFF")).toBe(true);
  expect(csv).toContain("'+SUM(1,2)");
  expect(csv).toContain("'=HYPERLINK");
  expect(csv).not.toContain('"=HYPERLINK');
  const escaped=buildHrCalendarCsv([{
   ...events[0]!,title:'"recruiter", Risk\n=2+3',
   jobTitle:"\t@CMD",
  }],[],"ALL");
  expect(escaped.csv).toContain('""recruiter""');
  expect(escaped.csv).toContain("'\t@CMD");
 });
 it("never emits more than the 200 authorized rows in a single downloaded file",()=>{
  const records=Array.from({length:HR_CALENDAR_EXPORT_CAP+5},(_,index)=>({
   ...events[0]!,title:"Interview "+index,
   startsAt:new Date(first.getTime()+index*60_000),
  }));
  const result=buildHrCalendarCsv(records,[],"ALL");
  expect(result.exported).toBe(HR_CALENDAR_EXPORT_CAP);
  expect(result.omitted).toBe(5);
  expect(result.csv).toContain("Additional authorized events omitted");
  expect(result.csv).not.toContain('"Interview 204"');
 });
});
