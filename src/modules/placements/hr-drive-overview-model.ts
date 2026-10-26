export type HrDriveOverviewInput = {
 job:{status:string;applicationDeadline:Date|null};
 applicants:{all:number;shortlisted:number;withdrawn:number};
 offers:readonly {status:string}[];
 rounds:readonly {kind:string;status:string}[];
};
export function buildHrDriveOverview(input:HrDriveOverviewInput,now:Date) {
 const evaluative=input.rounds.filter(round=>round.kind!=="TALK");
 const completed=evaluative.filter(round=>round.status==="COMPLETED").length;
 const date=input.job.applicationDeadline;
 return {
  shared:input.applicants.all,
  active:input.applicants.shortlisted,
  withdrawn:input.applicants.withdrawn,
  issuedOffers:input.offers.filter(offer=>offer.status==="ISSUED").length,
  acceptedOffers:input.offers.filter(offer=>offer.status==="ACCEPTED").length,
  totalRounds:evaluative.length,
  completedRounds:completed,
  deadlineState:date===null?"NOT_SET":date.getTime()<now.getTime()?"PASSED":
   date.getTime()<=now.getTime()+7*86400000?"DUE_SOON":"UPCOMING",
  readOnly:input.job.status!=="PUBLISHED",
  closed:input.job.status==="CLOSED",
 };
}
