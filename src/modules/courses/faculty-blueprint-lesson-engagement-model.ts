import {facultyCourseCompletion} from "./faculty-course-completion-model";

export type FacultyBlueprintLessonEngagement={
 lessonId:string;rosterTotal:number;trackedItems:number;engagedBy:number;completedBy:number;
};
type Video={membershipId:string;itemId:string;attempt:number;completedAt:Date|null;
 legacyWasDeleted:boolean|null;lastPositionSeconds:number};
type Quiz={membershipId:string;itemId:string;attemptNumber:number;submittedAt:Date;score:number;maxScore:number};
type Submission={membershipId:string;itemId:string};
/** Only real recorded activity from authorized enrolled learners is counted.
 * No available field measures cumulative time spent or general resource opens. */
export function facultyBlueprintLessonEngagement(input:{
 learnerIds:readonly string[];
 lessons:readonly {lessonId:string;videoIds:readonly string[];
  assignmentIds:readonly string[];quizIds:readonly string[]}[];
 videos:readonly Video[];quizzes:readonly Quiz[];assignments:readonly Submission[];
}):FacultyBlueprintLessonEngagement[]{
 const roster=[...new Set(input.learnerIds)],rosterSet=new Set(roster);
 return input.lessons.map(lesson=>{
  const videoIds=[...new Set(lesson.videoIds)],assignmentIds=[...new Set(lesson.assignmentIds)],
   quizIds=[...new Set(lesson.quizIds)];
  const videoSet=new Set(videoIds),assignmentSet=new Set(assignmentIds),quizSet=new Set(quizIds);
  const videos=input.videos.filter(row=>rosterSet.has(row.membershipId)&&videoSet.has(row.itemId));
  const quizzes=input.quizzes.filter(row=>rosterSet.has(row.membershipId)&&quizSet.has(row.itemId));
  const assignments=input.assignments.filter(row=>rosterSet.has(row.membershipId)&&assignmentSet.has(row.itemId));
  const latestVideos=new Map<string,Video>();
  for(const row of videos){
   const key=row.membershipId+":"+row.itemId,previous=latestVideos.get(key);
   if(!previous||row.attempt>previous.attempt)latestVideos.set(key,row);
  }
  const engaged=new Set<string>();
  for(const row of latestVideos.values())
   if(row.legacyWasDeleted!==true&&(row.lastPositionSeconds>0||row.completedAt!==null))
    engaged.add(row.membershipId);
  for(const row of quizzes)engaged.add(row.membershipId);
  for(const row of assignments)engaged.add(row.membershipId);
  const completion=facultyCourseCompletion({
   learnerIds:roster,videoIds,assignmentIds,quizIds,videos,quizzes,assignments,
  });
  const trackedItems=videoIds.length+assignmentIds.length+quizIds.length;
  return {lessonId:lesson.lessonId,rosterTotal:roster.length,trackedItems,
   engagedBy:engaged.size,
   completedBy:trackedItems?completion.byLearner.filter(row=>row.completed===trackedItems).length:0};
 });
}
