import {describe,expect,it} from "vitest";
import {buildRecruiterCompanyReportRows,type RecruiterReportJob} from "@/modules/placements/recruiter-company-reports-model";
const job:RecruiterReportJob={id:"job",title:"Engineer",status:"PUBLISHED",employmentType:"FULL_TIME",publishedAt:null,closedAt:null};
describe("HR recruiting report outcome evidence",()=>{
 it("adds declined and joined counts only for matching jobs",()=>{
  const rows=buildRecruiterCompanyReportRows([job],[{jobId:"job",applications:5,submittedApplications:4,
   withdrawnApplications:1,outstandingOffers:2,acceptedOffers:1,declinedOffers:2,joinedOffers:1}]);
  expect(rows[0]).toMatchObject({declinedOffers:2,joinedOffers:1,acceptedOffers:1});
 });
 it("defaults foreign/out-of-scope and absent metrics to zero",()=>{
  expect(buildRecruiterCompanyReportRows([job],[])[0]).toMatchObject({declinedOffers:0,joinedOffers:0});
  expect(buildRecruiterCompanyReportRows([job],[{jobId:"other",applications:50,
   submittedApplications:50,withdrawnApplications:0,outstandingOffers:50,acceptedOffers:50,joinedOffers:50}])[0])
     .toMatchObject({applications:0,joinedOffers:0});
 });
});
