/** Self-withdrawal is permitted only before the placement cell progresses
 * a submitted application beyond review. Screened/shortlisted candidates
 * must request a review even when the interview planner has no slot yet. */
export function learnerWithdrawalMode(input:{
 applicationStatus:string;
 scheduledRoundCount:number;
 screeningStatus:string;
}):"UNAVAILABLE"|"SELF"|"REQUEST"{
 if(input.applicationStatus!=="SUBMITTED"||input.screeningStatus==="REJECTED")
  return "UNAVAILABLE";
 if(input.scheduledRoundCount>0||input.screeningStatus==="SHORTLISTED")
  return "REQUEST";
 return "SELF";
}
