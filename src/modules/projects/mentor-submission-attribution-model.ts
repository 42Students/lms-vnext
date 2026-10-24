/** A final submission must never be labelled as authored by the team lead
 * without a persisted lead designation. The recorded submitter or preserved
 * import-time label is authoritative; otherwise the author is unavailable.
 */
export type MentorSubmissionIdentity={
 version:number;status:string;submittedByMembershipId:string|null;
 submittedAt:Date|string|null;legacySubmittedByName:string|null;
};
export type MentorSubmissionRosterMember={membershipId:string;displayName:string|null};
export function mentorSubmissionIdentity(
 submission:MentorSubmissionIdentity,
 roster:readonly MentorSubmissionRosterMember[],
):{attempt:string;submitter:string;source:"CURRENT_MEMBER"|"HISTORIC"|"UNKNOWN";
 submittedAt:string|null}{
 const current=roster.find(row=>row.membershipId===submission.submittedByMembershipId);
 const historic=submission.legacySubmittedByName?.trim()||null;
 const instant=submission.submittedAt?new Date(submission.submittedAt):null;
 return {
  attempt:submission.version>1?"Attempt "+submission.version+" · revised delivery":
    "First attempt",
  submitter:current?.displayName?.trim()||historic||"Submitter not recorded",
  source:current?.displayName?.trim()?"CURRENT_MEMBER":
    historic?"HISTORIC":"UNKNOWN",
  submittedAt:instant&&Number.isFinite(instant.getTime())?
    instant.toISOString():null,
 };
}
