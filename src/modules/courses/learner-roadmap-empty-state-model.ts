/** Explain the difference between unpublished, empty published, and populated learning paths. */
export function learnerRoadmapEmptyState(
  hasPublishedPath:boolean,lessons:readonly {items:readonly unknown[]}[],
):{title:string;description:string}|null{
 if(!hasPublishedPath)return {title:"No roadmap items yet",description:"Create lessons and add content to show the learner roadmap."};
 if(lessons.length===0)return {title:"No roadmap items yet",description:"Create lessons and add content to show the learner roadmap."};
 if(lessons.every(lesson=>lesson.items.length===0))return {title:"No lesson content yet",description:"No content in this lesson yet."};
 return null;
}
