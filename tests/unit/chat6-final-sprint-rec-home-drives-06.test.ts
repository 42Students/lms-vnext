import {describe,expect,it} from "vitest";
import {readFileSync} from "node:fs";
import {recruiterTodayWeekEvents} from "@/modules/placements/recruiter-today-week-events-model";
describe("Final sprint recruiter this-week combined feed",()=>{
 it("REC-home-drives-06 week feed includes scoped round slot deadline and result events",()=>{
  const now=new Date("2099-04-03T10:00:00Z");
  const results=recruiterTodayWeekEvents({
   events:[],resultsDue:[
    {id:"round-a",jobId:"allowed",jobTitle:"Engineer",roundName:"Technical",dueAt:new Date("2099-04-04T10:00:00Z")},
    {id:"round-b",jobId:"other",jobTitle:"Other",roundName:"HR",dueAt:new Date("2099-04-04T10:00:00Z")},
    {id:"round-c",jobId:"allowed",jobTitle:"Engineer",roundName:"Late",dueAt:new Date("2099-04-30T10:00:00Z")},
   ],allowedJobs:["allowed"],now,
  });
  expect(results).toHaveLength(1);
  expect(results[0]).toMatchObject({kind:"RESULTS_DUE",title:"Results due · Technical"});
  expect(results[0]?.href).toContain("tab=rounds&roundId=round-a");
  const model=readFileSync("src/modules/placements/recruiter-today-week-events-model.ts","utf8");
  expect(model).toContain('"APPLICATION_DEADLINE"?"DEADLINE"');
  expect(model).toContain('"INTERVIEW_SLOT"?"SLOT"');
  expect(model).toContain('.slice(0,8)');
  const page=readFileSync("src/app/(authenticated)/hr/home/page.tsx","utf8");
  expect(page).toContain("recruiterTodayEightDayWindow(now)");
  expect(page).toContain("weekEvents.map(item=>");
 });
});
