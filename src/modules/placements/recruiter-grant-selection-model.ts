/** The same college may have more than one active employer relationship.
 * A job grant is identified by BOTH college and relationship, never college
 * alone. Do not borrow more permissive field-sharing defaults from a
 * different company relationship when rendering applicant project metadata.
 */
export function findRecruiterScopedGrant<
  Grant extends { collegeId: string; companyRelationshipId: string },
>(
  grants: readonly Grant[] | null | undefined,
  collegeId: string,
  companyRelationshipId: string,
): Grant | null {
  if (!collegeId.trim() || !companyRelationshipId.trim()) return null;
  return grants?.find(grant =>
    grant.collegeId === collegeId &&
    grant.companyRelationshipId === companyRelationshipId,
  ) ?? null;
}
