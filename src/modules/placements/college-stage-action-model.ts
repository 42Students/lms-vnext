import {driveApplicationsQuerySchema} from "./college-drive-applications-model";
import {z} from "zod";
export const COLLEGE_APPLICATION_STAGES=[
 "APPLIED","SHORTLISTED","ASSESSMENT","INTERVIEW","WAITLISTED","OFFERED","HIRED","REJECTED",
] as const;
export const collegeStageCommandSchema=z.object({
 action:z.preprocess(value=>typeof value==="string"?value.trim().toUpperCase():value,
  z.enum(["MOVE","REINSTATE","CORRECT"])),
 // Legacy integer application IDs require an explicit import crosswalk.
 // Never coerce arbitrary numbers to another college\'s UUID.
 applicationIds:z.array(z.string().uuid()).max(100).default([]).refine(ids=>new Set(ids).size===ids.length,
  "Duplicate applications are not allowed"),
 matchingFilter:driveApplicationsQuerySchema.optional(),
 stage:z.preprocess(value=>typeof value==="string"?value.trim().toUpperCase():value,
  z.enum(COLLEGE_APPLICATION_STAGES)).optional(),
 // Freeform reasons are optional for ordinary legacy transitions;
  // the persistence layer records a transparent audit fallback.
  reason:z.string().trim().max(1000).default(""),
 notifyByEmail:z.boolean().default(false),
 // Legacy notifyStudent is distinct from optional email delivery. A false
 // value suppresses the transactional in-app notice, not the audit event.
 notifyLearnerInApp:z.boolean().default(true),
 // Only a deliberate Move to Assessment may attach a real HTTPS link.
 assessmentUrl:z.string().trim().url().max(2048)
  .refine(url=>{
    try{const parsed=new URL(url);return (parsed.protocol==="http:"||parsed.protocol==="https:")&&
      Boolean(parsed.hostname)&&!parsed.username&&!parsed.password;}catch{return false;}
   },"Must be a valid URL starting with http:// or https://")
  .optional(),
 saveAssessmentUrlToJob:z.boolean().default(false),
 confirmed:z.literal(true),
}).strict().superRefine((v,ctx)=>{
 if((v.matchingFilter && v.applicationIds.length) || (!v.matchingFilter && v.applicationIds.length===0))
  ctx.addIssue({code:"custom",path:["applicationIds"],message:"Select page applicants or all matching applicants, not both"});
 if(v.action!=="REINSTATE"&&!v.stage)ctx.addIssue({code:"custom",path:["stage"],message:"Choose a new application stage"});
 if(v.stage==="REJECTED"&&v.reason.length>500)
   ctx.addIssue({code:"custom",path:["reason"],message:"Reason must be 500 characters or fewer"});
  if(v.action==="CORRECT"&&v.reason.trim().length<10)
  ctx.addIssue({code:"custom",path:["reason"],message:"Explain the exceptional correction in at least 10 characters"});
 if(v.action==="REINSTATE"&&v.stage)ctx.addIssue({code:"custom",path:["stage"],message:"Reinstate uses the previous stage"});
 if((v.assessmentUrl!==undefined||v.saveAssessmentUrlToJob) &&
    (v.action!=="MOVE"||v.stage!=="ASSESSMENT"))
  ctx.addIssue({code:"custom",path:["assessmentUrl"],
   message:"Assessment links can be set only while moving to Assessment."});
 if(v.saveAssessmentUrlToJob&&!v.assessmentUrl)
  ctx.addIssue({code:"custom",path:["saveAssessmentUrlToJob"],
   message:"Enter an assessment URL before saving it to the job."});
});
export type CollegeStageCommand=z.infer<typeof collegeStageCommandSchema>;

/** The old LMS offers corrective backward moves. A transition appearing here
 * does NOT bypass offer/recruiter/learner constraints: the transactional writer
 * verifies external offer and joining facts before accepting any rollback. */
export const COLLEGE_APPLICATION_TRANSITIONS: Record<string,readonly string[]>={
 APPLIED:["SHORTLISTED","REJECTED"],
 SHORTLISTED:["ASSESSMENT","INTERVIEW","REJECTED","WAITLISTED"],
 ASSESSMENT:["SHORTLISTED","INTERVIEW","WAITLISTED","REJECTED"],
 INTERVIEW:["SHORTLISTED","ASSESSMENT","OFFERED","WAITLISTED","REJECTED"],
 WAITLISTED:["OFFERED","REJECTED","SHORTLISTED","ASSESSMENT","INTERVIEW"],
 OFFERED:["INTERVIEW","HIRED","REJECTED"],
 HIRED:["OFFERED"], REJECTED:[],
};
/** The legacy JobApplication.status is one lifecycle column; vNext explicitly
 * separates an application submission, manual screening, college pipeline
 * history, real offer state, and verified joining outcome. These values must
 * never be backfilled by guessing an offer from a college stage. */
export const LEGACY_APPLICATION_STAGE_SOURCE={
 APPLIED:"placement_applications.status + college_stage_history",
 SHORTLISTED:"placement_application_screenings + college_stage_history",
 ASSESSMENT:"placement_college_application_stages + stage_history",
 INTERVIEW:"placement_college_application_stages + actual round slots",
 WAITLISTED:"placement_college_application_stages + waitlist promotions",
 OFFERED:"placement_offers + college_stage_history",
 HIRED:"placement_joining_outcomes + college_stage_history",
 REJECTED:"placement_application_screenings + college_stage_history",
 WITHDRAWN:"placement_applications.status + withdrawal history",
} as const;

/** Exceptional staff-only corrections to the presentation stage. These do not
 * silently rewrite the screened decision, offer or verified joining record. */
export const COLLEGE_APPLICATION_CORRECTIONS:Readonly<Record<string,readonly string[]>>={
 SHORTLISTED:["APPLIED"],
 ASSESSMENT:["APPLIED"],
 INTERVIEW:["APPLIED","ASSESSMENT"],
 HIRED:["OFFERED"],
};

/** Legacy next-status display order with explicit corrective-only options.
 * Unknown imported statuses cannot request transitions or manufacture a
 * same-stage success: the administrator must resolve the source mapping.
 * WITHDRAWN is a lifecycle action and never a pipeline dropdown option. */
export function collegeStageOptionsForLegacyStatus(raw:unknown){
 if(typeof raw!=="string")return {move:[] as string[],correct:[] as string[]};
 const status=raw.trim().toUpperCase();
 return {move:[...(COLLEGE_APPLICATION_TRANSITIONS[status]??[])],
  correct:[...(COLLEGE_APPLICATION_CORRECTIONS[status]??[])]};
}

/** Legacy Assessment bulk feedback must identify the destination and the
 * actual number moved; a partially applied batch is never called successful. */
export function collegeStageMoveFeedback(
 action:"MOVE"|"REINSTATE"|"CORRECT",stage:string,moved:number,skipped:number,
):{title:string;failurePrefix:string}{
 const assessment=action==="MOVE"&&stage==="ASSESSMENT";
 return {
  title:assessment
   ? moved+" application"+(moved===1?"":"s")+" moved to Assessment"+
     (skipped?" · "+skipped+" skipped":"")
   : skipped?moved+" updated, "+skipped+" skipped":"Application status updated",
  failurePrefix:assessment?"Failed to move to Assessment. ":"",
 };
}
