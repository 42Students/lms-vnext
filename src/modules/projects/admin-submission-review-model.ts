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
