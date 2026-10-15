import type {VerificationRecord} from "@/modules/profile-verification/domain";
export type AttentionFlag="MISSING_MARKSHEET"|"VERIFIED_DETAILS_CHANGED"|"WAITING_OVER_WEEK";
export function verificationAttentionFlags(row:Pick<VerificationRecord,"status"|"submittedAt"|"section"> & {missingMarksheet:boolean},now:Date):AttentionFlag[]{
 const flags:AttentionFlag[]=[];
 if(row.section==="EDUCATION"&&row.missingMarksheet) flags.push("MISSING_MARKSHEET");
 if(row.status==="UPDATE_PENDING") flags.push("VERIFIED_DETAILS_CHANGED");
 if((row.status==="SUBMITTED"||row.status==="UPDATE_PENDING")&&
   Number.isFinite(row.submittedAt.getTime())&&now.getTime()-row.submittedAt.getTime()>7*24*60*60*1000)
   flags.push("WAITING_OVER_WEEK");
 return flags;
}
