import type {VerificationStatus} from "@/modules/profile-verification/domain";
/** Existing decision rows are read-only; never label those as a new review action. */
export function verificationQueueCardPresentation(status:VerificationStatus){
 switch(status){
  case "SUBMITTED":return {state:"First submission waiting",action:"Review request",pending:true};
  case "UPDATE_PENDING":return {state:"Updated verified details waiting",action:"Review updates",pending:true};
  case "SENT_BACK":return {state:"Sent back for correction",action:"View decision",pending:false};
  case "VERIFIED":return {state:"Previously verified",action:"View decision",pending:false};
 }
}
