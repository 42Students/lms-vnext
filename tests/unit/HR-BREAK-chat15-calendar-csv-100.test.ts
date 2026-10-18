import {describe,expect,it} from "vitest";
import {buildHrCalendarCsv,HR_CALENDAR_EXPORT_CAP}
 from "@/modules/placements/hr-calendar-export-model";
const at=new Date("2099-05-01T18:30:00.000Z");
const event={kind:"ROUND",title:"Panel interview",jobTitle:"Graduate engineering",
 startsAt:at,status:"SCHEDULED",jobId:"owned"};
const due={id:"due",jobTitle:"Graduate engineering",roundName:"Technical due",
 dueAt:at,jobId:"owned"};
describe("HR-CALENDAR-CSV-100 employer schedule export bounds",()=>{
 it("ignores malformed event and results due dates instead of crashing IST export",()=>{
  const result=buildHrCalendarCsv([
   event,{...event,title:"Corrupt",startsAt:new Date(Number.NaN)},
  ],[due,{...due,id:"invalid",dueAt:new Date(Number.NaN)}],"ALL");
  expect(result.exported).toBe(2);
  expect(result.csv).toContain("Panel interview");
  expect(result.csv).toContain("Technical due");
  expect(result.csv).not.toContain("Corrupt");
  expect(result.csv).not.toContain("Invalid Date");
 });
 it("filters round versus due items at the selected category without false extras",()=>{
  const rounds=buildHrCalendarCsv([event],[due],"ROUNDS");
  expect(rounds.exported).toBe(1);
  expect(rounds.csv).not.toContain("Technical due");
  const results=buildHrCalendarCsv([event],[due],"RESULTS_DUE");
  expect(results.exported).toBe(1);
  expect(results.csv).not.toContain("Panel interview");
 });
 it("escapes formula-like event and job titles without leaking contact data",()=>{
  const result=buildHrCalendarCsv([{...event,title:" =HYPERLINK(1,2)",
   jobTitle:"\t@SUM(1,2)"}],[],"ALL");
  expect(result.csv).toContain("' =HYPERLINK(1,2)");
  expect(result.csv).toContain("'\t@SUM(1,2)");
 });
 it("caps large authorized calendar windows at the export limit",()=>{
  const rows=Array.from({length:HR_CALENDAR_EXPORT_CAP+2},(_,i)=>({
   ...event,title:"Round "+i,
  }));
  const result=buildHrCalendarCsv(rows,[],"ALL");
  expect(result.exported).toBe(HR_CALENDAR_EXPORT_CAP);
  expect(result.omitted).toBe(2);
  expect(result.csv).toContain("Additional authorized events omitted");
 });
});