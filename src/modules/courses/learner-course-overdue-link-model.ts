type Lesson={id:string;assignments:readonly {id:string;title:string;dueAt:Date|null;submittedAt:Date|null}[]};
/** Only persisted due dates and learner-owned unsubmitted published work can form a deep link. */
export function selectLearnerOverdueAssignment(lessons:readonly Lesson[],nowMs:number){
 if(!Number.isFinite(nowMs))return null;
 const due=lessons.flatMap(lesson=>lesson.assignments
   .filter(item=>!item.submittedAt && item.dueAt && Number.isFinite(item.dueAt.getTime()) && item.dueAt.getTime()<=nowMs)
   .map(item=>({lessonId:lesson.id,itemId:item.id,title:item.title,dueMs:item.dueAt!.getTime()})));
 const first=due.sort((a,b)=>a.dueMs-b.dueMs || a.itemId.localeCompare(b.itemId))[0];
 return first?{lessonId:first.lessonId,itemId:first.itemId,title:first.title}:null;
}
