export type RecentCourseActivityLesson={
  id:string;
  contents:readonly {id:string;title:string;type:string;
    progress:{completedAt:Date|null}}[];
  assignments:readonly {id:string;title:string;submittedAt:Date|null}[];
};
/** Persisted learner completions only. No invented teacher message/grade date. */
export function learnerRecentCourseActivity(
  lessons:readonly RecentCourseActivityLesson[],nowMs:number,withinDays=14,
){
  const cutoff=nowMs-withinDays*86_400_000;
  const candidate=lessons.flatMap(lesson=>[
    ...lesson.contents.flatMap(content=>{
      const when=content.progress.completedAt;
      return when && when.getTime()<=nowMs && when.getTime()>=cutoff
        ? [{id:content.id,lessonId:lesson.id,title:content.title,
          label:"Content completed",when,
          filter:content.type==="RESOURCE"?"resources":content.type==="LIVE_CLASS"?"live-sessions":"lectures"}]
        :[];
    }),
    ...lesson.assignments.flatMap(assignment=>{
      const when=assignment.submittedAt;
      return when && when.getTime()<=nowMs && when.getTime()>=cutoff
        ? [{id:assignment.id,lessonId:lesson.id,title:assignment.title,
          label:"Assignment submitted",when,filter:"assessments"}]
        :[];
    }),
  ]);
  return candidate.sort((a,b)=>b.when.getTime()-a.when.getTime()||
    a.id.localeCompare(b.id));
}
