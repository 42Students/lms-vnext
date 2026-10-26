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

/** Keep the Section's server-authoritative content order in the original
 * content slots of a mixed lesson. Individual assessment positions are
 * independently persisted and must not shift merely because Section content
 * is reordered. The content reader already applied any verified DB05
 * override; sorting it again by its historical sequence loses that order.
 */
export function orderFacultyBlueprintContentSlots<
 C extends {sequence:number}, A extends {sequence:number},
>(contents:readonly C[],assessments:readonly A[]):Array<C|A>{
 const mixed=orderFacultyBlueprintItems([
  ...contents.map(item=>({item,sequence:item.sequence,isContent:true})),
  ...assessments.map(item=>({item,sequence:item.sequence,isContent:false})),
 ]);
 let contentIndex=0;
 return mixed.map(entry=>entry.isContent?contents[contentIndex++]!:entry.item);
}
