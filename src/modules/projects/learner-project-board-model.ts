import { z } from "zod";

export const learnerBoardSearchSchema = z.string().trim().max(100).catch("");
export const learnerBoardPrioritySchema = z.enum(["LOW","MEDIUM","HIGH","CRITICAL"]);
export type LearnerBoardTask = { id: string; title: string; description: string | null; priority?: string };

export function filterLearnerBoardTasks<T extends LearnerBoardTask>(
  tasks: readonly T[], searchInput: unknown, options: {priority?: string} = {},
): T[] {
  const search = learnerBoardSearchSchema.parse(searchInput).toLocaleLowerCase("en-IN");
  const priority = learnerBoardPrioritySchema.safeParse(options.priority).data;
  return tasks.filter(task =>
    (!priority || task.priority === priority) &&
    (!search || [task.title, task.description ?? ""].some(value =>
      value.toLocaleLowerCase("en-IN").includes(search))),
  );
}
