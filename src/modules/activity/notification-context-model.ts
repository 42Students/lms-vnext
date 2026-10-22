import {safeNotificationActionHref,safeExternalAssessmentUrl} from "./notification-action";

/** Legacy course/drive/assessment labels projected onto the membership-scoped inbox. */
type Context={module:string;metadata?:unknown;actionHref?:string|null};
const field=(m:Record<string,unknown>,key:string)=>{
 const value=m[key];
 return typeof value==="string"?value.trim():"";
};
export function notificationContextPresentation(row:Context){
 const metadata=row.metadata!==null&&typeof row.metadata==="object"&&!Array.isArray(row.metadata)
  ?row.metadata as Record<string,unknown>:{};
 const course=field(metadata,"courseName")||field(metadata,"courseTitle");
 const job=field(metadata,"jobTitle")||field(metadata,"driveName");
 const round=field(metadata,"roundName")||field(metadata,"interviewRound");
 const kind=(row.module+" "+field(metadata,"type")).toUpperCase();
 const assessment=/ASSESSMENT|QUIZ|EXAM/.test(kind);
 const interview=/INTERVIEW/.test(kind)||Boolean(round);
 const placement=/PLACEMENT|DRIVE|JOB/.test(kind)||Boolean(job);
 const contextLine=course?"Course · "+course:job?"Placement · "+job:
  round?"Interview · "+round:row.module.replaceAll("_"," ");
 const actionHref=safeNotificationActionHref(row.actionHref);
 const actionLabel=assessment?"Take Assessment":interview?"View Interview":
  placement?"View in My Applications":course?"View Course":"View";
 const rawExternal=metadata["assessmentUrl"]??metadata["externalAssessmentUrl"];
 const external=typeof rawExternal==="string"?safeExternalAssessmentUrl(rawExternal):null;
 return {contextLine,actionHref,actionLabel,
  externalCta:external?.startsWith("https:")?{label:"Take Assessment",href:external}:null};
}
/** Distinguishes transport/auth problems from an empty successful feed. */
export function notificationFeedFailure(status:number|null){
 if(status===401)return "Your session has ended. Sign in again to view notifications.";
 if(status===403)return "You do not have access to this notification feed.";
 if(status===400)return "The notification link is invalid. Return to the newest notifications.";
 if(status===429)return "Too many notification requests. Retry after a short interval.";
 return "Couldn't load notifications. Retry to request the latest updates.";
}
