import { z } from "zod";

/** An admin task-plan request contains changed rows only, never a replacement workspace. */
export const projectTaskPlanRowSchema = z.strictObject({
  id: z.string().uuid(),
  key: z.string().trim().min(1).max(120),
  title: z.string().trim().min(1).max(200),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]),
  sprintId: z.string().uuid().nullable(),
  estimatePoints: z.number().int().min(0).max(1000).nullable(),
  taskType: z.enum(["STORY", "BUG", "CHORE", "SPIKE"]).nullable(),
  dueLabel: z.string().trim().max(160).nullable(),
  description: z.string().trim().max(4000).nullable(),
  acceptanceCriteria: z.string().trim().max(4000).nullable(),
  approach: z.string().trim().max(4000).nullable(),
});
export type ProjectTaskPlanRow = z.infer<typeof projectTaskPlanRowSchema>;

export const projectTaskPlanSchema = z.strictObject({
  expectedTasksToken: z.string().regex(/^[0-9a-f]{64}$/),
  tasks: z.array(projectTaskPlanRowSchema).min(1).max(100),
}).superRefine((input, ctx) => {
  const seen = new Set<string>();
  input.tasks.forEach((row, index) => {
    if (seen.has(row.id)) {
      ctx.addIssue({ code: "custom", path: ["tasks", index, "id"], message: "Duplicate task" });
    }
    seen.add(row.id);
  });
});

export function projectTaskPlanChanged(
  before: {
    templateKey: string; legacyTaskKey: string | null; title: string;
    priority: string; sprintId: string | null; estimatePoints: number | null;
    taskType: string | null; dueLabel: string | null; description: string | null;
    acceptanceCriteria: string | null; approach: string | null;
  },
  next: ProjectTaskPlanRow,
): boolean {
  return (before.legacyTaskKey || before.templateKey) !== next.key ||
    before.title !== next.title || before.priority !== next.priority ||
    before.sprintId !== next.sprintId || before.estimatePoints !== next.estimatePoints ||
    before.taskType !== next.taskType || before.dueLabel !== next.dueLabel ||
    before.description !== next.description ||
    before.acceptanceCriteria !== next.acceptanceCriteria || before.approach !== next.approach;
}
