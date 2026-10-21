import { z } from "zod";

/** A stale workspace header may not delete or restore a newer revision. */
export const projectSoftDeleteInputSchema = z.strictObject({
  expectedUpdatedAt: z.iso.datetime({ offset: true }),
});
