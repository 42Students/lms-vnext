import { z } from "zod";
import { safeNotificationActionHref, safeExternalAssessmentUrl } from "./notification-action";
import { learnerNotificationCategory } from "./learner-notification-category";
export const learnerNotificationInboxQuerySchema = z.object({
  category:z.enum(["all","course","project","general","job"]).optional().default("all"),
  unread:z.enum(["all","unread"]).optional().default("all"),
  q:z.string().trim().max(100).optional().default(""),
}).strict();
export type LearnerInboxQuery = z.infer<typeof learnerNotificationInboxQuerySchema>;
/** Legacy ?tab links use the same validated category vocabulary; the
 * authenticated /learn/notifications route already performs the canonical
 * redirect and rejects conflicting category/tab parameters.
 */
export function legacyLearnerNotificationCategory(value:unknown){
 if(typeof value!=="string")return null;
 const normalized=value.trim().toLowerCase();
 return z.enum(["all","course","project","general","job"]).safeParse(normalized).data??null;
}
/** External job assessments follow the old new-tab behaviour without allowing
 * unsafe schemes, embedded credentials or opener access. Internal app links
 * remain governed by learnerNotificationTarget below. */
export function learnerExternalAssessmentLaunch(value:string|null|undefined){
 const href=safeExternalAssessmentUrl(value);
 return href?{href,target:"_blank" as const,rel:"noopener noreferrer" as const}:null;
}
/** Announcement/broadcast notices never acquire an invented unread state. */
export function learnerNotificationIsUnread(item:{source?:"ANNOUNCEMENT";readAt:string|null}){
 return item.source!=="ANNOUNCEMENT"&&item.readAt===null;
}
/** Only validated learner inbox filters become navigable URLs; never identity selectors. */
export function learnerNotificationInboxHref(raw: unknown) {
  const state=learnerNotificationInboxQuerySchema.parse(raw);
  const search=new URLSearchParams();
  if(state.category!=="all")search.set("category",state.category);
  if(state.unread!=="all")search.set("unread",state.unread);
  if(state.q)search.set("q",state.q);
  const q=search.toString();
  return "/learn/notifications"+(q?"?"+q:"");
}
export function learnerNotificationTarget(href:string|null|undefined):string|null {
  const safe=safeNotificationActionHref(href);
  if (!safe) return null;
  const path=new URL(safe,"https://lms-vnext.invalid").pathname;
  return path==="/learn" || path.startsWith("/learn/") ? safe : null;
}
export function filterLearnerInbox<T extends {
  title:string; body:string; module:string; readAt:string|null; source?:"ANNOUNCEMENT";
}>(items:readonly T[],raw:unknown):T[] {
  const q=learnerNotificationInboxQuerySchema.parse(raw);
  const search=q.q.toLocaleLowerCase();
  return items.filter(item=>(
    (q.category==="all" || learnerNotificationCategory(item)===q.category) &&
    (q.unread==="all" || learnerNotificationIsUnread(item)) &&
    (!search || (item.title+" "+item.body).toLocaleLowerCase().includes(search))
  ));
}
