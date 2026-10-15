/** Current roster scope only. Historical transfers are not inferred. */
export function buildBatchHistoryScope(
  cohortId: string,
  activeMembershipIds: readonly string[],
  activeSectionIds: readonly string[],
  maxMemberships = 500,
) {
  const memberships = [...new Set(activeMembershipIds)];
  const limited = memberships.length > maxMemberships;
  return {
    ids: [...new Set([cohortId, ...memberships.slice(0,maxMemberships), ...activeSectionIds])],
    limited,
    includesTransferredLearners: false as const,
  };
}
