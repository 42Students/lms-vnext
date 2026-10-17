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
