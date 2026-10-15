import {describe,it,expect} from "vitest";
import {verificationCsv} from "@/modules/verification/queue-export";
describe("staff CSV",()=>{it("cannot execute spreadsheet formula in a learner display name",()=>{
 const row={learnerName:"+2+3",section:"EDUCATION",status:"VERIFIED",submittedAt:"",reviewedAt:""};
 const report=verificationCsv([row]);
 expect(report.csv).toContain("' +".trim()+"2+3");
 expect(report.truncated).toBe(false);
});});
