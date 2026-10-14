import {describe,expect,it} from "vitest";
import {hrCompanyReportPageSignals} from "@/modules/placements/hr-report-page-signals-model";
import type {RecruiterReportRow} from "@/modules/placements/recruiter-company-reports-model";
const row:RecruiterReportRow={id:"drive",title:"Engineer",status:"PUBLISHED",
 employmentType:"FULL_TIME",publishedAt:null,closedAt:null,applications:5,submittedApplications:4,
 withdrawnApplications:1,outstandingOffers:2,acceptedOffers:1,declinedOffers:1,joinedOffers:1};
describe("HR paged company funnel",()=>{
 it("aggregates only provided authorized rows",()=>{
  const r=hrCompanyReportPageSignals([row,{...row,id:"second",applications:1,submittedApplications:1}]);
  expect(r).toEqual({drives:2,applications:6,submitted:5,withdrawn:2,
   outstanding:4,accepted:2,declined:2,joined:2});
  expect(hrCompanyReportPageSignals([])).toEqual({drives:0,applications:0,submitted:0,
   withdrawn:0,outstanding:0,accepted:0,declined:0,joined:0});
 });
});
