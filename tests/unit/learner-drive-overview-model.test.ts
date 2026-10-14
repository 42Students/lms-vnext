import {describe,expect,it} from "vitest";
import {learnerDriveOverview} from "@/modules/placements/learner-drive-overview-model";
const row=(jobId:string,roleId:string,application:null|{id:string}=null)=>({
 job:{id:jobId,title:"Engineer",description:"",applicationDeadline:null},
 company:{name:"Employer"},roleOption:{id:roleId,title:"Engineer",employmentType:"FULL_TIME",locations:["Hyderabad"],
 minimumAnnualCtcInr:null,maximumAnnualCtcInr:null},
 canApply:true,deadlinePassed:false,application
});
describe("L12-002 all drives summary",()=>{
 it("keeps jobs distinct from role options and counts saved application only once",()=>{
  expect(learnerDriveOverview([row("a","r1",{id:"x"}),row("a","r2",{id:"x"}),row("b","r3")]))
  .toEqual({drives:2,roles:3,withApplications:1});
  expect(learnerDriveOverview([])).toEqual({drives:0,roles:0,withApplications:0});
 });
});
