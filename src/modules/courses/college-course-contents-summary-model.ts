type CourseContentLesson={
  contents:readonly {contentType:"VIDEO"|"YOUTUBE"|"RESOURCE"|"LIVE_CLASS"}[];
  assignments:readonly unknown[];
  quizzes:readonly unknown[];
};
export function summarizeCollegeCourseContents(lessons:readonly CourseContentLesson[]){
  const totals={lessons:lessons.length,videos:0,resources:0,liveClasses:0,assignments:0,quizzes:0};
  for(const lesson of lessons){
    for(const item of lesson.contents){
      if(item.contentType==="VIDEO"||item.contentType==="YOUTUBE")totals.videos++;
      if(item.contentType==="RESOURCE")totals.resources++;
      if(item.contentType==="LIVE_CLASS")totals.liveClasses++;
    }
    totals.assignments+=lesson.assignments.length;
    totals.quizzes+=lesson.quizzes.length;
  }
  return [
    {key:"lessons",label:"Lessons",count:totals.lessons},
    {key:"videos",label:"Videos",count:totals.videos},
    {key:"resources",label:"Resources",count:totals.resources},
    {key:"liveClasses",label:"Live classes",count:totals.liveClasses},
    {key:"assignments",label:"Assignments",count:totals.assignments},
    {key:"quizzes",label:"Quizzes",count:totals.quizzes},
  ] as const;
}
