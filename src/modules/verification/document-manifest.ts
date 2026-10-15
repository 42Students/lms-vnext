import type {SafeSnapshot,JsonValue} from "@/modules/profile-verification/domain";
export type VerificationDocumentReference={purpose:"AADHAAR"|"PAN"|"MARKSHEET"|"RESUME";receiptId:string};
function isUuid(value:JsonValue|undefined):value is string {
 return typeof value==="string"&&/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}
/** Only receipt IDs are returned. An authorized server route must exchange these for short-lived private signed URLs. */
export function verificationDocumentManifest(snapshot:SafeSnapshot):VerificationDocumentReference[]{
 const result:VerificationDocumentReference[]=[];
 const add=(purpose:VerificationDocumentReference["purpose"],value:JsonValue|undefined)=>{if(isUuid(value))result.push({purpose,receiptId:value});};
 add("AADHAAR",snapshot.aadhaarDocumentId);add("PAN",snapshot.panDocumentId);add("RESUME",snapshot.resumeDocumentId);
 if(Array.isArray(snapshot.education))for(const row of snapshot.education){
  if(row&&typeof row==="object"&&!Array.isArray(row))add("MARKSHEET",row.marksheetDocumentId);
 }
 return result;
}
