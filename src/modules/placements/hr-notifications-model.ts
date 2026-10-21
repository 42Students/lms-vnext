import {z} from "zod";
export const hrNotificationsQuerySchema=z.strictObject({
  collegeId:z.string().uuid().optional(),unreadOnly:z.enum(["true","false"]).default("false"),
  page:z.coerce.number().int().min(1).max(10000).default(1),
  q:z.string().trim().max(120).default(""),
});
/** Only known placement-job scoped activity types enter the recruiter inbox.
 * Private learner/application activity is deliberately excluded.
 * Event subjects still need to match an authorized employer job.
 */
export const HR_NOTIFICATION_EVENTS=[
 "placements.job.published","placements.job.closed","placements.job.cancelled",
 "placements.job.published_edited","placements.round.completed",
 "placements.result.applied","placements.request.decided",
 "placements.offer.responded",
] as const;
const HR_EVENT_LABELS:Record<(typeof HR_NOTIFICATION_EVENTS)[number],string>={
 "placements.job.published":"Drive published",
 "placements.job.closed":"Drive closed",
 "placements.job.cancelled":"A drive was cancelled",
 "placements.job.published_edited":"Your drive was updated",
 "placements.round.completed":"An interview round was completed",
 "placements.result.applied":"Round results were applied",
 "placements.request.decided":"Your drive request was reviewed",
 "placements.offer.responded":"An offer was answered",
};
export type HrNotificationRecord={id:string;subjectId:string;eventType:string;
 createdAt:Date;readAt:Date|null};
export function projectHrNotifications(rows:readonly HrNotificationRecord[],jobs:readonly {id:string;title:string}[]) {
 const names=new Map(jobs.map(j=>[j.id,j.title]));
 return rows.filter(row=>names.has(row.subjectId)&&
  Number.isFinite(row.createdAt.getTime())&&
  HR_NOTIFICATION_EVENTS.some(kind=>kind===row.eventType)).map(row=>({
  id:row.id,jobId:row.subjectId,title:names.get(row.subjectId)!,
  label:HR_EVENT_LABELS[row.eventType as keyof typeof HR_EVENT_LABELS],
  createdAt:row.createdAt,unread:row.readAt===null,
 }));
}

export const HR_INBOX_PAGE_SIZE=25;
/** Outdated deep links must recover to the last available inbox page,
 * rather than showing an empty result even though matching notifications exist.
 * The existing bounds helper still reports raw out-of-range requests faithfully.
 */
export function clampHrInboxPage(page:number,total:number):number{
 const safeTotal=Number.isSafeInteger(total)&&total>0?total:0;
 const pages=Math.ceil(safeTotal/HR_INBOX_PAGE_SIZE);
 if(!Number.isSafeInteger(page)||page<1)return 1;
 return Math.min(page,Math.max(1,pages));
}
export function hrInboxPageBounds(page:number,total:number){
 const first=total===0||(page-1)*HR_INBOX_PAGE_SIZE>=total?0:(page-1)*HR_INBOX_PAGE_SIZE+1;
 return {page,total,pageSize:HR_INBOX_PAGE_SIZE,pages:Math.ceil(total/HR_INBOX_PAGE_SIZE),
  first,last:first===0?0:Math.min(total,page*HR_INBOX_PAGE_SIZE)};
}

export function filterHrNotificationJobs<T extends {title:string}>(jobs:readonly T[],q:string):T[]{
 const needle=q.trim().toLocaleLowerCase();
 return needle?jobs.filter(job=>job.title.toLocaleLowerCase().includes(needle)):[...jobs];
}
