import { z } from "zod";

export const learnerBoardSearchSchema = z.string().trim().max(100).catch("");
export const learnerBoardSprintSchema = z.string().uuid();
export const learnerBoardPrioritySchema = z.enum(["LOW","MEDIUM","HIGH","CRITICAL"]);
export type LearnerBoardTask = { id: string; title: string; description: string | null; priority?: string; sprintId?: string };

export function filterLearnerBoardTasks<T extends LearnerBoardTask>(
  tasks: readonly T[], searchInput: unknown, options: {priority?: string;sprintId?: string} = {},
): T[] {
  const search = learnerBoardSearchSchema.parse(searchInput).toLocaleLowerCase("en-IN");
  const priority = learnerBoardPrioritySchema.safeParse(options.priority).data;
  const sprintId = learnerBoardSprintSchema.safeParse(options.sprintId).data;
  return tasks.filter(task =>
    (!priority || task.priority === priority) &&
    (!sprintId || task.sprintId === sprintId) &&
    (!search || [task.title, task.description ?? ""].some(value =>
      value.toLocaleLowerCase("en-IN").includes(search))),
  );
}
