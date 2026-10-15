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
