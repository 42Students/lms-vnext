/** Communicate the actual rendered slice, not every filtered row. */
export function learnerAssessmentPageSummary({
  filteredCount,totalCount,currentPage,pageSize,label,
}:{
  filteredCount:number;totalCount:number;currentPage:number;pageSize:number;
  label:"assignments"|"quizzes";
}):string {
  const finiteCount=(value:number)=>Number.isFinite(value)?Math.max(0,Math.trunc(value)):0;
  const count=finiteCount(filteredCount);
  const total=Math.max(count,finiteCount(totalCount));
  const size=Number.isFinite(pageSize)?Math.max(1,Math.trunc(pageSize)):25;
  const pages=Math.max(1,Math.ceil(count/size));
  const page=Number.isFinite(currentPage)?Math.min(pages,Math.max(1,Math.trunc(currentPage))):1;
  const start=count===0?0:(page-1)*size+1;
  const end=count===0?0:Math.min(count,page*size);
  return `Showing ${start}–${end} of ${count} matching ${label} (${total} published in total).${pages>1?` Page ${page} of ${pages}.`:""}`;
}
