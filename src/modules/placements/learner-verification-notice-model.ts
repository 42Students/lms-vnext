import type {LearnerVerificationState} from "./learner-verification-status-model";
export function learnerVerificationNoticeCopy(input:{
 status:LearnerVerificationState;reason:string|null;decidedByName:string|null;
 verifiedAt:string|null;heading:string;
}):string|null {
 if(input.status==="VERIFIED"||input.status==="UPDATE_PENDING"){
  const name=input.decidedByName?.trim();
  const date=input.verifiedAt&&Number.isFinite(Date.parse(input.verifiedAt))
   ?new Intl.DateTimeFormat("en-IN",{timeZone:"Asia/Kolkata",dateStyle:"medium"}).format(new Date(input.verifiedAt)):null;
  if(name&&date)return "Verified by "+name+" on "+date;
  return input.status==="VERIFIED"?"Verified":"Verified details are in use while your update waits for review.";
 }
 if(input.status==="WAITING")return input.heading+" sent to the college for verification";
 if(input.status==="SENT_BACK")return input.reason?
  "The college asked for a change: "+input.reason:"The college asked for a change";
 return null;
}
