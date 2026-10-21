/** Probe one additional authorized row before reporting a truncated lookup. */
export const STUDENT_LOOKUP_CAP = 10;
export const STUDENT_LOOKUP_APPLICATION_CAP = 100;

export function capStudentLookupRows<T>(
  rows: readonly T[],
  cap: typeof STUDENT_LOOKUP_CAP | typeof STUDENT_LOOKUP_APPLICATION_CAP,
): { items: T[]; truncated: boolean } {
  return { items: rows.slice(0, cap), truncated: rows.length > cap };
}

/** Detail panels must not expand all autocomplete candidates. Require a
 * selected membership ID among the scoped suggestions before querying it.
 */
export function selectedStudentLookupCandidate<T extends {membershipId:string}>(
 candidates:readonly T[],selectedMembershipId:string|null|undefined,
):T|null {
 if (!selectedMembershipId) return null;
 return candidates.find(candidate=>candidate.membershipId===selectedMembershipId)??null;
}
