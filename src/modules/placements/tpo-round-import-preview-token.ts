import "server-only";
import {createHash} from "node:crypto";

/** SHA-256 review fingerprint over the uploaded file and current applicant
 * state. Never ship the cryptographic helper into a client-rendered CSV model.
 */
export function tpoRoundImportPreviewToken(roundId:string,bytes:Buffer,rows:readonly {
 applicationId:string;currentResultId:string|null;currentStatus:string|null;
 email:string|null;roll:string|null;name:string|null;
}[]):string{
 const snapshot=rows.map(row=>[row.applicationId,row.currentResultId,row.currentStatus,
  row.email,row.roll,row.name]).sort((left,right)=>String(left[0]).localeCompare(String(right[0])));
 return createHash("sha256").update(JSON.stringify([roundId,
  createHash("sha256").update(bytes).digest("hex"),snapshot])).digest("hex");
}
