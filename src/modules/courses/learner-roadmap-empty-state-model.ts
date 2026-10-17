/** Explain the difference between unpublished, empty published, and populated learning paths. */
export function learnerRoadmapEmptyState(
  hasPublishedPath:boolean,lessons:readonly {items:readonly unknown[]}[],
):{title:string;description:string}|null{
 if(!hasPublishedPath)return {title:"No roadmap items yet",description:"Create lessons and add content to show the learner roadmap."};
 if(lessons.length===0)return {title:"No lessons published yet",description:"Your teacher has not published any lessons in this course."};
 if(lessons.every(lesson=>lesson.items.length===0))return {title:"No learning items published yet",description:"Your teacher has not added learner-visible content to these lessons."};
 return null;
}
