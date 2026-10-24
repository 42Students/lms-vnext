/** Independent per-status paging: a busy lane may never hide a different
 * lane, and fetching more should not silently reset another lane's progress.
 */
export function mentorLanePage<T>(items:readonly T[],requested:number|undefined){
  const limit=Number.isSafeInteger(requested)&&requested!==undefined&&requested>0
    ?Math.min(requested,10000):4;
  const current=items.slice(0,limit);
  const remaining=Math.max(0,items.length-current.length);
  const moreCount=Math.min(4,remaining);
  return {items:current,total:items.length,remaining,moreCount,nextLimit:limit+moreCount};
}
