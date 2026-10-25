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
 ROUND_SCHEDULED:"Interview Round Scheduled",ROUND_REMINDER:"Interview reminder",
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
 /** Verified saved placement-request decision, never speculative UI state. */
 requestDecisionStatus?:"APPROVED"|"REJECTED"|undefined;requestDecisionNote?:string|undefined;
 appliedAt?:string|Date|null;statusUpdatedAt?:string|Date|null;
 interviewAt?:string|Date|null;interviewType?:string;interviewMode?:string;
 roundDescription?:string;contactMobile?:string;contactPhone?:string;
};
const applicationStatusTitles:Record<string,string>={
 INTERVIEW:"Interview Round Scheduled",REJECTED:"Application Update",
 SHORTLISTED:"Shortlisted",ASSESSMENT:"Online Assessment",
 OFFERED:"Offer Extended",HIRED:"You\u0027re Hired!",
 WAITLISTED:"Waitlisted",
};
function cleanEventDetail(value:string|undefined,max=120){
 return (value??"").replace(/[\r\n\u0000-\u001f]/g," ").replace(/\s+/g," ").trim().slice(0,max);
}
function safeAssessmentUrl(value:string|undefined){
 if(!value)return null;
 try{
  const url=new URL(value);
  return url.protocol==="https:"&&!url.username&&!url.password&&!url.hash&&url.hostname?url.href:null;
 }catch{return null;}
}
/** Legacy interview labels have a fixed vocabulary; custom rounds keep their label. */
export function learnerPlacementRoundName(raw:string|undefined):string{
 const name=cleanEventDetail(raw,80);
 if(!name)return "Interview";
 const standard:Record<string,string>={
  screening:"Screening Round",technical:"Technical Round",hr:"HR Round",
  managerial:"Managerial Round",final:"Final Round",
 };
 return standard[name.toLowerCase()]??name+" Round";
}
function eventDate(value:string|Date|null|undefined,withTime=false):string{
 if(!value)return "";
 const date=value instanceof Date?value:new Date(value);
 if(!Number.isFinite(date.getTime()))return "";
 const day=new Intl.DateTimeFormat("en-GB",{
  day:"2-digit",month:"short",year:"numeric",timeZone:"Asia/Kolkata",
 }).format(date);
 if(!withTime)return day;
 return day+" at "+new Intl.DateTimeFormat("en-US",{
  hour:"2-digit",minute:"2-digit",hour12:true,timeZone:"Asia/Kolkata",
 }).format(date);
}
const statusesThatNotify=new Set(["INTERVIEW","OFFERED","HIRED","ASSESSMENT",
 "REJECTED","SHORTLISTED","WAITLISTED"]);

export function learnerPlacementEventCopy(
 kind:LearnerPlacementEventKind,subject:string,context: LearnerPlacementEventContext={},
){
 const safeSubject=cleanEventDetail(subject,150);
 const status=cleanEventDetail(context.status,32).toUpperCase();
 if(!learnerPlacementEventKinds.includes(kind)||
    (kind==="APPLICATION_STATUS_CHANGED"&&status&&!statusesThatNotify.has(status))){
  throw new Error("Unsupported learner placement event status");
 }
 const title=kind==="APPLICATION_STATUS_CHANGED"?(applicationStatusTitles[status]??titles[kind]):titles[kind];
 const job=cleanEventDetail(context.jobTitle);
 const company=cleanEventDetail(context.companyName);
 const named=job&&company?job+" at "+company:job||company||safeSubject;
 const applicationDate=eventDate(context.appliedAt??context.statusUpdatedAt);
 const interviewDateTime=eventDate(context.interviewAt,true);
 const roundName=learnerPlacementRoundName(context.interviewType);
 const venue=cleanEventDetail(context.interviewVenue,200)||
  "Details to follow — check the portal closer to the date.";
 const rejectionReason=kind==="APPLICATION_STATUS_CHANGED"&&status==="REJECTED"
  ?cleanEventDetail(context.rejectionReason,150):"";
 const roundNotice=kind==="ROUND_SCHEDULED"||
   (kind==="APPLICATION_STATUS_CHANGED"&&status==="INTERVIEW");
 let body:string;
 if(kind==="APPLICATION_STATUS_CHANGED"){
  switch(status){
   case "SHORTLISTED":body="You have been shortlisted for "+named+". Check dashboard for next steps.";break;
   case "ASSESSMENT":body="You have been invited for the online assessment for "+named+
     ". Check My Applications for the assessment link.";break;
   case "REJECTED":body="Update regarding your application for "+named+"."+
     (rejectionReason?" Reason: "+rejectionReason+".":"");break;
   case "OFFERED":body="You've received an offer for "+named+". Check dashboard for details.";break;
   case "HIRED":body="Congratulations! You've been hired for "+named+".";break;
   case "WAITLISTED":body="Your application for "+named+
     " has been moved to the waitlist. Check dashboard for updates.";break;
   case "INTERVIEW":body=roundName+" for "+named+
     " has been scheduled. Check dashboard for details.";break;
   default:body="Your application for "+named+" has been updated.";
  }
 }else if((kind==="REQUEST_DECIDED"||kind==="RESCHEDULE_DECIDED")&&
   (context.requestDecisionStatus==="APPROVED"||context.requestDecisionStatus==="REJECTED")){
  const decision=context.requestDecisionStatus==="APPROVED"?"approved":"rejected";
  const category=kind==="RESCHEDULE_DECIDED"?"reschedule":"placement";
  const note=decision==="rejected"?cleanEventDetail(context.requestDecisionNote,350):"";
  body="Your "+category+" request was "+decision+" for "+named+"."+
    (note?" Reason: "+note+(note.endsWith(".")?"":"."):"");
 }else if(roundNotice){
  body=roundName+" for "+named+" has been scheduled. Check dashboard for details.";
 }else if(kind==="ROUND_REMINDER"&&interviewDateTime){
  body="Your interview for "+named+" is tomorrow – "+interviewDateTime+". Be on time!";
 }else{
  body=named?title+": "+named+".":title+". Open your placement workspace for details.";
 }
 if(roundNotice){
  body+=(interviewDateTime?" "+interviewDateTime+".":"")+
   " "+venue+(venue.endsWith(".")?"":".");
 }
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
   applicationDate,
   interviewDate:eventDate(context.interviewAt),
   interviewTime:context.interviewAt?eventDate(context.interviewAt,true).split(" at ").at(-1)??"": "",
   roundName:roundNotice?roundName:null,
   interviewVenue:roundNotice?venue:null,
   interviewMode:roundNotice?cleanEventDetail(context.interviewMode,30):null,
   roundDescription:roundNotice?cleanEventDetail(context.roundDescription,150):null,
   contactPhone:kind==="APPLICATION_STATUS_CHANGED"&&
    (status==="INTERVIEW"||status==="OFFERED")
     ?cleanEventDetail(context.contactMobile||context.contactPhone,30):null,
   rejectionReason:rejectionReason||null,
  },
 };
}
export function learnerPlacementEventUsesMatchingJobsPreference(kind:LearnerPlacementEventKind):boolean{
 return ["DRIVE_PUBLISHED","DRIVE_UPDATED","DRIVE_REMIND_NOT_APPLIED","DEADLINE_TODAY"].includes(kind);
}
