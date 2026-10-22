export type HrLiveDriveItem={
 collegeId:string;companyId:string;
 job:{id:string;title:string;status:string;archivedAt:Date|null;applicationDeadline:Date|null};
};
/** Recruiter-visible shared counts are not the old all-applicants metric.
 * Rank by known, currently authorized shared applicants; when those counts
 * cannot be loaded, retain deterministic deadline order instead of treating
 * missing counts as a verified zero. The caller chooses preview vs expanded
 * length; the primary (first) item is the busiest verified visible drive. */
export function hrTodayLiveDriveRows<T extends HrLiveDriveItem>(
 rows:readonly T[],collegeId:string,companyId:string,limit=3,
 visibleCounts:Readonly<Record<string,{sharedApplicants:number}>>|null=null,
):T[]{
 return rows.filter(row=>row.collegeId===collegeId&&row.companyId===companyId&&
   row.job.status==="PUBLISHED"&&row.job.archivedAt===null)
 .sort((a,b)=>{
  if(visibleCounts){
   const left=visibleCounts[a.job.id]?.sharedApplicants;
   const right=visibleCounts[b.job.id]?.sharedApplicants;
   if(Number.isFinite(left)&&Number.isFinite(right)&&left!==right)
    return right!-left!;
   // Counts for both rows must be known before making a count comparison.
   if(Number.isFinite(left)!==Number.isFinite(right))
    return Number.isFinite(left)?-1:1;
  }
  const first=a.job.applicationDeadline?.getTime()??Number.POSITIVE_INFINITY;
  const second=b.job.applicationDeadline?.getTime()??Number.POSITIVE_INFINITY;
  return first-second||b.job.id.localeCompare(a.job.id);
 }).slice(0,Math.min(rows.length,Math.max(0,limit)));
}
