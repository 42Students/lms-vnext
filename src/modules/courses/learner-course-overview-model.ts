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
  const lastActivity=activity.length ? new Date(Math.max(...activity)).toISOString() : null;
  const due=lessons.flatMap(lesson=>[
    ...lesson.assignments.filter(item=>!item.submittedAt && item.dueAt)
      .map(item=>({title:item.title,dueAt:item.dueAt!,kind:"Assignment" as const})),
    ...lesson.quizzes.filter(item=>item.progress.status!=="COMPLETED" && item.dueAt)
      .map(item=>({title:item.title,dueAt:item.dueAt!,kind:"Quiz" as const})),
  ]).filter(item=>item.dueAt.getTime()>=now.getTime())
    .sort((a,b)=>a.dueAt.getTime()-b.dueAt.getTime());
  return {percentage,lastActivity,nextDue:due[0]
    ? {title:due[0].title,kind:due[0].kind,dueAt:due[0].dueAt.toISOString()} : null};
}
