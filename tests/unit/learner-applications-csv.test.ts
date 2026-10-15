import {it,expect} from "vitest";
import {learnerApplicationsCsv} from "@/modules/placements/learner-applications-csv-model";
it("exports only filtered own application fields with formula-neutralized CSV",()=>{
 const csv=learnerApplicationsCsv([{
  applicationId:"private",companyName:'=HYPERLINK("evil")',jobTitle:"Engineer",
  applicationStatus:"SUBMITTED",submittedAt:new Date("2026-10-15T01:00:00Z"),withdrawnAt:null,
  screening:{status:"UNDER_REVIEW",decidedAt:null},results:[],
 }]);
 expect(csv).toContain("'=HYPERLINK");
 expect(csv).toContain("UNDER_REVIEW");
 expect(csv).not.toContain("private");
 expect(csv).not.toContain("decisionMessage");
 expect(csv).toContain("2026-10-15T01:00:00.000Z");
});
