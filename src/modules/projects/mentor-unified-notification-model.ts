export type MentorUnifiedNotification={
 id:string;source:"PERSONAL"|"ATTENTION"|"ANNOUNCEMENT";
 title:string;description:string;occurredAt:string;
 actionHref:string|null;read:boolean|null;
 /** The source-specific read endpoint uses an authorized stable key. */
 receiptKey:string|null;
};

export function sortMentorUnifiedNotifications(
 rows:readonly MentorUnifiedNotification[],
):MentorUnifiedNotification[]{
 return [...rows].sort((a,b)=>
  b.occurredAt.localeCompare(a.occurredAt)||a.source.localeCompare(b.source)||
  a.id.localeCompare(b.id));
}
export function mentorUnifiedDateLabel(stamp:string):string{
 const date=new Date(stamp);
 if(!Number.isFinite(date.getTime()))return "Date unavailable";
 return new Intl.DateTimeFormat("en-IN",{
  timeZone:"Asia/Kolkata",weekday:"long",day:"numeric",month:"long",year:"numeric",
 }).format(date);
}
export function mentorUnifiedNotificationGroups(rows:readonly MentorUnifiedNotification[]){
 const ordered=sortMentorUnifiedNotifications(rows);
 const groups:Array<{label:string;items:MentorUnifiedNotification[]}>= [];
 for(const item of ordered){
  const label=mentorUnifiedDateLabel(item.occurredAt);
  const last=groups[groups.length-1];
  if(last?.label===label)last.items.push(item);
  else groups.push({label,items:[item]});
 }
 return groups;
}

/** A normal click on an unread, actionable item must acknowledge precisely
 * that recipient-owned source before navigation. No browser-supplied tenant or
 * project selector enters either write API.
 */
export function mentorUnifiedOpenReadRequest(
 item:MentorUnifiedNotification,
):{url:string;body?:string}|null{
 if(item.read!==false)return null;
 if(item.source==="PERSONAL"){
  if(!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(item.id))
    return null;
  return {url:"/api/mentor/notifications/"+encodeURIComponent(item.id)+"/read"};
 }
 if(!item.receiptKey)return null;
 return {url:"/api/mentor/notifications/source-read",
   body:JSON.stringify({key:item.receiptKey})};
}

/** Union independently paged authenticated notification sources without
 * duplicate cards. Newest server-loaded state wins over an older page.
 */
export function mergeMentorUnifiedPages(
 initial:readonly MentorUnifiedNotification[],
 olderNotices:readonly MentorUnifiedNotification[],
 olderPersonal:readonly MentorUnifiedNotification[],
 unreadOnly:boolean,
):MentorUnifiedNotification[]{
 const merged=new Map<string,MentorUnifiedNotification>();
 for(const item of [...initial,...olderNotices,...olderPersonal]){
  if(unreadOnly&&item.read!==false)continue;
  const key=item.source+":"+item.id;
  if(!merged.has(key))merged.set(key,item);
 }
 return sortMentorUnifiedNotifications([...merged.values()]);
}
