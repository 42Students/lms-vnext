/** Course completion for the Faculty prototype: published, visible videos,
 * assignments and quizzes, following the same denominator as the admin
 * progress report. The latest video attempt may suppress an old completion. */
export type FacultyCourseCompletionInput={
 learnerIds:readonly string[];
 videoIds:readonly string[];
 assignmentIds:readonly string[];
 quizIds:readonly string[];
 videos:readonly {membershipId:string;itemId:string;attempt:number;
  completedAt:Date|null;legacyWasDeleted:boolean|null}[];
 assignments:readonly {membershipId:string;itemId:string}[];
 quizzes:readonly {membershipId:string;itemId:string;attemptNumber:number;
  submittedAt:Date;score:number;maxScore:number}[];
};

export function facultyCourseCompletion(input:FacultyCourseCompletionInput){
 const videoIds=new Set(input.videoIds),assignmentIds=new Set(input.assignmentIds),
  quizIds=new Set(input.quizIds),learnerIds=new Set(input.learnerIds);
 const total=videoIds.size+assignmentIds.size+quizIds.size;
 const latestVideo=new Map<string,(typeof input.videos)[number]>();
 for(const row of input.videos){
  if(!learnerIds.has(row.membershipId)||!videoIds.has(row.itemId))continue;
  const key=row.membershipId+":"+row.itemId,previous=latestVideo.get(key);
  if(!previous||row.attempt>previous.attempt)latestVideo.set(key,row);
 }
 const videoDone=new Set([...latestVideo.entries()].filter(([,row])=>
  row.completedAt!==null&&row.legacyWasDeleted!==true).map(([key])=>key));
 const assignmentDone=new Set(input.assignments.filter(row=>
  learnerIds.has(row.membershipId)&&assignmentIds.has(row.itemId))
  .map(row=>row.membershipId+":"+row.itemId));
 const latestQuiz=new Map<string,(typeof input.quizzes)[number]>();
 for(const row of input.quizzes){
  if(!learnerIds.has(row.membershipId)||!quizIds.has(row.itemId))continue;
  const key=row.membershipId+":"+row.itemId,previous=latestQuiz.get(key);
  if(!previous||row.attemptNumber>previous.attemptNumber||
    row.attemptNumber===previous.attemptNumber&&row.submittedAt>previous.submittedAt)
   latestQuiz.set(key,row);
 }
 const quizDone=new Set(latestQuiz.keys());
 const byLearner=[...learnerIds].map(membershipId=>{
  const completed=[...videoIds].filter(id=>videoDone.has(membershipId+":"+id)).length+
   [...assignmentIds].filter(id=>assignmentDone.has(membershipId+":"+id)).length+
   [...quizIds].filter(id=>quizDone.has(membershipId+":"+id)).length;
  return {membershipId,completed,total,
   progressPercent:total>0?Math.round(100*completed/total):null};
 });
 const scores=[...latestQuiz.values()].filter(row=>
  row.maxScore>0&&row.score>=0&&row.score<=row.maxScore)
  .map(row=>100*row.score/row.maxScore);
 const quizAttemptsById=new Map<string,number>();
 for(const row of latestQuiz.values())quizAttemptsById.set(row.itemId,(quizAttemptsById.get(row.itemId)??0)+1);
 return {byLearner,itemsMeasured:total,
  averagePercent:total&&byLearner.length?
   Math.round(100*byLearner.reduce((sum,row)=>sum+row.completed,0)/(total*byLearner.length)):null,
  behindTotal:total?byLearner.filter(row=>row.progressPercent!==null&&row.progressPercent<30).length:null,
  quizAveragePercent:scores.length?
   Math.round(scores.reduce((sum,n)=>sum+n,0)/scores.length):null,
  quizAttemptsById:[...quizAttemptsById].map(([quizId,attempted])=>({quizId,attempted})),
 };
}
