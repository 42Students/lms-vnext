/** Source transparency for learner course About text; never derive authored text. */
export function learnerCourseAboutSource({
  safeBodyHtml,courseDescription,learningPathDescription,introductionText,takeaways,
}:{
  safeBodyHtml:string|null;courseDescription:string|null;
  learningPathDescription:string|null;
  introductionText?:string|null;takeaways?:readonly string[];
}) {
  if(safeBodyHtml?.trim())return {source:"AUTHORED" as const,
    label:"Course-team authored overview",hasDescription:true};
  if(courseDescription?.trim())return {source:"CATALOGUE" as const,
    label:"Course catalogue description",hasDescription:true};
  if(learningPathDescription?.trim())return {source:"PATH" as const,
    label:"Published learning-path description",hasDescription:true};
  if(introductionText?.trim() || takeaways?.some(item=>item.trim()))return {source:"SUMMARY" as const,label:"Course-team authored introduction or learning outcomes",hasDescription:true};
  return {source:"NONE" as const,label:"No description has been published",hasDescription:false};
}
