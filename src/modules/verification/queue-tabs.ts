import type { VerificationRecord } from "@/modules/profile-verification/domain";
export type VerificationTab = "WAITING" | "SENT_BACK" | "VERIFIED";
export function verificationTab(record:Pick<VerificationRecord,"status">):VerificationTab {
  switch(record.status) {
    case "SUBMITTED": case "UPDATE_PENDING": return "WAITING";
    case "SENT_BACK": return "SENT_BACK";
    case "VERIFIED": return "VERIFIED";
  }
}
export function verificationTabCounts(rows:ReadonlyArray<Pick<VerificationRecord,"status">>) {
  const counts={WAITING:0,SENT_BACK:0,VERIFIED:0};
  for(const row of rows) counts[verificationTab(row)]++;
  return counts;
}

/** Export does not need other-tab counts; narrow its SQL read before the cap. */
export function verificationTabStatuses(tab:VerificationTab,waitingState:"ALL"|"SUBMITTED"|"UPDATE_PENDING"){
 if(tab==="SENT_BACK")return ["SENT_BACK"] as const;
 if(tab==="VERIFIED")return ["VERIFIED"] as const;
 if(waitingState==="SUBMITTED")return ["SUBMITTED"] as const;
 if(waitingState==="UPDATE_PENDING")return ["UPDATE_PENDING"] as const;
 return ["SUBMITTED","UPDATE_PENDING"] as const;
}
