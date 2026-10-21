/** Legacy audit and bell copy adapters. Legacy numeric IDs are never URLs or
 * permission grants; callers must resolve current tenant-scoped UUIDs first. */
export type LegacyBellCategory="COURSE"|"GENERAL"|"JOB"|"SYSTEM";
const actions:Readonly<Record<string,{module:"PLATFORM"|"IDENTITY"|"ACADEMICS"|"COURSES"|"PROJECTS"|"PLACEMENTS";type:string;label:string}>>={
 LOGIN:{module:"IDENTITY",type:"identity.login",label:"Signed in"},
 COURSE_CREATED:{module:"COURSES",type:"courses.course.created",label:"Course created"},
 COURSE_UPDATED:{module:"COURSES",type:"courses.course.updated",label:"Course updated"},
 PROJECT_CREATED:{module:"PROJECTS",type:"projects.workspace.created",label:"Project created"},
 PROJECT_UPDATED:{module:"PROJECTS",type:"projects.workspace.updated",label:"Project updated"},
 PROJECT_MEMBER_ADDED:{module:"PROJECTS",type:"projects.members.added",label:"Team member added"},
 JOB_CREATED:{module:"PLACEMENTS",type:"placements.job.created",label:"Job posted"},
 JOB_UPDATED:{module:"PLACEMENTS",type:"placements.job.updated",label:"Job updated"},
};
export function mapLegacyActionKey(raw:unknown){
 const original=typeof raw==="string"?raw.trim().slice(0,120):"";
 const action=actions[original.toUpperCase()];
 return action?{...action,original,unmapped:false}
  :{module:"PLATFORM" as const,type:"platform.legacy.unmapped",
    label:"Recorded activity",original,unmapped:true};
}
export function safeLegacyActorName(name:string|null,system:boolean){
 return name?.trim().slice(0,160)||(system?"System":"Former user");
}
export function safeLegacyTargetName(name:string|null,kind:string){
 return name?.trim().slice(0,160)||kind.replaceAll("_"," ").trim()||"Record";
}
export function legacyNotificationCategory(raw:string|null):LegacyBellCategory{
 const category=raw?.trim().toUpperCase();
 if(category==="COURSE"||category==="GENERAL"||category==="JOB")return category;
 return "SYSTEM";
}
export function legacyNotificationBody(raw:string|null){
 return raw?.trim()||"You have a new notification.";
}
export function legacyNotificationTitle(raw:string|null,context:string|null){
 return raw?.trim()||context?.trim()||"Notification";
}
/** Only complete already-authorized routes are accepted. No open redirects. */
export function safeLegacyActionHref(href:string|null){
 if(!href||!href.startsWith("/")||href.startsWith("//")||href.includes("\\")||
   /[\u0000-\u001f]/.test(href))return null;
 return href;
}
export function legacyNotificationReadAt(
 readAt:Date|null,wasRead:boolean|null,createdAt:Date,
){
 return readAt??(wasRead===true?createdAt:null);
}
/** Caller passes the source date wall clock as ISO w/o zone. Explicitly
 * require source-zone provenance rather than inferring from server timezone. */
export function legacyIndiaLocalToUtc(local:string,zone:string){
 if(zone!=="Asia/Kolkata"||!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/.test(local))
  return null;
 const instant=new Date(local+"+05:30");
 return Number.isFinite(instant.getTime())?instant:null;
}
export function compareLegacyAuditTime(
 a:{occurredAt:Date;id:string},b:{occurredAt:Date;id:string},
){return b.occurredAt.getTime()-a.occurredAt.getTime()||b.id.localeCompare(a.id);}
