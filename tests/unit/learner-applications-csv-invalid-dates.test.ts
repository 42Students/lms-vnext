import {expect,it} from "vitest";
import {learnerApplicationsCsv} from "@/modules/placements/learner-applications-csv-model";
it("leaves invalid saved UTC date fields blank without crashing an own-application export",()=>{
 const csv=learnerApplicationsCsv([{applicationId:"a",companyName:"Acme",jobTitle:"Engineer",applicationStatus:"SUBMITTED",submittedAt:new Date("invalid"),withdrawnAt:new Date("invalid"),screening:{status:"APPLIED",decidedAt:null},results:[]}]);
 expect(csv).toContain('"Acme","Engineer"');
 expect(csv).not.toContain("Invalid Date");
 expect(csv.split("\r\n")).toHaveLength(3);
});
