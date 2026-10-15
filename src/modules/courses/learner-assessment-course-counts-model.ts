type Item={courseId:string};
/** Count only already-authorized published assessments by Course. */
export function learnerAssessmentCourseCounts(items:readonly Item[]):ReadonlyMap<string,number>{
 const counts=new Map<string,number>();
 for(const item of items)counts.set(item.courseId,(counts.get(item.courseId)??0)+1);
 return counts;
}
