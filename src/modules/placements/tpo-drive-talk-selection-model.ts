/** Selecting a recruiter conversation is an exact match within the already
 * authorized drive's thread list. An explicit stale/foreign ID MUST NOT open
 * the first thread or any other conversation as an accidental fallback. */
export function selectTpoDriveTalkThread<T extends {id:string}>(
 threads:readonly T[],selectedId:string|null,
):T|null{
 return selectedId===null?threads[0]??null:threads.find(row=>row.id===selectedId)??null;
}
