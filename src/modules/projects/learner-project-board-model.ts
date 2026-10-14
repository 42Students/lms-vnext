import { z } from "zod";

export const learnerBoardSearchSchema = z.string().trim().max(100).catch("");
export type LearnerBoardTask = { id: string; title: string; description: string | null };

export function filterLearnerBoardTasks<T extends LearnerBoardTask>(
  tasks: readonly T[], searchInput: unknown,
): T[] {
  const search = learnerBoardSearchSchema.parse(searchInput).toLocaleLowerCase("en-IN");
  if (!search) return [...tasks];
  return tasks.filter(task =>
    [task.title, task.description ?? ""].some(value =>
      value.toLocaleLowerCase("en-IN").includes(search)),
  );
}
