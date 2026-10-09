import { z } from "zod";

const scopeTypeSchema = z.enum(["MEMBERSHIP", "SECTION", "COHORT"]);
const decisionStatusSchema = z.enum(["ELIGIBLE", "INELIGIBLE"]);

export const placementEligibilityChangeSchema = z
  .object({
    scopeType: scopeTypeSchema,
    scopeId: z.string().uuid(),
    status: decisionStatusSchema,
    reason: z.string().max(200).nullable().optional()
      .transform((value) => value?.trim() || null),
    note: z.string().max(300).nullable().optional()
      .transform((value) => value?.trim() || null),
  })
  .superRefine((value, ctx) => {
    if (value.status === "INELIGIBLE" && !value.reason) {
      ctx.addIssue({
        code: "custom",
        path: ["reason"],
        message: "An ineligible decision requires a reason",
      });
    }
  });

export const placementEligibilityBulkActionSchema = z
  .object({
    actionId: z.string().uuid(),
    collegeId: z.string().uuid(),
    changes: z.array(placementEligibilityChangeSchema).min(1).max(200),
  })
  .superRefine((value, ctx) => {
    const seen = new Set<string>();
    value.changes.forEach((change, index) => {
      const key = `${change.scopeType}:${change.scopeId}`;
      if (seen.has(key)) {
        ctx.addIssue({
          code: "custom",
          path: ["changes", index, "scopeId"],
          message: "A scope cannot be changed twice in one action",
        });
      }
      seen.add(key);
    });
  });

export const placementEligibilityUndoSchema = z.object({
  actionId: z.string().uuid(),
  collegeId: z.string().uuid(),
});

export type PlacementEligibilityBulkActionInput =
  z.infer<typeof placementEligibilityBulkActionSchema>;

/** Deterministic order ensures identical retries have identical payloads. */
export function normalizePlacementEligibilityBulkAction(raw: unknown) {
  const parsed = placementEligibilityBulkActionSchema.parse(raw);
  return {
    ...parsed,
    changes: [...parsed.changes].sort((a, b) =>
      `${a.scopeType}:${a.scopeId}`.localeCompare(
        `${b.scopeType}:${b.scopeId}`,
      ),
    ),
  };
}
