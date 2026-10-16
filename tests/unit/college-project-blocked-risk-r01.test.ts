import {describe,expect,it} from "vitest";
import {deriveProjectRiskReasons} from "@/modules/projects/risk-signals";

describe("COL-projects-10 / COL-projects-11 persisted task risk",()=>{
 it("flags an active blocker without stale activity or pending review",()=>{
  expect(deriveProjectRiskReasons({
   projectStatus:"ACTIVE",inactiveDays:0,latestSubmissionStatus:null,hasBlockedTask:true,
  })).toEqual(["Active blocker"]);
 });
 it("combines risks without duplicate or hidden pending delivery signals",()=>{
  expect(deriveProjectRiskReasons({
   projectStatus:"ACTIVE",inactiveDays:9,latestSubmissionStatus:"SUBMITTED",hasBlockedTask:true,
  })).toEqual(["No activity in 9 days","Active blocker","Pending review"]);
 });
 it("never treats archived or completed projects as active risk",()=>{
  for(const status of ["COMPLETED","ARCHIVED"]){
   expect(deriveProjectRiskReasons({
    projectStatus:status,inactiveDays:30,latestSubmissionStatus:"SUBMITTED",hasBlockedTask:true,
   })).toEqual([]);
  }
 });
});
