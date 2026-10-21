import { z } from "zod";
import { hrDriveDraftSchema, emptyHrDriveDraft } from "./hr-drive-draft-model";

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

/** Exactly one request per authorized college, even when a legacy plan-group
 * shared the form. Autoapproval means DRAFT, never a published live job.
 */
export function legacyRecruiterDriveStatus(input:{
 lifecycleStatus:string|null|undefined; approvalRequired:boolean;trusted:boolean;
 verificationPending:boolean;
}):"REQUEST"|"SENT_BACK"|"DRAFT"|"REJECTED"|"CANCELLED" {
 const status=input.lifecycleStatus?.trim().toUpperCase();
 if(status==="SENT_BACK"||status==="REJECTED"||status==="CANCELLED")return status;
 if(status==="REQUEST"||status==="PENDING")return "REQUEST";
 if(status==="DRAFT"||status==="APPROVED")return "DRAFT";
 return initialRecruiterRequestStatus(input);
}
export const RECRUITER_DRIVE_FORM_REQUIRED_ERROR="A drive form is required";

/** Only migrate fields that have an unambiguous HR draft representation.
 * Company/college ownership, season IDs, student eligibility, compensation
 * components and unsupported round modes require an authorized manual mapping
 * before a draft can be submitted; never guess these from the old JSON.
 */
export function recruiterDraftFromLegacyForm(raw:unknown):
 {ok:true;draft:z.infer<typeof hrDriveDraftSchema>;unmappedFields:readonly string[]}|
 {ok:false;reason:string;unmappedFields:readonly string[]} {
 if(!raw||typeof raw!=="object"||Array.isArray(raw))
  return {ok:false,reason:RECRUITER_DRIVE_FORM_REQUIRED_ERROR,unmappedFields:[]};
 const form=raw as Record<string,unknown>;
 const unmapped=["companyName","companyId","companyLogo","jdUrl","hostCollegeName",
  "reportingAt","travelNote","requiresExternalRegistration","externalPortalName",
  "externalPortalUrl","wantedSkills","category","categoryOverrideReason","roleOptions",
  "eligibility","applicationDeadline","seasonId","recordedOutside","notifyApplicants"]
  .filter(field=>form[field]!==undefined&&form[field]!==null);
 const base=emptyHrDriveDraft();
 const employmentType=form.jobType==="Internship"?"INTERNSHIP":
   form.jobType==="Internship + full-time"?"INTERNSHIP_FULL_TIME":
   form.jobType==="Contract"?"CONTRACT":"FULL_TIME";
 const roundKinds=["TALK","TEST","VENDOR_TEST","GD","INTERVIEW"] as const;
 const rounds=Array.isArray(form.rounds)?
  form.rounds.flatMap(item=>{
   if(!item||typeof item!=="object")return [];
   const fields=item as Record<string,unknown>;
   const kind=typeof fields.kind==="string"?fields.kind.toUpperCase():"";
   const name=typeof fields.name==="string"?fields.name.trim():"";
   return roundKinds.some(v=>v===kind)&&name.length>=2
    ? [{kind:kind as typeof roundKinds[number],name}]:[];
  }):base.rounds;
 const candidate={
  ...base,
  title:typeof form.jobTitle==="string"?form.jobTitle:"",
  description:typeof form.jobDescription==="string"?form.jobDescription:"",
  location:typeof form.location==="string"?form.location:"",
  employmentType,
  driveMode:form.driveMode==="OFF_CAMPUS"?"OFF_CAMPUS" as const:"ON_CAMPUS" as const,
  externalApplicationUrl:typeof form.externalApplyUrl==="string"?form.externalApplyUrl:"",
  rounds,
 };
 const parsed=hrDriveDraftSchema.safeParse(candidate);
 if(!parsed.success)return {ok:false,reason:"Legacy drive terms need review before requesting a drive.",
  unmappedFields};
 if(unmapped.length)return {ok:false,reason:"Legacy company, eligibility or schedule fields need an authorized migration.",
  unmappedFields};
 return {ok:true,draft:parsed.data,unmappedFields};
}
