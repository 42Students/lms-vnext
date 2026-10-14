import { z } from "zod";

const taskIdSchema=z.string().uuid();
type TaskIdentity={id:string};
export type LearnerTaskBoardUrlFilters = {
  taskSearch:string;priority:string;sprintId:string;releaseId:string;
};
export function findOwnLearnerBoardTask<T extends TaskIdentity>(
  tasks: readonly T[], input: unknown,
): T | null {
  const id=taskIdSchema.safeParse(input).data;
  return id ? tasks.find(task=>task.id===id) ?? null : null;
}
export function learnerBoardTaskHref(
  projectId:string,filters:LearnerTaskBoardUrlFilters,taskId?:string,
) {
  const params=new URLSearchParams({tab:"board"});
  for(const [key,value] of [
    ["taskSearch",filters.taskSearch],["priority",filters.priority],
    ["sprintId",filters.sprintId],["releaseId",filters.releaseId],
  ] as const) if(value) params.set(key,value);
  if(taskId && taskIdSchema.safeParse(taskId).success)params.set("taskId",taskId);
  return "/learn/projects/"+encodeURIComponent(projectId)+"?"+params.toString();
}
