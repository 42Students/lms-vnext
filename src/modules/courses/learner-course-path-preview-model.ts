export type LearnerPathPreviewInput={
  id:string;name:string;sequence:number;
  items:readonly {progress:{status:string}}[];
};
/** Only persisted, published lesson items are counted. No invented outcomes. */
export function learnerCoursePathPreview(lessons:readonly LearnerPathPreviewInput[],limit=5){
  const rows=[...lessons].sort((a,b)=>a.sequence-b.sequence||a.id.localeCompare(b.id))
    .map(lesson=>{
      const total=lesson.items.length;
      const completed=lesson.items.filter(item=>item.progress.status==="COMPLETED").length;
      return {id:lesson.id,name:lesson.name,total,completed,
        progress:total>0?Math.round(100*completed/total):null};
    });
  return {lessons:rows.slice(0,limit),totalLessons:rows.length,
    remaining:Math.max(0,rows.length-limit)};
}
