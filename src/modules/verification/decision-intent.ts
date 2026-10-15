import type {VerificationReviewInput} from "./review-input";
export type VerificationDecisionIntent={
 kind:"PROFILE_VERIFICATION_DECISION";learnerMembershipId:string;
 section:"EDUCATION"|"IDENTITY";decision:"VERIFIED"|"SENT_BACK";reason:string|null;
 idempotencyKey:string;
};
/** Outbox intent only: no email or SMS is sent until the shared delivery service is wired. */
export function verificationDecisionIntent(input:VerificationReviewInput,committedVersion:number):VerificationDecisionIntent {
 if(!Number.isSafeInteger(committedVersion)||committedVersion<=input.expectedVersion)throw Error("DECISION_NOT_COMMITTED");
 return {kind:"PROFILE_VERIFICATION_DECISION",learnerMembershipId:input.learnerMembershipId,
 section:input.section,decision:input.action==="VERIFY"?"VERIFIED":"SENT_BACK",
 reason:input.action==="SEND_BACK"?input.reason??null:null,
 idempotencyKey:`profile-verification:${input.learnerMembershipId}:${input.section}:${committedVersion}`};
}
