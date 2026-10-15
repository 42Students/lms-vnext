import {describe,expect,it} from "vitest";
import {verificationCsv} from "@/modules/verification/queue-export";
describe("Verification export submitted-evidence metadata",()=>{
 it("shows submitted education row counts and flags, not private evidence identifiers",()=>{
  const data=verificationCsv([{learnerName:"=HYPERLINK(1)",section:"EDUCATION",status:"SUBMITTED",submittedAt:"Oct 15",reviewedAt:"",
   educationEntryCount:2,missingDocumentCount:1,attentionFlags:"missing marksheet"}]);
  expect(data.csv).toContain("Education entries submitted");
  expect(data.csv).toContain("Rows without marksheet");
  expect(data.csv).toContain("missing marksheet");
  expect(data.csv).toContain("'=HYPERLINK");
  expect(data.csv).not.toContain("receiptId");
  expect(data.truncated).toBe(false);
 });
 it("keeps missing-submission evidence blank for identity-only requests",()=>{
  const csv=verificationCsv([{learnerName:"Learner",section:"IDENTITY",status:"VERIFIED",submittedAt:"Oct 15",reviewedAt:"Oct 15"}]).csv;
  expect(csv).toContain('"IDENTITY"');
  expect(csv).not.toContain("undefined");
 });
});
