/** Explicitly distinguish missed, unmeasured and read-only Course Home work. */
export function learnerCourseHomeCompletion(input:{
 itemsTotal:number;itemsMissed:number;readOnly:boolean;
}){
 if(input.readOnly)return {
  title:"Review the Learning Path",
  detail:"This historical course is read only. Previously published learning materials remain available.",
 };
 if(input.itemsMissed>0)return {
  title:"No remaining actionable items",
  detail:"Some quiz attempts were missed or closed; review the Learning Path for their recorded status.",
 };
 if(input.itemsTotal>0)return {
  title:"Course work complete",
  detail:"You have completed every currently actionable item.",
 };
 return {
  title:"Open the learning path",
  detail:"Your course workspace is ready. Start with the first published lesson.",
 };
}
