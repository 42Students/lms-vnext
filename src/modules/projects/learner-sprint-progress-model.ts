type Sprint={id:string;status:string;dueDate:string|null};
type Task={sprintId:string|null;status:string};
export function learnerSprintRollup(sprints:readonly Sprint[],_tasks:readonly Task[],todayIst:string){
 const completed=sprints.filter(s=>s.status==="COMPLETED").length;
 const overdue=sprints.filter(s=>s.status!=="COMPLETED"&&
   s.dueDate!==null&&s.dueDate<todayIst).length;
 return {total:sprints.length,completed,overdue};
}
export function learnerSprintProgress(sprint:Sprint,tasks:readonly Task[]){
 const assigned=tasks.filter(task=>task.sprintId===sprint.id);
 const completed=assigned.filter(task=>task.status==="DONE").length;
 return {total:assigned.length,completed,
   percentage:assigned.length?Math.round(100*completed/assigned.length):
     sprint.status==="COMPLETED"?100:0};
}
