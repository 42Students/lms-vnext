/** Explain the difference between unpublished, empty published, and populated learning paths. */
export function learnerRoadmapEmptyState(
  hasPublishedPath:boolean,lessons:readonly {items:readonly unknown[]}[],
):{title:string;description:string}|null{
 if(!hasPublishedPath)return {title:"Learning path is being prepared",description:"The learning path is not published yet."};
 if(lessons.length===0)return {title:"No lessons published yet",description:"Your Faculty has not added lessons to this published Learning Path."};
 if(lessons.every(lesson=>lesson.items.length===0))return {title:"No learning items published yet",description:"Lessons are visible but have nothing available to open or complete."};
 return null;
}
