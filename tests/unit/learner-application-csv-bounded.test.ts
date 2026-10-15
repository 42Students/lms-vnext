import {describe,it,expect} from "vitest";
import {learnerApplicationsCsv,LEARNER_APPLICATION_CSV_LIMIT} from "@/modules/placements/learner-applications-csv-model";
describe("own learner applications CSV capacity",()=>{
 it("exports only a documented bounded subset without changing input",()=>{
  const rows=Array.from({length:LEARNER_APPLICATION_CSV_LIMIT+2},(_,i)=>({
   applicationId:"id"+i,companyName:"Employer "+i,jobTitle:"Role",
   applicationStatus:"SUBMITTED",submittedAt:new Date("2026-10-15T00:00:00Z"),
   withdrawnAt:null,screening:{status:"UNDER_REVIEW",decidedAt:null},results:[],
  }));
  const result=learnerApplicationsCsv(rows);
  expect(result).toContain("Employer 999");
  expect(result).not.toContain("Employer 1000");
  expect(rows).toHaveLength(1002);
 });
});
