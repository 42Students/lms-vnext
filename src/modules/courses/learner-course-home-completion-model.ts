/** Explicitly distinguish missed, unmeasured and read-only Course Home work. */
export function learnerCourseHomeCompletion(input:{
 itemsTotal:number;itemsCompleted:number;itemsMissed:number;readOnly:boolean;hasNextAction?:boolean;hasPublishedPath?:boolean;
}){
 if(input.readOnly)return {
  title:"Review the Learning Path",
  detail:"This historical course is read only. Previously published learning materials remain available.",
 };
 if(input.hasPublishedPath===false)return {
  title:"Learning path not published",
  detail:"Your course team has not published a learning path yet. No learner work has been assumed.",
 };
 if(input.itemsMissed>0&&input.hasNextAction)return {
  title:"Continue learning",
  detail:"A previous quiz was missed, but other published course work is still available to complete.",
 };
 if(input.itemsMissed>0)return {
  title:"No remaining actionable items",
  detail:"Some quiz attempts were missed or closed; review the Learning Path for their recorded status.",
 };
 if(input.itemsCompleted<input.itemsTotal)return {
  title:"Learning in progress",
  detail:"Some published course items remain incomplete. Review the Learning Path to continue or see their recorded states.",
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
