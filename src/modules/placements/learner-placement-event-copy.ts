/** LEARNER-placements-R04: bounded, internal, learner-facing placement notices.
 * Event kinds are persisted by their producing transaction, never synthesized on GET. */
export const learnerPlacementEventKinds=[
 "ROUND_SCHEDULED","ROUND_REMINDER","RESCHEDULE_DECIDED","OFFER_RELEASED",
 "OFFER_EXPIRING","OFFER_EXPIRED","OFFER_WITHDRAWN","OFFER_ACCEPTED_REPORTED",
 "ACCEPTANCE_REVERSED","DEADLINE_TODAY","DRIVE_PUBLISHED","DRIVE_UPDATED",
 "DRIVE_CANCELLED","DRIVE_CLOSED","DRIVE_REMIND_NOT_APPLIED","APPLICATION_STATUS_CHANGED",
 "APPLIED_ON_BEHALF","NOW_INELIGIBLE","REQUEST_DECIDED","MARKED_ABSENT",
 "DEBARRED","REGISTRATION_OPEN","REGISTRATION_REMINDER","NUDGE",
 "PREP_ASSIGNED","PROFILE_VERIFIED","PROFILE_SENT_BACK","PLACEMENT_ANNOUNCEMENT",
] as const;
export type LearnerPlacementEventKind=typeof learnerPlacementEventKinds[number];
const titles:Record<LearnerPlacementEventKind,string>={
 ROUND_SCHEDULED:"Placement round scheduled",ROUND_REMINDER:"Placement round reminder",
 RESCHEDULE_DECIDED:"Reschedule request updated",OFFER_RELEASED:"Placement offer received",
 OFFER_EXPIRING:"Placement offer deadline approaching",OFFER_EXPIRED:"Placement offer expired",
 OFFER_WITHDRAWN:"Placement offer withdrawn",OFFER_ACCEPTED_REPORTED:"Offer acceptance reported",
 ACCEPTANCE_REVERSED:"Offer acceptance corrected",DEADLINE_TODAY:"Application deadline today",
 DRIVE_PUBLISHED:"New placement drive",DRIVE_UPDATED:"Placement drive updated",
 DRIVE_CANCELLED:"Placement drive cancelled",DRIVE_CLOSED:"Placement drive closed",
 DRIVE_REMIND_NOT_APPLIED:"Placement application reminder",
 APPLICATION_STATUS_CHANGED:"Application status updated",APPLIED_ON_BEHALF:"Application added by placement cell",
 NOW_INELIGIBLE:"Placement eligibility changed",REQUEST_DECIDED:"Placement request reviewed",
 MARKED_ABSENT:"Marked absent for a placement round",DEBARRED:"Placement participation restricted",
 REGISTRATION_OPEN:"Placement registration is open",REGISTRATION_REMINDER:"Placement registration reminder",
 NUDGE:"Placement team reminder",PREP_ASSIGNED:"Placement preparation assigned",
 PROFILE_VERIFIED:"Placement profile verified",PROFILE_SENT_BACK:"Placement profile needs changes",
 PLACEMENT_ANNOUNCEMENT:"Placement announcement",
};
const routes:Record<LearnerPlacementEventKind,string>={
 ROUND_SCHEDULED:"/learn/my-placements/schedule",ROUND_REMINDER:"/learn/my-placements/schedule",
 RESCHEDULE_DECIDED:"/learn/my-placements/placement#requests",OFFER_RELEASED:"/learn/my-placements/offers",
 OFFER_EXPIRING:"/learn/my-placements/offers",OFFER_EXPIRED:"/learn/my-placements/offers",
 OFFER_WITHDRAWN:"/learn/my-placements/offers",OFFER_ACCEPTED_REPORTED:"/learn/my-placements/offers",
 ACCEPTANCE_REVERSED:"/learn/my-placements/offers",DEADLINE_TODAY:"/learn/my-placements/jobs",
 DRIVE_PUBLISHED:"/learn/my-placements/jobs",DRIVE_UPDATED:"/learn/my-placements/jobs",
 DRIVE_CANCELLED:"/learn/my-placements/jobs",DRIVE_CLOSED:"/learn/my-placements/jobs",
 DRIVE_REMIND_NOT_APPLIED:"/learn/my-placements/jobs",
 APPLICATION_STATUS_CHANGED:"/learn/my-placements/applications",
 APPLIED_ON_BEHALF:"/learn/my-placements/applications",NOW_INELIGIBLE:"/learn/my-placements/rules",
 REQUEST_DECIDED:"/learn/my-placements/placement#requests",MARKED_ABSENT:"/learn/my-placements/schedule",
 DEBARRED:"/learn/my-placements",REGISTRATION_OPEN:"/learn/my-placements/placement#registration",
 REGISTRATION_REMINDER:"/learn/my-placements/placement#registration",
 NUDGE:"/learn/my-placements",PREP_ASSIGNED:"/learn/courses",PROFILE_VERIFIED:"/learn/profile",
 PROFILE_SENT_BACK:"/learn/profile",PLACEMENT_ANNOUNCEMENT:"/learn/my-placements/announcements",
};
/** Optional transaction-authored context only; never trust these fields from a browser.
 * Persisting producers must authorize the application before setting any URL. */
export type LearnerPlacementEventContext={
 learnerName?:string;jobTitle?:string;companyName?:string;status?:string;
 applicationId?:string;jobId?:string;assessmentUrl?:string;
 interviewVenue?:string;rejectionReason?:string;
};
const applicationStatusTitles:Record<string,string>={
 INTERVIEW:"Interview scheduled",REJECTED:"Application rejected",
 SHORTLISTED:"Application shortlisted",ASSESSMENT:"Assessment invitation",
 OFFERED:"Placement offer extended",HIRED:"Placement hiring confirmed",
 WAITLISTED:"Application waitlisted",
};
function cleanEventDetail(value:string|undefined,max=120){
 return (value??"").replace(/[\\r\\n\\u0000-\\u001f]/g," ").trim().slice(0,max);
}
function safeAssessmentUrl(value:string|undefined){
 if(!value)return null;
 try{
  const url=new URL(value);
  return url.protocol==="https:"&&!url.username&&!url.password&&!url.hash&&url.hostname?url.href:null;
 }catch{return null;}
}
export function learnerPlacementEventCopy(
 kind:LearnerPlacementEventKind,subject:string,context: LearnerPlacementEventContext={},
){
 const safeSubject=cleanEventDetail(subject,150);
 const status=cleanEventDetail(context.status,32).toUpperCase();
 const title=kind==="APPLICATION_STATUS_CHANGED"?(applicationStatusTitles[status]??titles[kind]):titles[kind];
 const named=[cleanEventDetail(context.jobTitle),cleanEventDetail(context.companyName)]
  .filter(Boolean).join(" at ");
 const detail=named||safeSubject;
 const extra=kind==="APPLICATION_STATUS_CHANGED"&&status==="REJECTED"
   ?cleanEventDetail(context.rejectionReason,150):
   kind==="ROUND_SCHEDULED"?cleanEventDetail(context.interviewVenue,150):"";
 const body=(detail?`${title}: ${detail}.`:`${title}. Open your placement workspace for details.`)+
   (extra?` ${extra}.`:"");
 const actionHref=routes[kind]; // Never send a recipient to an unverified external assessment URL.
 return {
  title,body,actionHref,
  metadata:{
   learnerName:cleanEventDetail(context.learnerName),
   jobTitle:cleanEventDetail(context.jobTitle),
   companyName:cleanEventDetail(context.companyName),
   applicationId:/^[0-9a-f]{8}-[0-9a-f-]{27,36}$/i.test(context.applicationId??"")?context.applicationId:null,
   jobId:/^[0-9a-f]{8}-[0-9a-f-]{27,36}$/i.test(context.jobId??"")?context.jobId:null,
   status:status||null,
   assessmentUrl:safeAssessmentUrl(context.assessmentUrl),
   interviewVenue:cleanEventDetail(context.interviewVenue),
   rejectionReason:cleanEventDetail(context.rejectionReason,150),
  },
 };
}
export function learnerPlacementEventUsesMatchingJobsPreference(kind:LearnerPlacementEventKind):boolean{
 return ["DRIVE_PUBLISHED","DRIVE_UPDATED","DRIVE_REMIND_NOT_APPLIED","DEADLINE_TODAY"].includes(kind);
}
