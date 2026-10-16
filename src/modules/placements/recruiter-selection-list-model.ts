import {z} from "zod";
/** REC-home-drives-51: typed selection proposal. This is NOT a live send route
 * until a registered tenant-scoped proposal and review table exists. */
export const recruiterSelectionListInputSchema=z.strictObject({
 jobId:z.string().uuid(),collegeId:z.string().uuid(),
 submissionId:z.string().uuid(),
 kind:z.enum(["OFFER","LETTER_OF_INTENT"]),
 ctcLpa:z.string().regex(/^(?:|\d{1,3}(?:\.\d{1,2})?)$/),
 packageDescription:z.string().trim().max(500).default(""),
 applicationIds:z.array(z.string().uuid()).min(1).max(200),
 acknowledgedCtcWarning:z.boolean().default(false),
}).superRefine((value,ctx)=>{
 if(new Set(value.applicationIds).size!==value.applicationIds.length)
  ctx.addIssue({code:"custom",path:["applicationIds"],message:"Select each applicant only once"});
});
export function recruiterSelectionRangeWarning(ctcLpa:string,jobMinInr:number|null,
 jobMaxInr:number|null):string|null{
 if(!ctcLpa)return null;
 const chosen=Number(ctcLpa)*100000;
 if(!Number.isFinite(chosen)||chosen<=0)return "Enter a valid CTC LPA";
 if(jobMinInr!==null&&chosen<jobMinInr ||
    jobMaxInr!==null&&chosen>jobMaxInr)
  return "The CTC is outside the stated drive range. Confirm the amount before sending.";
 return null;
}
export const RECRUITER_SELECTION_STAGES=[
 "SENT_FOR_VERIFICATION","SENT_BACK","VERIFIED","DECLINED","WITHDRAWN"
] as const;
