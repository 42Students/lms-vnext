import type {VerificationRecord} from "@/modules/profile-verification/domain";
export function verificationReviewSummary(row:Pick<VerificationRecord,"status"|"section"|"version"|"submittedAt"|"decidedAt"|"note">){
 return {
  statusLabel:row.status==="UPDATE_PENDING"?"Awaiting updated-details review":row.status==="SUBMITTED"?"Waiting for review":row.status==="SENT_BACK"?"Sent back":"Verified",
  sectionLabel:row.section==="EDUCATION"?"Education":"Identity",
  canDecide:row.status==="SUBMITTED"||row.status==="UPDATE_PENDING",
  version:row.version,
  submittedAtIst:new Intl.DateTimeFormat("en-IN",{dateStyle:"medium",timeStyle:"short",timeZone:"Asia/Kolkata"}).format(row.submittedAt),
  decisionNote:row.note,
 };
}
