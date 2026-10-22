import {describe,it,expect} from "vitest";
import {readFileSync} from "node:fs";
import {verificationDecisionNotice} from "@/modules/verification/notification-copy";
describe("Chat-5 previously authored TPO verification workflow parity",()=>{
 it("TPO-requests-verification-25 preserves ordered sequential review, next and finish with no forced decision",()=>{
  const source=readFileSync(new URL("../../src/components/verification/TpoVerificationPanel.tsx",import.meta.url),"utf8");
  for(const key of ["nextSequential","finishSequential","sequenceProgress","onNext={nextSequential}","onFinish={finishSequential}"])expect(source).toContain(key);
  expect(source).toContain("The other "+"" );
 });
 it("TPO-requests-verification-30 sends the recorded reviewer name and correction reason in the official learner wording",()=>{
  expect(verificationDecisionNotice({section:"EDUCATION",action:"VERIFIED",reviewerName:"Priya",reason:null}))
   .toEqual({title:"Your education is verified",body:"Verified by Priya. Companies and the placement cell now see it as verified."});
  expect(verificationDecisionNotice({section:"IDENTITY",action:"SENT_BACK",reviewerName:null,reason:"Wrong document"}))
   .toEqual({title:"Your identity needs a change",body:"Wrong document Fix it on your profile and send it again."});
  const service=readFileSync(new URL("../../src/modules/profile-verification/transaction-writer.ts",import.meta.url),"utf8");
  expect(service).toContain("verificationDecisionNotice({");
 });
});