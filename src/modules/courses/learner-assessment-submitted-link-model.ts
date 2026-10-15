import {isLearnerAssignmentHttpsLink} from "./learner-assignment-link-model";
/** Legacy stored submission URLs are rendered as text unless they pass current HTTPS link policy. */
export function learnerAssessmentSubmittedLinkHref(value:string|null):string|null {
 if(!value || !isLearnerAssignmentHttpsLink(value))return null;
 return value;
}
