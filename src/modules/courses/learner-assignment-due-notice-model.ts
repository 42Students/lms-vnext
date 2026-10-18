export type LearnerDueSource={
 id:string;title:string;deliveryId:string;dueAt:Date|null;submissionId:string|null;
};
export type LearnerDueNotice={key:string;title:string;body:string;href:string;dueAt:string};
/** Live reminder projection: never equate a saved assignment due date with a
 * delivered push/email. Exclude submitted, missing-deadline and expired rows. */
export function learnerDueSoonNotices(rows:readonly LearnerDueSource[],now:Date,hours=48):LearnerDueNotice[]{
 const begin=now.getTime(),end=begin+hours*3600000;
 if(!Number.isFinite(begin)||!Number.isFinite(end)||hours<=0)return [];
 const seen=new Set<string>();
 return rows.filter(row=>!row.submissionId&&row.dueAt&&
    Number.isFinite(row.dueAt.getTime())&&row.dueAt.getTime()>begin&&
    row.dueAt.getTime()<=end).map(row=>({
   key:row.id+":"+row.deliveryId,
   title:"Assignment due soon",
   body:row.title+" · Due "+new Intl.DateTimeFormat("en-IN",{
    timeZone:"Asia/Kolkata",dateStyle:"medium",timeStyle:"short"
   }).format(row.dueAt!),
   href:"/learn/allAssignments/"+encodeURIComponent(row.id)+"?deliveryId="+encodeURIComponent(row.deliveryId),
   dueAt:row.dueAt!.toISOString(),
 })).sort((a,b)=>a.dueAt.localeCompare(b.dueAt)||a.key.localeCompare(b.key))
  .filter(notice=>{
   if(seen.has(notice.key))return false;
   seen.add(notice.key);
   return true;
  });
}
