export type LearnerApplicationFunnelItem={
 applicationStatus:string;screening:{status:string};
};
/** Mutually exclusive own-application counts, not inferred recruiter outcomes. */
export function learnerPlacementApplicationFunnel(items:readonly LearnerApplicationFunnelItem[]){
 const count={review:0,shortlisted:0,rejected:0,withdrawn:0,other:0};
 for(const item of items){
  if(item.applicationStatus==="WITHDRAWN")count.withdrawn++;
  else if(item.screening.status==="SHORTLISTED")count.shortlisted++;
  else if(item.screening.status==="REJECTED")count.rejected++;
  else if(item.screening.status==="UNDER_REVIEW")count.review++;
  else count.other++;
 }
 return {total:items.length,stages:[
  {key:"review",label:"Under review",count:count.review},
  {key:"shortlisted",label:"Shortlisted",count:count.shortlisted},
  {key:"rejected",label:"Not shortlisted",count:count.rejected},
  {key:"withdrawn",label:"Withdrawn",count:count.withdrawn},
  {key:"other",label:"Other recorded",count:count.other},
 ] as const};
}
