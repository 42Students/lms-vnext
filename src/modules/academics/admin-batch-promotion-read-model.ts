import { z } from "zod";
import { collegePromotionQuerySchema } from "./college-batch-promotion-model";
export const adminPromotionQuerySchema = collegePromotionQuerySchema;
export type AdminPromotionQuery = z.infer<typeof adminPromotionQuerySchema>;
export function readAdminPromotionParams(raw: Record<string, string | string[] | undefined>) {
  // Do not silently select the first value of duplicate security-sensitive IDs.
  const data: Record<string, string> = {};
  for (const key of ["programId", "cohortId", "yearStart"]) {
    const value = raw[key];
    if (Array.isArray(value)) return { success: false as const };
    if (typeof value === "string" && value !== "") data[key] = value;
  }
  return adminPromotionQuerySchema.safeParse(data);
}
export function summarizeAdminPromotion(preview: {
  blockers: readonly string[];
  checkedLearners: number; blockedLearners: number; completePreview: boolean;
  plan: { action: string; targetTermNumber: number | null };
}) {
  return {
    action: preview.plan.action,
    targetTerm: preview.plan.targetTermNumber,
    learnersChecked: preview.checkedLearners,
    blockedLearners: preview.blockedLearners,
    completePreview: preview.completePreview,
    knownBlockers: preview.blockers.length,
  };
}
