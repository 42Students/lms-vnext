import type {LearnerVerificationState} from "./learner-verification-status-model";
export function learnerVerificationSubmitLabel(status:LearnerVerificationState){
 if(status==="SENT_BACK")return "Resubmit for review";
 if(status==="VERIFIED")return "Submit updated evidence";
 return "Submit for review";
}
