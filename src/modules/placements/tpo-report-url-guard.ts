/** A query with repeated values has no unique report snapshot. Explicitly
 * reject it instead of discarding all but the first parameter with first().
 * Report-specific schemas/services still validate individual values and scope.
 */
export function tpoReportHasAmbiguousFilters(
 params:Record<string,string|string[]|undefined>,
):boolean{
 return Object.values(params).some(Array.isArray);
}
