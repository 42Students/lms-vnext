import {describe,it,expect} from "vitest";
import {learnerDriveAvailabilityDriveCounts} from "@/modules/placements/learner-drive-overview-model";
const role=(jobId:string,roleId:string,canApply:boolean,deadlinePassed=false)=>({
 job:{id:jobId,title:"Job",description:"",applicationDeadline:null},
 roleOption:{id:roleId,title:"Engineer",employmentType:"FULL_TIME",locations:[],minimumAnnualCtcInr:null,maximumAnnualCtcInr:null},
 company:{name:"Employer"},canApply,deadlinePassed,
});
describe("distinct learner drive availability",()=>{
 it("counts a multi-role drive once and open if at least one role is open",()=>{
  const rows=[role("a","one",false),role("a","two",true),role("b","three",false),role("c","four",false,true)];
  expect(learnerDriveAvailabilityDriveCounts(rows)).toEqual({all:3,open:1,"not-open":1,closed:1});
 });
 it("does not count a closed role as a second drive",()=>{
  expect(learnerDriveAvailabilityDriveCounts([role("a","one",false,true),role("a","two",false,true)])).toMatchObject({all:1,closed:1});
 });
});
