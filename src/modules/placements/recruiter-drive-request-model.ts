import { z } from "zod";
import { hrDriveDraftSchema } from "./hr-drive-draft-model";

/** Recruiter submission contract, not the existing discussion-message endpoint. */
export const recruiterDriveRequestInputSchema = z.strictObject({
 collegeId:z.string().uuid(),
 submissionId:z.string().uuid(),
 sourceJobId:z.string().uuid().optional(),
 draft:hrDriveDraftSchema,
});
export type RecruiterDriveRequestInput=z.infer<typeof recruiterDriveRequestInputSchema>;
export const RECRUITER_REQUEST_STATUSES=[
 "REQUEST","SENT_BACK","DRAFT","REJECTED","CANCELLED",
] as const;
export type RecruiterRequestStatus=(typeof RECRUITER_REQUEST_STATUSES)[number];
/** Approval is separate from publishing: auto-approved requests become draft jobs. */
export function initialRecruiterRequestStatus(policy:{
 trusted:boolean; approvalRequired:boolean; verificationPending:boolean;
}):"REQUEST"|"DRAFT"{
 return !policy.verificationPending&&(policy.trusted||!policy.approvalRequired)
   ? "DRAFT":"REQUEST";
}
export function canRecruiterResubmit(status:RecruiterRequestStatus){
 return status==="REQUEST" || status==="SENT_BACK";
}
export function recruiterRequestStage(status:RecruiterRequestStatus):"WAITING"|"CLOSED"{
 return status==="REJECTED"||status==="CANCELLED"?"CLOSED":"WAITING";
}
export function recruiterRequestLegacyLabel(status:RecruiterRequestStatus){
 return status==="REJECTED"||status==="CANCELLED"?"Cancelled":
  status==="DRAFT"?"Approved — awaiting publication":"Sent for review";
}

/** Optimistic request edit token and real 0101 REQUEST/SENT_BACK transitions. */
export const recruiterRequestUpdateSchema=z.strictObject({
 requestId:z.string().uuid(),
 collegeId:z.string().uuid(),
 action:z.enum(["EDIT","RESUBMIT","CANCEL"]),
 expectedUpdatedAt:z.iso.datetime({offset:true}),
 draft:hrDriveDraftSchema.optional(),
}).superRefine((input,ctx)=>{
 // A cancellation records a decision on the original request; it must not
 // silently replace its terms in the same write.
 if(input.action==="CANCEL"&&input.draft!==undefined)
  ctx.addIssue({code:"custom",path:["draft"],
   message:"Cancellation cannot change drive request details"});
 if(input.action!=="CANCEL"&&input.draft===undefined)
  ctx.addIssue({code:"custom",path:["draft"],
   message:"Updated drive request details are required"});
});
