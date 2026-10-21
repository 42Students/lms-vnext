import { z } from "zod";
import { safeNotificationActionHref } from "./notification-action";
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
 return z.enum(["course","project","general","job"]).safeParse(value).data??null;
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
    (q.unread==="all" || (item.source!=="ANNOUNCEMENT" && item.readAt===null)) &&
    (!search || (item.title+" "+item.body).toLocaleLowerCase().includes(search))
  ));
}
