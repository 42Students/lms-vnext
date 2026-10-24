import {describe,expect,it} from "vitest";
import {recruiterCompanyHiringDisplay} from "@/modules/placements/recruiter-company-unified-prototype-model";
const row={
 id:"job-a",title:"Systems Engineer",status:"CLOSED",employmentType:"FULL_TIME",
 publishedAt:null,closedAt:null,applications:125,submittedApplications:123,
 withdrawnApplications:2,outstandingOffers:2,acceptedOffers:10,declinedOffers:1,joinedOffers:9,
};
describe("Recruiter company prototype truthful reports",()=>{
 it("projects only persisted facts, never invents a cleared-round count",()=>{
  expect(recruiterCompanyHiringDisplay([row])).toEqual([{
   id:"job-a",title:"Systems Engineer",status:"CLOSED",applied:125,
   cleared:null,offered:13,joined:9,joiningRate:7,
  }]);
 });
 it("does not report a joining rate when the denominator was zero",()=>{
  expect(recruiterCompanyHiringDisplay([{...row,applications:0,joinedOffers:0}])[0]?.joiningRate).toBeNull();
 });
});
