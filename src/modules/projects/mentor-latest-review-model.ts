/** Select only the most recent registered delivery version for each Mentor project.
 * A historic SUBMITTED row does not imply a pending review after a newer
 * approval, draft, or revision. Input order is intentionally irrelevant.
 */
export function currentPendingMentorSubmissions<T extends {
  id:string;projectId:string;version:number;status:string;submittedAt:Date|null;
  reviewedAt?:Date|null;reopenedAt?:Date|null;
}>(rows:readonly T[]):Map<string,T>{
  const latest=new Map<string,T>();
  for(const row of rows){
    const current=latest.get(row.projectId);
    if(!current||row.version>current.version||
      row.version===current.version&&row.id.localeCompare(current.id)>0){
      latest.set(row.projectId,row);
    }
  }
  for(const [projectId,row] of latest){
    if(!["SUBMITTED","UNDER_REVIEW","IN_REVIEW"].includes(row.status)||
      !row.submittedAt||row.reopenedAt||
      row.reviewedAt&&row.submittedAt.getTime()<=row.reviewedAt.getTime()){
      latest.delete(projectId);
    }
  }
  return latest;
}
