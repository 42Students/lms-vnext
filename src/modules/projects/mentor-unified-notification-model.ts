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
