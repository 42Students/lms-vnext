import { z } from "zod";

/** One release at a time: every row is identified and versioned, never addressed by array index. */
const sprintPlanRowSchema = z.strictObject({
  id: z.string().uuid(),
  expectedUpdatedAt: z.iso.datetime({ offset: true }),
  title: z.string().trim().min(1).max(200),
  description: z.string().trim().max(4000).nullable(),
  goal: z.string().trim().max(4000).nullable(),
  definitionOfDone: z.string().trim().max(4000).nullable(),
  startDate: z.iso.date().nullable(),
  endDate: z.iso.date().nullable(),
  dueDate: z.iso.date().nullable(),
}).superRefine((row, ctx) => {
  if (row.startDate && row.endDate && row.endDate < row.startDate) {
    ctx.addIssue({ code: "custom", path: ["endDate"], message: "End date must follow start date" });
  }
  if (row.startDate && row.dueDate && row.dueDate < row.startDate) {
    ctx.addIssue({ code: "custom", path: ["dueDate"], message: "Due date must not precede start date" });
  }
});

export const projectSprintPlanSchema = z.strictObject({
  releaseId: z.string().uuid(),
  sprints: z.array(sprintPlanRowSchema).min(1).max(100),
}).superRefine((value, ctx) => {
  const seen = new Set<string>();
  value.sprints.forEach((sprint, index) => {
    if (seen.has(sprint.id)) {
      ctx.addIssue({ code: "custom", path: ["sprints", index, "id"], message: "Duplicate sprint" });
    }
    seen.add(sprint.id);
  });
});

export type ProjectSprintPlanInput = z.infer<typeof projectSprintPlanSchema>;
export type ProjectSprintPlanRow = ProjectSprintPlanInput["sprints"][number];

export function projectSprintPlanFieldsChanged(
  previous: {
    title: string; description: string | null; goal: string | null;
    definitionOfDone: string | null; startDate: string | null;
    endDate: string | null; dueDate: string | null;
  },
  next: ProjectSprintPlanRow,
): boolean {
  return previous.title !== next.title ||
    previous.description !== next.description ||
    previous.goal !== next.goal ||
    previous.definitionOfDone !== next.definitionOfDone ||
    previous.startDate !== next.startDate ||
    previous.endDate !== next.endDate ||
    previous.dueDate !== next.dueDate;
}
