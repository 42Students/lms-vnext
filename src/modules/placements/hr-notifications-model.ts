import {z} from "zod";
export const hrNotificationsQuerySchema=z.strictObject({
  collegeId:z.string().uuid().optional(),unreadOnly:z.enum(["true","false"]).default("false"),
});
export const HR_NOTIFICATION_EVENTS=["placements.job.published","placements.job.closed"] as const;
export type HrNotificationRecord={id:string;subjectId:string;eventType:string;
 createdAt:Date;readAt:Date|null};
export function projectHrNotifications(rows:readonly HrNotificationRecord[],jobs:readonly {id:string;title:string}[]) {
 const names=new Map(jobs.map(j=>[j.id,j.title]));
 return rows.filter(row=>names.has(row.subjectId)&&
  HR_NOTIFICATION_EVENTS.some(kind=>kind===row.eventType)).map(row=>({
  id:row.id,jobId:row.subjectId,title:names.get(row.subjectId)!,
  label:row.eventType===HR_NOTIFICATION_EVENTS[0]?"Drive published":"Drive closed",
  createdAt:row.createdAt,unread:row.readAt===null,
 }));
}
