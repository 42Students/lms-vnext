/** Show both the semester population and the current filtered/rendered page. */
export function learnerCourseResultSummary(
 visibleCount:number,filteredCount:number,totalCount=filteredCount,
):string{
 const finiteCount=(value:number)=>Number.isFinite(value)?Math.max(0,Math.trunc(value)):0;
 const total=finiteCount(totalCount);
 const filtered=Math.min(total,finiteCount(filteredCount));
 const rendered=Math.min(filtered,finiteCount(visibleCount));
 return "Showing "+filtered+" of "+total+" records · "+rendered+" currently displayed";
}
