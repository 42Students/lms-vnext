/** Legacy allowed an authenticated college administrator to review or lock.
 * vNext deliberately adds a narrower constraint to LOCK:
 * mayRecordCollegeAdminDeliveryLock verifies an active real College Admin
 * membership in this college, so the membership-bound event FK has a genuine
 * actor (a Super Admin's selected scope is not a fabricated membership).
 * ACCEPT/REQUEST_CHANGES still require an ACTIVE unlocked submission. A
 * broader platform lock needs a separate, persistently authorized actor
 * provenance model; do not remove this guard to match a UI-only check. */
export const adminSubmissionLegacyLockCapability = {
 acceptedActions: ["APPROVED", "CHANGES_REQUESTED", "LOCK"],
 restrictLockToRealCollegeAdmin: true,
 lockRequiresSubmissionStatus: ["SUBMITTED", "APPROVED"],
 activeProjectRequired: true,
} as const;

export type AdminDeliveryAction="APPROVED"|"CHANGES_REQUESTED"|"LOCK";
export function canAdminSettleDelivery(status:string,locked:boolean,projectStatus:string,action:AdminDeliveryAction){
 // Completed, planned and unknown workspaces are read-only review contexts.
 if(locked||projectStatus!=="ACTIVE")return false;
 if(action!=="LOCK"&&action!=="APPROVED"&&action!=="CHANGES_REQUESTED")return false;
 if(action==="LOCK")return status==="SUBMITTED"||status==="APPROVED";
 return status==="SUBMITTED";
}
export function adminDeliveryToast(action:AdminDeliveryAction){
 return action==="APPROVED"?"Submission accepted.":
  action==="CHANGES_REQUESTED"?"Changes requested.":"Submission locked.";
}

/** Always allow the read-only Review modal, even for completed or invalid
 * states; buttons remain disabled until the persisted state can settle. */
export function adminSubmissionReviewAvailability(
 status:string,locked:boolean,projectStatus:string,
){
 const actions:AdminDeliveryAction[]=["APPROVED","CHANGES_REQUESTED","LOCK"];
 const available=actions.filter(action=>canAdminSettleDelivery(status,locked,projectStatus,action));
 const reason=locked?"Submission is locked.":
  projectStatus!=="ACTIVE"?"This project is not active.":
  status!=="SUBMITTED"&&status!=="APPROVED"?"The submission is not awaiting review.":
  available.length===0?"No review action is available.":null;
 return {canOpen:true,readOnly:available.length===0,actions:available,reason};
}
