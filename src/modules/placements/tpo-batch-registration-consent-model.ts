/** A placement choice is not evidence of an external messaging opt-in. */
export function tpoPlacementRegistrationConsentEvidence(row:{choice:string|null;consentAt:Date|null;consentVersion:string|null}):"RECORDED"|"MISSING"|"NOT_APPLICABLE"{
 if(row.choice!=="PLACEMENTS")return "NOT_APPLICABLE";
 return row.consentAt&&row.consentVersion?.trim()?"RECORDED":"MISSING";
}
export function tpoPlacementConsentDescription(value:"RECORDED"|"MISSING"|"NOT_APPLICABLE"):string{
 if(value==="RECORDED")return "Placement registration consent recorded; this is not an external-message opt-in.";
 if(value==="MISSING")return "Placement consent evidence missing. Do not infer consent from the choice.";
 return "No placement registration consent is implied by this choice.";
}
