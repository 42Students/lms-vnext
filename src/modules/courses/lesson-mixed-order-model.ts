/** Stable cross-kind lesson ordering for legacy assignment content imports.
 * The old LMS interleaves ASSIGNMENT with ordinary lesson contents. Separate
 * assignment and content sequence sorts cannot reconstruct that curriculum.
 * For equal positions, use an explicit deterministic kind/id tie-breaker;
 * historical numeric ordering must be reconciled during import.
 */
export function orderLessonCurriculum<T extends {id:string;sequence:number;kind:string}>(
 items:readonly T[],
):T[]{
 return [...items].sort((left,right)=>
  left.sequence-right.sequence||
  left.kind.localeCompare(right.kind)||
  left.id.localeCompare(right.id));
}
