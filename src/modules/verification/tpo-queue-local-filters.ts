import type {VerificationQueueCard} from "@/components/verification/VerificationWorkspace";

/** TPO-verification visible-page filters never bypass the scoped server read. */
export type TpoVerificationLocalFilters={
 state:"ALL"|"SUBMITTED"|"UPDATE_PENDING";
 marksheets:"ANY"|"MISSING"|"PRESENT";
 attention:"ALL"|"MISSING_DOCUMENT"|"WAITING_OVER_WEEK";
};
export const defaultTpoVerificationFilters:TpoVerificationLocalFilters={
 state:"ALL",marksheets:"ANY",attention:"ALL",
};
export function filterTpoVerificationRows(
 rows:readonly VerificationQueueCard[],
 filters:TpoVerificationLocalFilters,
 asOf:Date,
):VerificationQueueCard[]{
 return rows.filter(row=>{
  if(filters.state!=="ALL"&&row.status!==filters.state)return false;
  if(filters.marksheets==="MISSING"&&!(row.section==="EDUCATION"&&row.missingMarksheet))return false;
  if(filters.marksheets==="PRESENT"&&!(row.section==="EDUCATION"&&
      row.marksheets&&row.marksheets.expected>0&&row.marksheets.missing===0))return false;
  if(filters.attention==="MISSING_DOCUMENT"&&
      !row.missingMarksheet&&!row.missingIdentityProof)return false;
  if(filters.attention==="WAITING_OVER_WEEK"&&
      (!(row.status==="SUBMITTED"||row.status==="UPDATE_PENDING")||
       asOf.getTime()-row.submittedAt.getTime()<=7*86400000))return false;
  return true;
 });
}
