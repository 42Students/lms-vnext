import {describe,expect,it} from "vitest";
import {verificationQueueCardPresentation} from "@/modules/verification/queue-card-action";
describe("College verification cards distinguish review from history",()=>{
 it("labels first-submission and updated-detail requests as pending",()=>{
  expect(verificationQueueCardPresentation("SUBMITTED")).toMatchObject({action:"Review request",pending:true});
  expect(verificationQueueCardPresentation("UPDATE_PENDING")).toMatchObject({action:"Review updates",pending:true});
 });
 it("only offers read-only decision language on past decisions",()=>{
  expect(verificationQueueCardPresentation("VERIFIED")).toMatchObject({action:"View decision",pending:false});
  expect(verificationQueueCardPresentation("SENT_BACK")).toMatchObject({action:"View decision",pending:false});
 });
});
