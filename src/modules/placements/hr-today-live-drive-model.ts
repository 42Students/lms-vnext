export type HrLiveDriveItem={
 collegeId:string;companyId:string;
 job:{id:string;title:string;status:string;archivedAt:Date|null;applicationDeadline:Date|null};
};
export function hrTodayLiveDriveRows<T extends HrLiveDriveItem>(
 rows:readonly T[],collegeId:string,companyId:string,limit=3,
):T[]{
 return rows.filter(row=>row.collegeId===collegeId&&row.companyId===companyId&&
   row.job.status==="PUBLISHED"&&row.job.archivedAt===null)
 .sort((a,b)=>{
  const first=a.job.applicationDeadline?.getTime()??Number.POSITIVE_INFINITY;
  const second=b.job.applicationDeadline?.getTime()??Number.POSITIVE_INFINITY;
  return first-second||a.job.title.localeCompare(b.job.title)||a.job.id.localeCompare(b.job.id);
 }).slice(0,Math.min(10,Math.max(0,limit)));
}
