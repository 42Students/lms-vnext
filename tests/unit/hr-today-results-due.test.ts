import {describe,expect,it} from "vitest";
import {projectHrTodayResultsDue} from "@/modules/placements/hr-today-results-due-model";
const mk=(id:string,jobId:string,day:number)=>({id,jobId,jobTitle:"Engineer",roundName:"Technical",
 dueAt:new Date("2026-10-"+day+"T10:00:00.000Z"),status:"SCHEDULED"});
describe("HR Today due action scope",()=>{
 it("filters explicit authorized drive IDs and sorts chronologically",()=>{
  const values=[mk("a","job-a",22),mk("b","foreign-job",19),mk("c","job-a",20)];
  expect(projectHrTodayResultsDue(values,["job-a"]).map(x=>x.id)).toEqual(["c","a"]);
 });
 it("does not synthesize deadlines for unscoped or missing rows",()=>{
  expect(projectHrTodayResultsDue([],["job-a"])).toEqual([]);
  expect(projectHrTodayResultsDue([mk("b","foreign",20)],["job-a"])).toEqual([]);
 });
});
