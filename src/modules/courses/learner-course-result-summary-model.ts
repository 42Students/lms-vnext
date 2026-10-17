/** Show both the semester population and the current filtered/rendered page. */
export function learnerCourseResultSummary(
 visibleCount:number,filteredCount:number,totalCount=filteredCount,
):string{
 const total=Math.max(0,Math.trunc(totalCount));
 const filtered=Math.min(total,Math.max(0,Math.trunc(filteredCount)));
 const rendered=Math.min(filtered,Math.max(0,Math.trunc(visibleCount)));
 return "Showing "+filtered+" of "+total+" records · "+rendered+" currently displayed";
}
