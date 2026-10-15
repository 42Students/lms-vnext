import {previewVerificationBulk,type BulkCandidate} from "./bulk-preview";
/** Source-only preview; a real decision still requires fresh server-side receipt and version checks. */
export function verificationBulkPreviewRows<T extends BulkCandidate & {learnerName:string}>(rows:readonly T[],action:"VERIFY"|"SEND_BACK") {
 const {eligible,skipped}=previewVerificationBulk(rows,action);
 return {
  eligible:eligible.map(row=>({key:row.learnerMembershipId+":"+row.section,name:row.learnerName,section:row.section,version:row.version})),
  skipped:skipped.map(({row,reason})=>({key:row.learnerMembershipId+":"+row.section,name:row.learnerName,section:row.section,reason})),
 };
}
