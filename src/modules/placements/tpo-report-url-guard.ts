/** A query with repeated values has no unique report snapshot. Explicitly
 * reject it instead of discarding all but the first parameter with first().
 * Report-specific schemas/services still validate individual values and scope.
 */
export function tpoReportHasAmbiguousFilters(
 params:Record<string,string|string[]|undefined>,
):boolean{
 return Object.values(params).some(Array.isArray);
}

/** URLSearchParams.get() silently discards a second value. The CSV export
 * must refuse ambiguous URLs just like the on-screen report snapshot. */
export function tpoReportHasRepeatedSearchParams(params:URLSearchParams):boolean{
 const seen=new Set<string>();
 for(const [key] of params){
  if(seen.has(key))return true;
  seen.add(key);
 }
 return false;
}
