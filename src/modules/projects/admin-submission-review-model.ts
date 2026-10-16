export type AdminDeliveryAction="APPROVED"|"CHANGES_REQUESTED"|"LOCK";
export function canAdminSettleDelivery(status:string,locked:boolean,projectStatus:string,action:AdminDeliveryAction){
 if(locked||projectStatus==="ARCHIVED")return false;
 if(action==="LOCK")return status==="SUBMITTED"||status==="APPROVED";
 return status==="SUBMITTED";
}
export function adminDeliveryToast(action:AdminDeliveryAction){
 return action==="APPROVED"?"Submission accepted.":
  action==="CHANGES_REQUESTED"?"Changes requested.":"Submission locked.";
}
