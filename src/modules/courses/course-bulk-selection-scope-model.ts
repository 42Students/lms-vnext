/** Page changes must retain a college-scoped selection, while any search,
 * filter or tab change invalidates it. Sort values as well as keys, so URL
 * ordering changes do not accidentally restore a different search. */
export function courseBulkSelectionFilterKey(entries:Iterable<readonly [string,string]>):string{
 const pageOnly=new Set(["page","pageSize","limit","size"]);
 return JSON.stringify([...entries]
  .filter(([key])=>!pageOnly.has(key))
  .sort(([leftKey,leftValue],[rightKey,rightValue])=>
   leftKey.localeCompare(rightKey)||leftValue.localeCompare(rightValue)));
}
