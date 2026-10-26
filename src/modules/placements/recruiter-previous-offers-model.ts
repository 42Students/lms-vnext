/** Historical comparison never searches across colleges, employers, or
 * unpublished/archived jobs. The caller must still reauthorize the selected
 * historical job in getHrJobRead before reading any candidates. */
export type RecruiterComparableJob={
 collegeId:string;relationshipId:string;
 job:{id:string;title:string;status:string;archivedAt:Date|null;createdAt:Date};
};
export function recruiterPreviousComparableJob<T extends RecruiterComparableJob>(
 rows:readonly T[],current:RecruiterComparableJob,
):T|null{
 const normalize=(v:string)=>v.trim().replace(/\s+/g," ").toLocaleLowerCase("en");
 return [...rows].filter(row=>row.collegeId===current.collegeId&&
   row.relationshipId===current.relationshipId&&
   row.job.id!==current.job.id&&row.job.status==="CLOSED"&&
   row.job.archivedAt===null&&
   normalize(row.job.title)===normalize(current.job.title)&&
   Number.isFinite(row.job.createdAt.getTime())&&
   row.job.createdAt.getTime()<current.job.createdAt.getTime())
  .sort((a,b)=>b.job.createdAt.getTime()-a.job.createdAt.getTime()||
    b.job.id.localeCompare(a.job.id))[0]??null;
}
export type RecruiterHistoricalOffer={
 id:string;name:string|null;status:string;joiningStatus:string|null;
};
export function recruiterHistoricalOfferRows(rows:readonly RecruiterHistoricalOffer[]){
 return rows.filter(row=>["ACCEPTED","DECLINED","ISSUED","EXPIRED","WITHDRAWN"]
  .includes(row.status)).map(row=>({
  ...row,
  offerLabel:row.status==="ACCEPTED"?"Accepted":row.status==="DECLINED"?"Declined":
   row.status==="ISSUED"?"Awaiting reply":row.status==="EXPIRED"?"Expired":"Withdrawn",
  joiningLabel:row.status!=="ACCEPTED"?"—":
   row.joiningStatus==="JOINED"?"Joined":
   row.joiningStatus==="DEFERRED"?"Deferred":
   row.joiningStatus==="DID_NOT_JOIN"?"Did not join":"Not recorded",
 }));
}
