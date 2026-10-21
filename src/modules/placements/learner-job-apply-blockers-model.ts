/** LEARNER-placements-R01: explain only persisted reasons for a denied self-apply
 * affordance; never imply an employer rejected the candidate. */
export function learnerJobApplyBlockers(input:{
  registrationState:"CAN_APPLY"|"REGISTER_FIRST"|"CHOSE_OTHER";
  debarred:boolean;
  canSelfApply:boolean;
  hasApplication:boolean;
  deadlinePassed:boolean;
  heldOfferEligible:boolean;
  eligibilityStatus:string;
}): string[]{
  if(input.hasApplication)return ["An application for this role is already recorded."];
  const reasons:string[]=[];
  if(input.registrationState==="REGISTER_FIRST")reasons.push("Register for placements to participate in campus drives.");
  if(input.registrationState==="CHOSE_OTHER")reasons.push("Your current registration does not include campus placements.");
  if(input.debarred)reasons.push("A current placement restriction needs placement-cell review.");
  if(!input.canSelfApply)reasons.push("Self-application is not currently enabled for your batch.");
  if(input.deadlinePassed)reasons.push("The application deadline has passed.");
  if(!input.heldOfferEligible)reasons.push("Your college's held-offer limit or upgrade rule does not allow this application.");
  if(input.eligibilityStatus==="NEEDS_DATA")reasons.push("Required academic evidence is missing. Review your learner profile.");
  if(input.eligibilityStatus==="INELIGIBLE")reasons.push("One or more published role eligibility rules are not met.");
  return reasons.length?reasons:["You cannot self-apply to this role at present. Ask your placement cell for details."];
}

/** Legacy ApplyGate-compatible denial contract. The live application mutation
 * remains authoritative; this never grants permission by itself. */
export type LearnerJobApplyCode=
 "OPEN"|"DRIVE_CLOSED"|"NOT_IN_PLACEMENTS"|"REGISTER_FIRST"|
 "REGISTRATION_NOT_OPEN"|"CHOSE_OTHER"|"BATCH_FINISHED"|"RULES"|"HELD_OFFER"|"ALREADY_APPLIED";
export type LearnerJobApplyGate={
 code:LearnerJobApplyCode;reason:string|null;action:"REGISTER"|"RULES"|null;href:string|null;canApply:boolean;
};
export function learnerJobApplyGate(input:Parameters<typeof learnerJobApplyBlockers>[0] & {
 published?:boolean;inPlacements?:boolean;registrationWindowOpen?:boolean;batchFinished?:boolean;
}):LearnerJobApplyGate {
 const denied=(code:LearnerJobApplyCode,reason:string,action:"REGISTER"|"RULES"|null=null):LearnerJobApplyGate=>({
  code,reason,action,href:action==="REGISTER"?"/learn/my-placements#registration":
   action==="RULES"?"/learn/my-placements/rules":null,canApply:false,
 });
 if(input.hasApplication)return denied("ALREADY_APPLIED","An application for this role is already recorded.");
 if(input.published===false||input.deadlinePassed)return denied("DRIVE_CLOSED","This drive isn't taking applications.");
 if(input.inPlacements===false)return denied("NOT_IN_PLACEMENTS",
  "You aren't in placements yet. Your placement cell decides who takes part; ask them if you think you should be.");
 if(input.batchFinished)return denied("BATCH_FINISHED","Your batch has finished placements.");
 if(input.registrationState==="CHOSE_OTHER")return denied("CHOSE_OTHER",
  "You told the placement cell you're not taking part in placements. Change that in Placement cell to apply.","REGISTER");
 if(input.registrationState==="REGISTER_FIRST")return input.registrationWindowOpen===false?
  denied("REGISTRATION_NOT_OPEN",
   "Registration for placements hasn't opened for your batch yet. You can apply once the placement cell invites your batch and you register."):
  denied("REGISTER_FIRST",
   "Register for placements first. It takes a minute, and then you can apply.","REGISTER");
 if(input.debarred||!input.canSelfApply)return denied("NOT_IN_PLACEMENTS",
  input.debarred?"A current placement restriction needs placement-cell review.":
   "Self-application is not currently enabled for your batch.");
 if(input.eligibilityStatus!=="ELIGIBLE"&&input.eligibilityStatus!=="ELIGIBLE_WITH_MISSING_EVIDENCE")
  return denied("RULES",input.eligibilityStatus==="NEEDS_DATA"?
   "Required academic evidence is missing. Review your learner profile.":
   "You don't meet this drive's rules.");
 if(!input.heldOfferEligible)return denied("HELD_OFFER",
  "Your college's held-offer limit or upgrade rule does not allow this application.","RULES");
 return {code:"OPEN",reason:null,action:null,href:null,canApply:true};
}
