import { z } from "zod";
export const tpoRequestDecisionSchema = z.object({
  confirmed: z.literal(true),
  action: z.enum(["APPROVE", "REJECT"]),
  note: z.string().trim().max(2000),
  expectedUpdatedAt: z.iso.datetime({ offset: true }),
}).strict().superRefine((value, context) => {
  if (value.action === "REJECT" && value.note.length < 3) {
    context.addIssue({ code: "custom", path: ["note"], message: "Rejection requires a reason" });
  }
});
export function requestDecisionLabel(action: "APPROVE" | "REJECT", requestType: string) {
  return (action === "APPROVE" ? "Approve " : "Reject ") + requestType.replaceAll("_", " ").toLowerCase();
}

/** TPO-requests-verification-02/-03: legacy decision wording and reason chips. */
export const TPO_REJECTION_REASONS = [
  "Not eligible",
  "Proof missing or unclear",
  "Deadline has passed",
  "Policy does not allow it",
  "Duplicate request",
  "Other",
] as const;
export const TPO_REQUEST_DECISION_COPY = {
  rejectTitle: "Reject this request",
  rejectHelp: "The student sees your reason. Pick one, or choose Other to write your own.",
  approved: "Approved. The student has been told.",
  rejected: "Rejected. The student has been told, with your reason.",
  approving: "Approving…",
  rejecting: "Rejecting…",
  error: "Could not save the decision",
} as const;
export function tpoRequestApprovalCopy(requestType:string){
 const kind=requestType==="APPLICATION_WITHDRAWAL"?"withdrawal":
  requestType==="ROUND_RESCHEDULE"?"reschedule":
  requestType==="OFFER_EXTENSION"?"offer extension":"request";
 const consequence=requestType==="APPLICATION_WITHDRAWAL"?
  "Each student leaves the drive; their application is withdrawn.":
  requestType==="OFFER_EXTENSION"?
  "Each student gets the extra time they asked for on their offer.":
  "The student's round is rescheduled as requested.";
 return {title:"Approve this "+kind+"?",help:consequence+" The student is told."};
}
