import {describe,expect,it} from "vitest";
import {projectHrTodayResultsDue,type HrTodayResultsDue}
 from "@/modules/placements/hr-today-results-due-model";

const when=new Date("2099-06-01T18:29:59.999Z");
const item=(id:string,status="SCHEDULED",jobId="own"):HrTodayResultsDue=>({
 id,jobId,jobTitle:"Role",roundName:"Technical",status,dueAt:when,
});
describe("HR-CALENDAR-75: results due reminders reject stale round states",()=>{
 it("keeps scheduled and completed results only for employer-authorized jobs",()=>{
  const rows=[item("scheduled"),item("completed","COMPLETED"),
   item("foreign","SCHEDULED","foreign")];
  expect(projectHrTodayResultsDue(rows,["own"]).map(r=>r.id))
   .toEqual(["completed","scheduled"]);
 });
 it("does not show canceled, pending or draft rounds in a refreshed Today view",()=>{
  const rows=[item("cancelled","CANCELLED"),item("pending","PENDING"),
   item("draft","DRAFT"),item("scheduled")];
  expect(projectHrTodayResultsDue(rows,["own"]).map(r=>r.id)).toEqual(["scheduled"]);
 });
 it("ignores corrupt dates, preserving input order and stable tie breaks",()=>{
  const rows=[item("z"),{...item("invalid"),dueAt:new Date(Number.NaN)},
   item("a")];
  expect(projectHrTodayResultsDue(rows,["own"]).map(r=>r.id)).toEqual(["a","z"]);
  expect(rows[0]?.id).toBe("z");
 });
 it("an empty authorized allowlist never projects private college reminders",()=>{
  expect(projectHrTodayResultsDue([item("private")],[])).toEqual([]);
 });
});