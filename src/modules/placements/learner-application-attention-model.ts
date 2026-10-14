export type LearnerApplicationAttentionItem={
  applicationId:string;companyName:string;jobTitle:string;
  applicationStatus:string;withdrawnAt:Date|null;
  screening:{status:string};
};
export function learnerApplicationAttention(items:readonly LearnerApplicationAttentionItem[]){
  const active=items.filter(item=>item.applicationStatus==="SUBMITTED"&&!item.withdrawnAt);
  const shortlisted=active.filter(item=>item.screening.status==="SHORTLISTED");
  const reviewing=active.filter(item=>item.screening.status==="UNDER_REVIEW");
  const rows=[...shortlisted,...reviewing].slice(0,3);
  return {
    shortlistedCount:shortlisted.length,
    underReviewCount:reviewing.length,
    rows:rows.map(row=>({
      id:row.applicationId,title:row.companyName+" · "+row.jobTitle,
      detail:row.screening.status==="SHORTLISTED"?"Screening shortlisted":"Under placement-team review",
      href:"/learn/my-placements/applications?applicationId="+
        encodeURIComponent(row.applicationId),
    })),
    overflow:Math.max(0,shortlisted.length+reviewing.length-rows.length),
  };
}
