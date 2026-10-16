/** A scheduled shortlist round changes withdrawal from self-service to
 * a placement-cell request. An already recorded offer is a separate lock. */
export function learnerWithdrawalMode(input:{
 applicationStatus:string;
 scheduledRoundCount:number;
 screeningStatus:string;
}):"UNAVAILABLE"|"SELF"|"REQUEST"{
 if(input.applicationStatus!=="SUBMITTED")return "UNAVAILABLE";
 return input.screeningStatus==="SHORTLISTED"&&input.scheduledRoundCount>0
  ?"REQUEST":"SELF";
}
