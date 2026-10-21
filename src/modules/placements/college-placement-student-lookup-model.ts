/** Probe one additional authorized row before reporting a truncated lookup. */
export const STUDENT_LOOKUP_MIN_CHARACTERS = 2;
export const STUDENT_LOOKUP_DEBOUNCE_MS = 300;
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

/** Legacy selected learner IDs are numeric. Resolve an imported bookmark
 * only through a verified membership UUID crosswalk, never by offset, name
 * or client-supplied tenant identity. The scoped detail reader checks access. */
export function legacySelectedStudentMembershipId(
 raw:string,crosswalk:ReadonlyMap<string,string>,
):string|null{
 if(!/^[1-9][0-9]{0,9}$/.test(raw))return null;
 const id=crosswalk.get(raw);
 return id&&/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id)?id:null;
}
