import {createHash} from "node:crypto";
import type {TpoMembershipDecisionSnapshot} from "./tpo-participation-model";
import type {TpoBulkPreviewRequest} from "./tpo-bulk-workflow-model";

export function tpoBulkStudentVersion(snapshot:TpoMembershipDecisionSnapshot){
  return createHash("sha256").update(JSON.stringify([
    snapshot.status,snapshot.reason,snapshot.note,snapshot.updatedAt,
  ])).digest("hex");
}
export function tpoBulkStudentReady(action:TpoBulkPreviewRequest["action"],
  status:TpoMembershipDecisionSnapshot["status"]){
  return action==="ELIGIBLE"?status!=="ELIGIBLE":
    action==="INELIGIBLE"?status!=="INELIGIBLE":
    action==="CLEAR_OVERRIDE"?status!==null:false;
}
export function tpoBulkApplicationReady(action:TpoBulkPreviewRequest["action"],
  jobStatus:string,applicationStatus:string,screeningStatus:string|null,updatedAt:Date|null){
  if(action==="ADD_NOTE")return (jobStatus==="PUBLISHED"||jobStatus==="CLOSED")&&applicationStatus==="SUBMITTED";
  if(action==="SEND_MESSAGE")return jobStatus==="PUBLISHED"&&applicationStatus==="SUBMITTED";
  return (action==="SHORTLISTED"||action==="REJECTED")&&jobStatus==="PUBLISHED"&&
    applicationStatus==="SUBMITTED"&&(screeningStatus==="PENDING"||screeningStatus==="HOLD")&&
    updatedAt!==null;
}
