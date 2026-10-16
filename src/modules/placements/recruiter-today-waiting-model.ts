type Request={id:string;status:string;draft:unknown;createdAt:Date};
/** Only persisted formal requests waiting for the placement cell are displayed
 * as waiting decisions; thread recency alone is not a review state. */
export function recruiterTodayWaitingRequests<T extends Request>(requests:readonly T[]){
 return requests.filter(row=>row.status==="REQUEST"||row.status==="SENT_BACK")
  .sort((a,b)=>b.createdAt.getTime()-a.createdAt.getTime())
  .slice(0,8)
  .map(row=>({
   id:row.id,title:typeof row.draft==="object"&&row.draft!==null&&
     "title" in row.draft&&typeof row.draft.title==="string"?row.draft.title:"Hiring request",
   status:row.status,createdAt:row.createdAt,
  }));
}
