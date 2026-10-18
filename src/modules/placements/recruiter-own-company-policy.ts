import type { RecruiterContext } from "@/modules/identity/context";
/** Check employer identity as well as college+relationship; a valid-looking
 * grant for an unrelated company must never widen the recruiter portfolio. */
export function isExactRecruiterEmployerRow(
  recruiter: Pick<RecruiterContext,"companyId"|"grants">,
  row: {companyId:string;relationshipId:string;collegeId:string},
) {
  return Boolean(recruiter.companyId.trim() && row.companyId.trim() &&
    row.relationshipId.trim() && row.collegeId.trim()) &&
    recruiter.companyId===row.companyId &&
    recruiter.grants.some(grant=>grant.companyRelationshipId===row.relationshipId &&
      grant.collegeId===row.collegeId);
}
