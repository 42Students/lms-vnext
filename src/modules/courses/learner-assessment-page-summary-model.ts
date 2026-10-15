/** Communicate the actual rendered slice, not every filtered row. */
export function learnerAssessmentPageSummary({
  filteredCount,totalCount,currentPage,pageSize,label,
}:{
  filteredCount:number;totalCount:number;currentPage:number;pageSize:number;
  label:"assignments"|"quizzes";
}):string {
  const count=Math.max(0,Math.trunc(filteredCount));
  const total=Math.max(count,Math.trunc(totalCount));
  const size=Math.max(1,Math.trunc(pageSize));
  const pages=Math.max(1,Math.ceil(count/size));
  const page=Math.min(pages,Math.max(1,Math.trunc(currentPage)));
  const start=count===0?0:(page-1)*size+1;
  const end=count===0?0:Math.min(count,page*size);
  return `Showing ${start}–${end} of ${count} matching ${label} (${total} published in total).${pages>1?` Page ${page} of ${pages}.`:""}`;
}
