/** Combine the three separately fetched lesson-item tables in the same
 * persisted sequence used by learner playback. Never move a quiz or
 * assignment merely because it came from a different repository query.
 *
 * Cross-table sequence ties are possible in older imports; retain the input
 * ordering in ties instead of using a title-dependent, locale-sensitive sort.
 */
export function orderFacultyBlueprintItems<T extends {sequence:number}>(items:readonly T[]):T[]{
 return [...items].sort((a,b)=>a.sequence-b.sequence);
}
