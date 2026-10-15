export type CourseOverviewLesson = {
  contents: readonly {progress:{completedAt:Date|null}}[];
  assignments: readonly {title:string;dueAt:Date|null;submittedAt:Date|null}[];
  quizzes: readonly {title:string;dueAt:Date|null;progress:{status:string}}[];
};
export function learnerCourseListSignals(
  lessons:readonly CourseOverviewLesson[],
  summary:{overallPercent:number;itemsTotal:number},
  now:Date,
) {
  const percentage=summary.itemsTotal>0 && Number.isFinite(summary.overallPercent)
    ? Math.min(100,Math.max(0,summary.overallPercent)) : null;
  const activity=lessons.flatMap(lesson=>[
    ...lesson.contents.map(item=>item.progress.completedAt?.getTime()??null),
    ...lesson.assignments.map(item=>item.submittedAt?.getTime()??null),
  ]).filter((value):value is number=>value!==null && Number.isFinite(value));
  // Spreading a long history into Math.max overflows the argument stack.
  const latest=activity.reduce((value,when)=>Math.max(value,when),Number.NEGATIVE_INFINITY);
  const lastActivity=Number.isFinite(latest)?new Date(latest).toISOString():null;
  const due=lessons.flatMap(lesson=>[
    ...lesson.assignments.filter(item=>!item.submittedAt && item.dueAt)
      .map(item=>({title:item.title,dueAt:item.dueAt!,kind:"Assignment" as const})),
    ...lesson.quizzes.filter(item=>item.progress.status==="NOT_STARTED" && item.dueAt)
      .map(item=>({title:item.title,dueAt:item.dueAt!,kind:"Quiz" as const})),
  ]).filter(item=>Number.isFinite(now.getTime()) && Number.isFinite(item.dueAt.getTime()) && item.dueAt.getTime()>=now.getTime())
    .sort((a,b)=>a.dueAt.getTime()-b.dueAt.getTime());
  const overdueAssignments=lessons.flatMap(lesson=>lesson.assignments)
    .filter(item=>!item.submittedAt && item.dueAt &&
      Number.isFinite(item.dueAt.getTime()) && item.dueAt.getTime()<now.getTime()).length;
  return {percentage,lastActivity,overdueAssignments,nextDue:due[0]
    ? {title:due[0].title,kind:due[0].kind,dueAt:due[0].dueAt.toISOString()} : null};
}
