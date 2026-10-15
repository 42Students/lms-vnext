import {verificationTab,type VerificationTab} from "./queue-tabs";
import {matchesVerificationSearch,type VerificationSearchRow} from "./queue-search";
import {submittedMarksheets} from "./queue-mark-sheets";
import {orderVerificationQueue} from "./queue-order";
import type {SafeSnapshot,VerificationRecord} from "@/modules/profile-verification/domain";
export type QueueRow=VerificationSearchRow&Pick<VerificationRecord,"learnerMembershipId"|"status"|"submittedAt">&{submittedSnapshot:SafeSnapshot};
export function selectVerificationQueue<T extends QueueRow>(rows:readonly T[],filter:{tab:VerificationTab;kind?:"EDUCATION"|"IDENTITY";q?:string;marksheets?:"ANY"|"PRESENT"|"MISSING"}):T[]{
 return orderVerificationQueue(rows.filter(row=>{
  if(verificationTab(row)!==filter.tab||filter.kind&&row.section!==filter.kind||!matchesVerificationSearch(row,filter.q??""))return false;
  if(row.section!=="EDUCATION"||!filter.marksheets||filter.marksheets==="ANY")return true;
  const m=submittedMarksheets(row.submittedSnapshot);
  return filter.marksheets==="MISSING"?m.missing>0:m.count>0&&m.missing===0;
 }));
}
