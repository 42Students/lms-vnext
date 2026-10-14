import {describe,expect,it} from "vitest";
import {hrTodayLiveDriveRows} from "@/modules/placements/hr-today-live-drive-model";
const deadline=new Date("2026-10-20T00:00:00Z");
const base={collegeId:"college-a",companyId:"company-a",
 job:{id:"one",title:"Engineer",status:"PUBLISHED",archivedAt:null,applicationDeadline:deadline}};
describe("HR live drive command-center read projection",()=>{
 it("filters wrong employer, college, archived and closed before ranking deadlines",()=>{
  const result=hrTodayLiveDriveRows([
   base,{...base,companyId:"company-b",job:{...base.job,id:"foreign-company"}},
   {...base,collegeId:"college-b",job:{...base.job,id:"foreign-college"}},
   {...base,job:{...base.job,id:"archived",archivedAt:deadline}},
   {...base,job:{...base.job,id:"closed",status:"CLOSED"}},
   {...base,job:{...base.job,id:"soon",title:"Analyst",applicationDeadline:new Date("2026-10-19T00:00:00Z")}},
  ],"college-a","company-a");
  expect(result.map(row=>row.job.id)).toEqual(["soon","one"]);
 });
 it("does not mutate input and limits cards",()=>{
  expect(hrTodayLiveDriveRows([base], "college-a","company-a",0)).toEqual([]);
 });
});
