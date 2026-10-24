/** The Mentor List must group the entire authorized, already-filtered task set
 * before paging each sprint independently. A global 150-task slice can hide
 * a whole old sprint when one active sprint has many tasks.
 */
export type MentorBoardGroupTask={id:string;sprintId:string|null};
export type MentorBoardGroupSprint={id:string;title:string;sequence:number;status:string;releaseId:string};
export function mentorBoardSprintTaskCounts(
 tasks:readonly MentorBoardGroupTask[],
):Map<string,number>{
 const counts=new Map<string,number>();
 for(const item of tasks){
  const key=item.sprintId??"BACKLOG";
  counts.set(key,(counts.get(key)??0)+1);
 }
 return counts;
}
export function mentorBoardSprintGroups<T extends MentorBoardGroupTask>(
 sprints:readonly MentorBoardGroupSprint[],
 tasks:readonly T[],
 counts:Readonly<Record<string,number>>={},
 chunk=20,
){
 const grouped=new Map<string,T[]>();
 for(const task of tasks){
  const key=task.sprintId??"BACKLOG";
  const bucket=grouped.get(key)??[];
  bucket.push(task);grouped.set(key,bucket);
 }
 return [...sprints.map(sprint=>({
  id:sprint.id,title:"Sprint "+sprint.sequence+" · "+sprint.title,
  status:sprint.status,releaseId:sprint.releaseId,
 })),
 {id:"BACKLOG",title:"Product backlog · not in a sprint",
  status:"BACKLOG",releaseId:null}].flatMap(group=>{
  const all=grouped.get(group.id)??[];
  if(!all.length)return [];
  const requested=counts[group.id]??chunk;
  const limit=Number.isSafeInteger(requested)?
    Math.max(chunk,Math.min(100000,requested)):chunk;
  return [{...group,allCount:all.length,tasks:all.slice(0,limit),
    remaining:Math.max(0,all.length-limit)}];
 });
}
