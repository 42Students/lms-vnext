/** Old LMS learner tabs classify notification_type before module fallback.
 * Legacy course_id is an integer, whereas vNext courseId is a UUID; presence,
 * not a numeric conversion, determines the Course tab. */
export const learnerNotificationCategories = [
  {key:"all",label:"All"},
  {key:"course",label:"Course"},
  {key:"project",label:"Projects"},
  {key:"general",label:"Announcements"},
  {key:"job",label:"Job"},
] as const;

export type LearnerNotificationCategory =
 (typeof learnerNotificationCategories)[number]["key"];
export type LearnerCategorizedNotification={
 module:string;source?:"ANNOUNCEMENT";
 notification_type?:string|null;notificationType?:string|null;
 course_id?:string|number|null;courseId?:string|number|null;
};
export function learnerNotificationCategory(item:LearnerCategorizedNotification):
 Exclude<LearnerNotificationCategory,"all">{
 const type=(item.notification_type??item.notificationType??"").toUpperCase();
 if(type==="JOB")return "job";
 if(type==="COURSE"||
    (typeof item.course_id==="number"?item.course_id>0:Boolean(item.course_id))||
    (typeof item.courseId==="number"?item.courseId>0:Boolean(item.courseId)))return "course";
 if(type==="PROJECT")return "project";
 if(type==="SYSTEM"||item.source==="ANNOUNCEMENT")return "general";
 switch(item.module.toUpperCase()){
  case "COURSE":case "COURSES":return "course";
  case "PROJECT":case "PROJECTS":return "project";
  case "JOB":case "JOBS":case "PLACEMENT":case "PLACEMENTS":return "job";
  default:return "general";
 }
}
export function learnerNotificationCategoryCounts(
 items:readonly LearnerCategorizedNotification[],
){
 const counts:Record<LearnerNotificationCategory,number>={
  all:items.length,course:0,project:0,general:0,job:0,
 };
 for(const item of items)counts[learnerNotificationCategory(item)]++;
 return counts;
}
