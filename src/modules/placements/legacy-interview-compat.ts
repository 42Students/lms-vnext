import {z} from "zod";
import {collegeInterviewActionSchema} from "./college-interview-action-model";

/** Legacy InterviewController mapping to the college-scoped placements model.
 * Historical integer IDs MUST be resolved under the acting college before
 * this adapter runs; never identify a tenant from supplied legacy IDs. */
export function mapLegacyInterviewLocation(mode:"ONLINE"|"OFFLINE",location:string){
 const value=location.trim();
 if(mode==="ONLINE"){
  const parsed=z.url().safeParse(value);
  if(!parsed.success||!/^https:\/\//i.test(value))
   throw new Error("Please enter the meeting link");
  return {mode:"VIRTUAL" as const,venue:null,meetingUrl:value};
 }
 if(value.length<2||value.length>500)
  throw new Error("Enter the interview location.");
 return {mode:"ON_CAMPUS" as const,venue:value,meetingUrl:null};
}

/** Old listing numbers are zero based with a variable size up to 500.
 * New 25-row pages remain bounded; callers walk the correct number of
 * authorized directory pages and slice exactly the requested legacy range. */
export function legacyInterviewPage(raw:{page?:unknown;size?:unknown;sort?:unknown}){
 const page=raw.page===undefined?0:Number(raw.page);
 const size=raw.size===undefined?20:Number(raw.size);
 if(!Number.isSafeInteger(page)||page<0||page>100000||
    !Number.isSafeInteger(size)||size<1||size>500)
  throw new RangeError("Invalid interview page or size");
 const offset=page*size;
 if(offset>25000)throw new RangeError("Interview listing exceeds the directory window");
 const sort=raw.sort==="studentName"?"STUDENT":
  raw.sort==="createdAt"||raw.sort==="recent"?"RECENT":"UPCOMING";
 const firstInternalPage=Math.floor(offset/25)+1;
 const lastInternalPage=Math.floor((offset+size-1)/25)+1;
 return {legacyPage:page,size,sort,firstInternalPage,lastInternalPage,
  skipInFirstPage:offset%25,offset};
}

/** Legacy PATCH/PUT omitted fields remain unchanged. The native EDIT command
 * still validates the complete proposed appointment and its expectedVersion;
 * it never loses an update to a concurrent reschedule. */
const interviewFields=z.object({
 roundId:z.uuid(),applicationId:z.uuid(),scheduledAt:z.iso.datetime({offset:true}),
 durationMinutes:z.number().int().min(5).max(480),
 interviewType:z.enum(["SCREENING","TECHNICAL","HR","MANAGERIAL","FINAL"]).optional(),
 roundDescription:z.string().trim().min(10).max(500).optional(),
 mode:z.enum(["ON_CAMPUS","VIRTUAL"]),venue:z.string().trim().max(500).nullable(),
 meetingUrl:z.url().max(500).nullable(),interviewer:z.string().trim().max(255).nullable(),
}).strict();
export type CollegeInterviewFields=z.infer<typeof interviewFields>;
export function legacyInterviewPartialUpdate(
 interviewId:string,expectedVersion:number,
 existing:CollegeInterviewFields,
 edits:Partial<CollegeInterviewFields>,reason:string,
){
 const current=interviewFields.parse(existing);
 const merged=interviewFields.parse({...current,...edits});
 return collegeInterviewActionSchema.parse({
  action:"EDIT",confirmed:true,interviewId,expectedVersion,
  appointment:merged,reason:reason||"Updated appointment details",
 });
}

/** Keep learner note and candidate windows (both were independent in
 * legacy), but do not treat preferences as a booked slot or accepted change. */
export const legacyReschedulePreferences=z.object({
 reason:z.string().trim().min(3).max(500),
 note:z.string().trim().max(2000).nullable().optional(),
 preferredWindows:z.array(z.object({
  startsAt:z.iso.datetime({offset:true}),
  endsAt:z.iso.datetime({offset:true}),
 }).refine(x=>Date.parse(x.endsAt)>Date.parse(x.startsAt),
  "End must be after start")).max(5).default([]),
 cancelRequested:z.boolean().default(false),
}).strict();

/** Match distinct legacy 404/409/429 and action receipts in accessible UI. */
export const legacyInterviewFeedback={
 updated:"Interview updated successfully",
 cancelled:"Interview cancelled successfully",
 feedbackSubmitted:"Feedback submitted successfully",
 rescheduleCancelled:"Reschedule request cancelled successfully",
 rateLimited:"Please wait before trying again",
 scopeMissing:"Organization or college ID not found in authenticated context",
 notFound:"Interview not found",
 stale:"Interview has changed. Reload before trying again.",
 approved:"Your interview reschedule was approved",
 rejected:"Your interview reschedule request was rejected",
} as const;
export function legacyInterviewFailure(code:string){
 switch(code){
  case "PLACEMENT_ROUND_STALE":case "PLACEMENT_INTERVIEW_STALE":
   return {status:409,message:legacyInterviewFeedback.stale};
  case "PLACEMENT_ROUND_NOT_FOUND":case "PLACEMENT_INTERVIEW_NOT_FOUND":
   return {status:404,message:legacyInterviewFeedback.notFound};
  case "PLACEMENT_RATE_LIMITED":
   return {status:429,message:legacyInterviewFeedback.rateLimited};
  case "PLACEMENT_COLLEGE_SCOPE_REQUIRED":
   return {status:403,message:legacyInterviewFeedback.scopeMissing};
  default:return {status:400,message:"Unable to update the interview"};
 }
}

/** Every mutating transition should log one activity and one in-app
 * notification; external SMS/mail are optional provider-bound side effects
 * and MUST NOT be duplicated by a retry. */
export const legacyInterviewTransitions={
 SCHEDULE:{audit:"PLACEMENTS_COLLEGE_INTERVIEW_SCHEDULED",notice:"Interview scheduled"},
 EDIT:{audit:"PLACEMENTS_COLLEGE_INTERVIEW_UPDATED",notice:legacyInterviewFeedback.updated},
 CANCEL:{audit:"PLACEMENTS_COLLEGE_INTERVIEW_CANCELLED",notice:legacyInterviewFeedback.cancelled},
 COMPLETE:{audit:"PLACEMENTS_COLLEGE_INTERVIEW_COMPLETED",notice:"Interview completed"},
 NO_SHOW:{audit:"PLACEMENTS_COLLEGE_INTERVIEW_NO_SHOW",notice:"Interview marked no-show"},
 FEEDBACK:{audit:"PLACEMENTS_COLLEGE_INTERVIEW_FEEDBACK",notice:legacyInterviewFeedback.feedbackSubmitted},
 RESCHEDULE:{audit:"PLACEMENTS_INTERVIEW_RESCHEDULE_REQUESTED",notice:"Interview reschedule requested"},
} as const;

/** Database instants are UTC; display the learner Upcoming tab in IST.
 * Never filter using local server midnight, which changes outside India. */
export function upcomingInterviewInIst(start:Date,now:Date){
 return Number.isFinite(start.getTime())&&start.getTime()>now.getTime();
}
export function interviewIstLabel(date:Date){
 return new Intl.DateTimeFormat("en-IN",{timeZone:"Asia/Kolkata",dateStyle:"medium",timeStyle:"short"})
  .format(date);
}
/** Global overlap defaults to sixty only when no verified policy exists.
 * Explicit zero is allowed by policy; never coerce 0 to the default. */
export function resolveInterviewOverlapWindow(policyMinutes:number|null|undefined){
 if(policyMinutes==null)return 60;
 if(!Number.isInteger(policyMinutes)||policyMinutes<0||policyMinutes>240)
  throw new RangeError("Invalid interview overlap policy");
 return policyMinutes;
}
