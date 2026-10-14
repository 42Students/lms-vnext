import { z } from "zod";

export const learnerBoardSearchSchema = z.string().trim().max(100).catch("");
export const learnerBoardSprintSchema = z.string().uuid();
export const learnerBoardReleaseSchema = z.string().uuid();
export const learnerBoardPrioritySchema = z.enum(["LOW","MEDIUM","HIGH","CRITICAL"]);
export type LearnerBoardTask = { id: string; title: string; description: string | null; priority?: string; sprintId?: string };

export function filterLearnerBoardTasks<T extends LearnerBoardTask>(
  tasks: readonly T[], searchInput: unknown, options: {
    priority?: string; sprintId?: string; releaseId?: string;
    sprintReleaseById?: ReadonlyMap<string,string>;
  } = {},
): T[] {
  const search = learnerBoardSearchSchema.parse(searchInput).toLocaleLowerCase("en-IN");
  const priority = learnerBoardPrioritySchema.safeParse(options.priority).data;
  const sprintId = learnerBoardSprintSchema.safeParse(options.sprintId).data;
  const releaseId = learnerBoardReleaseSchema.safeParse(options.releaseId).data;
  return tasks.filter(task =>
    (!priority || task.priority === priority) &&
    (!sprintId || task.sprintId === sprintId) &&
    (!releaseId || options.sprintReleaseById?.get(task.sprintId ?? "") === releaseId) &&
    (!search || [task.title, task.description ?? ""].some(value =>
      value.toLocaleLowerCase("en-IN").includes(search))),
  );
}

export type LearnerBoardEmptyState = "NO_TASKS" | "FILTERED_EMPTY" | "RESULTS";
export function learnerBoardEmptyState(total: number, shown: number): LearnerBoardEmptyState {
  if (total === 0) return "NO_TASKS";
  return shown === 0 ? "FILTERED_EMPTY" : "RESULTS";
}

export function learnerBoardActiveFilterCount(filters: {
  search: string; priority: string; sprintId: string; releaseId: string;
}): number {
  return [filters.search.trim(), filters.priority, filters.sprintId, filters.releaseId]
    .filter(Boolean).length;
}
