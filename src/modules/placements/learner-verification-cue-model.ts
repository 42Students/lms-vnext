import type {LearnerVerificationState} from "./learner-verification-status-model";
const label:Record<LearnerVerificationState,string>={
 NOT_SUBMITTED:"Not submitted",WAITING:"Waiting for review",SENT_BACK:"Sent back",
 VERIFIED:"Verified",UPDATE_PENDING:"Update waiting for review",
};
/** Avoid calling a learner placement-ready from independent profile reviews. */
export function learnerPlacementVerificationCue(education:LearnerVerificationState,identity:LearnerVerificationState){
 const both=education==="VERIFIED"&&identity==="VERIFIED";
 const needsChange=education==="SENT_BACK"||identity==="SENT_BACK";
 return {educationLabel:label[education],identityLabel:label[identity],
  summary:both?"Education and identity are verified. Placement eligibility is assessed separately.":
   needsChange?"A reviewer sent back at least one profile section. Review the reason and correct your details.":
   "Education and identity have not both been verified. Check each section for the next action.",
 };
}
