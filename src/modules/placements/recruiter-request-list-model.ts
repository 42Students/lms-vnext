/** Recruiter request lifecycle labels; published jobs use their own status. */
export type RecruiterRequestListItem={
 id:string;status:string;draft:Record<string,unknown>;createdAt:Date;
};
export function requestStageLabel(status:string){
 switch(status){
  case "REQUEST":return "Sent for review";
  case "SENT_BACK":return "Needs changes · sent back";
  case "DRAFT":return "Approved · draft";
  case "REJECTED":return "Declined";
  case "CANCELLED":return "Cancelled";
  default:return "Status unavailable";
 }
}
export function filterOwnRecruiterRequests<T extends RecruiterRequestListItem>(
 requests:readonly T[],view:string,rawQuery:string):T[]{
 const query=rawQuery.trim().toLocaleLowerCase("en");
 return requests.filter(row=>{
  if(view==="LIVE")return false;
  if(view==="WAITING"&&!["REQUEST","SENT_BACK","DRAFT"].includes(row.status))return false;
  if(view==="CLOSED"&&!["REJECTED","CANCELLED"].includes(row.status))return false;
  const title=typeof row.draft["title"]==="string"?row.draft["title"]:"";
  return title.toLocaleLowerCase("en").includes(query);
 }).sort((a,b)=>b.createdAt.getTime()-a.createdAt.getTime()||a.id.localeCompare(b.id));
}

/** A sent-back request needs action from the recruiter, not the placement cell.
 * Auto-approved DRAFT jobs still await the placement cell to publish them.
 * Keep these distinct in the prototype's Drives summary without fabricating
 * a placement-cell decision or altering the existing WAITING filter. */
export function recruiterRequestAttentionCounts(requests:readonly {status:string}[]){
 return {
  waitingOnCollege:requests.filter(row=>row.status==="REQUEST"||row.status==="DRAFT").length,
  needsRecruiterChanges:requests.filter(row=>row.status==="SENT_BACK").length,
 };
}
