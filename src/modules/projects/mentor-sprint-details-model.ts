import { z } from "zod";

/** Sprint dates/goals do not exist as independent migrated fields. */
export const mentorSprintDetailsSchema = z.object({
  title: z.string().trim().min(1).max(200),
  description: z.string().trim().max(4000).nullable(),
  expectedUpdatedAt: z.iso.datetime({ offset: true }),
}).strict();

export const mentorSprintDetailsParamsSchema = z.object({
  projectId: z.string().uuid(),
  sprintId: z.string().uuid(),
}).strict();

export type MentorSprintDetailsInput = z.infer<typeof mentorSprintDetailsSchema>;

export function sprintDetailsChanged(
  before: { title: string; description: string | null },
  next: Pick<MentorSprintDetailsInput,"title" | "description">,
) {
  return before.title !== next.title ||
    (before.description ?? null) !== next.description;
}
