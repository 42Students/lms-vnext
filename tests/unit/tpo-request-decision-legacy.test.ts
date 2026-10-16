import {describe,expect,it} from "vitest";
import {
  TPO_REJECTION_REASONS,
  TPO_REQUEST_DECISION_COPY,
  tpoRequestApprovalCopy,
  tpoRequestDecisionSchema,
} from "@/modules/placements/tpo-request-decision-model";
import {learnerPlacementRequestDecisionNotice} from "@/modules/placements/learner-request-decision-notice";

describe("TPO-requests-verification-02 / -03 legacy request dialogs",()=>{
 it("keeps the exact legacy rejection reasons and confirmation copy",()=>{
  expect(TPO_REJECTION_REASONS).toEqual([
   "Not eligible","Proof missing or unclear","Deadline has passed",
   "Policy does not allow it","Duplicate request","Other",
  ]);
  expect(TPO_REQUEST_DECISION_COPY.rejectTitle).toBe("Reject this request");
  expect(TPO_REQUEST_DECISION_COPY.rejectHelp).toBe(
   "The student sees your reason. Pick one, or choose Other to write your own.");
  expect(TPO_REQUEST_DECISION_COPY.approved).toBe("Approved. The student has been told.");
  expect(TPO_REQUEST_DECISION_COPY.rejected).toBe("Rejected. The student has been told, with your reason.");
 });
 it("explains each supported decision before approval",()=>{
  expect(tpoRequestApprovalCopy("APPLICATION_WITHDRAWAL")).toEqual({
   title:"Approve this withdrawal?",
   help:"Each student leaves the drive; their application is withdrawn. The student is told.",
  });
  expect(tpoRequestApprovalCopy("OFFER_EXTENSION").help).toContain(
   "Each student gets the extra time they asked for on their offer.");
  expect(tpoRequestApprovalCopy("ROUND_RESCHEDULE").title).toBe("Approve this reschedule?");
 });
 it("does not permit a rejection without a reason",()=>{
  const payload={confirmed:true,action:"REJECT",note:"no",expectedUpdatedAt:"2026-10-17T00:00:00.000Z"};
  expect(tpoRequestDecisionSchema.safeParse(payload).success).toBe(false);
  expect(tpoRequestDecisionSchema.safeParse({...payload,note:"Not eligible"}).success).toBe(true);
 });
});

describe("TPO-requests-verification-04 learner notification",()=>{
 it("links a confirmed approval to learner support history",()=>{
  expect(learnerPlacementRequestDecisionNotice("APPROVE","Approved after review")).toEqual({
   title:"Your request was answered",
   body:"Your request was approved. Approved after review",
   actionHref:"/learn/my-placements/support",
  });
 });
 it("includes a rejection reason but avoids trailing whitespace",()=>{
  expect(learnerPlacementRequestDecisionNotice("REJECT","Proof missing or unclear").body).toBe(
   "Your request was rejected. Proof missing or unclear");
  expect(learnerPlacementRequestDecisionNotice("APPROVE",null).body).toBe(
   "Your request was approved.");
 });
});
