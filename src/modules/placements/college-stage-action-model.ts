import {driveApplicationsQuerySchema} from "./college-drive-applications-model";
import {z} from "zod";
export const COLLEGE_APPLICATION_STAGES=[
 "APPLIED","SHORTLISTED","ASSESSMENT","INTERVIEW","WAITLISTED","OFFERED","HIRED","REJECTED",
] as const;
export const collegeStageCommandSchema=z.object({
 action:z.enum(["MOVE","REINSTATE","CORRECT"]),
 applicationIds:z.array(z.string().uuid()).max(100).default([]).refine(ids=>new Set(ids).size===ids.length,
  "Duplicate applications are not allowed"),
 matchingFilter:driveApplicationsQuerySchema.optional(),
 stage:z.enum(COLLEGE_APPLICATION_STAGES).optional(),
 reason:z.string().trim().min(3).max(1000),
 notifyByEmail:z.boolean().default(false),
 confirmed:z.literal(true),
}).strict().superRefine((v,ctx)=>{
 if((v.matchingFilter && v.applicationIds.length) || (!v.matchingFilter && v.applicationIds.length===0))
  ctx.addIssue({code:"custom",path:["applicationIds"],message:"Select page applicants or all matching applicants, not both"});
 if(v.action!=="REINSTATE"&&!v.stage)ctx.addIssue({code:"custom",path:["stage"],message:"Choose a new application stage"});
 if(v.action==="CORRECT"&&v.reason.trim().length<10)
  ctx.addIssue({code:"custom",path:["reason"],message:"Explain the exceptional correction in at least 10 characters"});
 if(v.action==="REINSTATE"&&v.stage)ctx.addIssue({code:"custom",path:["stage"],message:"Reinstate uses the previous stage"});
});
export type CollegeStageCommand=z.infer<typeof collegeStageCommandSchema>;

/** The old LMS offers corrective backward moves. A transition appearing here
 * does NOT bypass offer/recruiter/learner constraints: the transactional writer
 * verifies external offer and joining facts before accepting any rollback. */
export const COLLEGE_APPLICATION_TRANSITIONS: Record<string,readonly string[]>={
 APPLIED:["SHORTLISTED","REJECTED"],
 SHORTLISTED:["ASSESSMENT","INTERVIEW","WAITLISTED","REJECTED"],
 ASSESSMENT:["SHORTLISTED","INTERVIEW","WAITLISTED","REJECTED"],
 INTERVIEW:["SHORTLISTED","ASSESSMENT","WAITLISTED","OFFERED","REJECTED"],
 WAITLISTED:["SHORTLISTED","ASSESSMENT","INTERVIEW","OFFERED","REJECTED"],
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
