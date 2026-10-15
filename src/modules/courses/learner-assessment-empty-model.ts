/** A filtered empty page must not imply the learner has no published work. */
export function learnerAssessmentEmptyMessage(input:{
 kind:"ASSIGNMENT"|"QUIZ";courseSelected:boolean;search:string;stateFilter:string;
}):{title:string;description:string}{
 const kind=input.kind==="ASSIGNMENT"?"assignments":"quizzes";
 const search=input.search.trim();
 if(search)return {
  title:`No ${kind} match “${search.slice(0,100)}”`,
  description:"Try a different search or clear assessment filters.",
 };
 if(input.stateFilter!=="ALL")return {
  title:`No ${kind} in this state`,
  description:"Change the state filter to review other published work.",
 };
 if(input.courseSelected)return {
  title:`No ${kind} in this course`,
  description:"Choose another course or clear assessment filters.",
 };
 return {title:`No matching ${kind}`,description:"Clear assessment filters to view other published work."};
}
