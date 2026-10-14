import {z} from "zod";
export const hrNotificationsQuerySchema=z.strictObject({
  collegeId:z.string().uuid().optional(),unreadOnly:z.enum(["true","false"]).default("false"),
  page:z.coerce.number().int().min(1).max(10000).default(1),
  q:z.string().trim().max(120).default(""),
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

export const HR_INBOX_PAGE_SIZE=25;
export function hrInboxPageBounds(page:number,total:number){
 return {page,total,pageSize:HR_INBOX_PAGE_SIZE,pages:Math.ceil(total/HR_INBOX_PAGE_SIZE),
  first:total===0||(page-1)*HR_INBOX_PAGE_SIZE>=total?0:(page-1)*HR_INBOX_PAGE_SIZE+1,
  last:Math.min(total,page*HR_INBOX_PAGE_SIZE)};
}

export function filterHrNotificationJobs<T extends {title:string}>(jobs:readonly T[],q:string):T[]{
 const needle=q.trim().toLocaleLowerCase();
 return needle?jobs.filter(job=>job.title.toLocaleLowerCase().includes(needle)):[...jobs];
}
