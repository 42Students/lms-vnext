/** Source transparency for learner course About text; never derive authored text. */
export function learnerCourseAboutSource({
  safeBodyHtml,courseDescription,learningPathDescription,
}:{
  safeBodyHtml:string|null;courseDescription:string|null;
  learningPathDescription:string|null;
}) {
  if(safeBodyHtml?.trim())return {source:"AUTHORED" as const,
    label:"Course-team authored overview",hasDescription:true};
  if(courseDescription?.trim())return {source:"CATALOGUE" as const,
    label:"Course catalogue description",hasDescription:true};
  if(learningPathDescription?.trim())return {source:"PATH" as const,
    label:"Published learning-path description",hasDescription:true};
  return {source:"NONE" as const,label:"No description has been published",hasDescription:false};
}
