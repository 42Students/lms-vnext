export type LearnerProjectTaskFacts = {
  assigneeMembershipId: string | null;
  dueDate: string | null;
  estimatePoints: number | null;
  taskType: string | null;
  blockerReason: string | null;
};
export function projectTaskDueLabel(date: string | null): string {
  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) return "No due date";
  const parsed = new Date(date + "T12:00:00.000Z");
  if (Number.isNaN(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== date) return "No due date";
  return new Intl.DateTimeFormat("en-IN", {
    timeZone: "Asia/Kolkata", day: "numeric", month: "short", year: "numeric",
  }).format(parsed);
}
export function projectTaskVisibleFacts(
  task: LearnerProjectTaskFacts,
  assigneeName: string | null,
) {
  return {
    assignee: task.assigneeMembershipId ? assigneeName ?? "Assigned member" : "Unassigned",
    dueDate: projectTaskDueLabel(task.dueDate),
    estimate: task.estimatePoints == null ? "Not estimated" : task.estimatePoints + " points",
    taskType: task.taskType ? task.taskType.toLowerCase().replace(/\b\w/g, c => c.toUpperCase()) : "Not set",
    blockerReason: task.blockerReason?.trim() || null,
  };
}

/** MEN-projects-meetings-41: due state uses the project viewer's IST day. */
export function projectTaskDueState(dueDate: string | null,status:string,now:Date):string|null {
  if(!dueDate||!/^[0-9]{4}-[0-9]{2}-[0-9]{2}$/.test(dueDate)||status==="DONE")return null;
  const today=new Intl.DateTimeFormat("en-CA",{timeZone:"Asia/Kolkata",year:"numeric",month:"2-digit",day:"2-digit"}).format(now);
  const difference=Math.round((new Date(dueDate+"T00:00:00Z").getTime()-
    new Date(today+"T00:00:00Z").getTime())/86400000);
  return difference<0?"Overdue":difference<=3?"Due soon":null;
}
