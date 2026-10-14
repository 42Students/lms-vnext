import type {RecruiterDriveListItem} from "./recruiter-drive-list-model";
const DAY=86400000;
export function hrDriveAttention<T extends RecruiterDriveListItem>(
 rows:readonly T[],collegeId:string,now:Date,limit=5
){
 const scoped=rows.filter(row=>row.collegeId===collegeId&&row.job.archivedAt===null&&
   row.job.status==="PUBLISHED"&&row.job.applicationDeadline!==null);
 const sorted=[...scoped].sort((a,b)=>a.job.applicationDeadline!.getTime()-
  b.job.applicationDeadline!.getTime()||a.job.id.localeCompare(b.job.id));
 const past=sorted.filter(row=>row.job.applicationDeadline!.getTime()<now.getTime()).slice(-limit).reverse();
 const soon=sorted.filter(row=>row.job.applicationDeadline!.getTime()>=now.getTime()&&
   row.job.applicationDeadline!.getTime()<=now.getTime()+7*DAY).slice(0,limit);
 return {past,soon};
}
