/** SA-academics-people-67: percentage of measured records, not a claim of attendance. */
export function studentCourseCompletion(input:{
 videos:number;assignments:number;quizzes:number;
 totalVideos:number;totalAssignments:number;totalQuizzes:number;
}):number|null{
 const totals=[input.totalVideos,input.totalAssignments,input.totalQuizzes];
 if(totals.some(n=>!Number.isSafeInteger(n)||n<0))return null;
 const total=totals.reduce((sum,value)=>sum+value,0);
 if(total===0)return null;
 const completed=[input.videos,input.assignments,input.quizzes]
  .map((n,i)=>Math.max(0,Math.min(totals[i]!,Number.isFinite(n)?n:0)))
  .reduce((sum,value)=>sum+value,0);
 return Math.round(completed/total*100);
}

/** Match the legacy no-work/no-roster reason, never report a fabricated zero %. */
export function studentCourseProgressEmptyNote(input:{
 measuredItemCount:number;activeLearnerCount:number;
}):string|null {
 if(!Number.isSafeInteger(input.measuredItemCount)||input.measuredItemCount<0||
    !Number.isSafeInteger(input.activeLearnerCount)||input.activeLearnerCount<0)
  return null;
 if(input.measuredItemCount===0)
  return "This course has no videos, assignments or quizzes for this class yet, so there is nothing measurable to report.";
 if(input.activeLearnerCount===0)return "This class has no active learners.";
 return null;
}
