import { z } from "zod";
import { recurringPreviewSchema } from "./college-recurring-preview-model";

export const collegeRecurringExecuteSchema = recurringPreviewSchema.safeExtend({
  title: z.string().trim().min(1).max(160),
  expectedSectionUpdatedAt: z.iso.datetime({ offset: true }),
  confirm: z.literal(true),
});
export type CollegeRecurringExecuteInput = z.infer<typeof collegeRecurringExecuteSchema>;
export function recurringExecutionSummary(created: number, requested: number) {
  return { created, requested, failed: requested - created, allSucceeded: created === requested };
}
