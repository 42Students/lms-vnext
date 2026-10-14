import { z } from "zod";

export const tpoCompanyLifecycleSchema = z.object({
  companyId: z.string().uuid(),
  expectedUpdatedAt: z.string().datetime({ offset: true }),
  action: z.enum(["ARCHIVE", "RESTORE", "EDIT_TRUST"]),
  nextTrusted: z.boolean().optional(),
  reason: z.string().trim().min(8).max(500),
  confirmed: z.literal(true),
}).strict().superRefine((value, ctx) => {
  if (value.action === "EDIT_TRUST" && value.nextTrusted === undefined) {
    ctx.addIssue({ code: "custom", path: ["nextTrusted"],
      message: "A new trusted value is required" });
  }
  if (value.action !== "EDIT_TRUST" && value.nextTrusted !== undefined) {
    ctx.addIssue({ code: "custom", path: ["nextTrusted"],
      message: "Trust cannot change in a lifecycle action" });
  }
});

export function decideTpoCompanyLifecycle(
  stored: { status: string; updatedAt: Date; isTrusted: boolean },
  input: z.infer<typeof tpoCompanyLifecycleSchema>,
  hasActiveDrives: boolean,
) {
  if (stored.updatedAt.toISOString() !== new Date(input.expectedUpdatedAt).toISOString()) {
    return "STALE" as const;
  }
  if (input.action === "ARCHIVE") {
    if (stored.status !== "ACTIVE") return "STALE" as const;
    if (hasActiveDrives) return "ACTIVE_DRIVES" as const;
  } else if (input.action === "RESTORE") {
    if (stored.status !== "ARCHIVED") return "STALE" as const;
  } else if (stored.status !== "ACTIVE" || stored.isTrusted === input.nextTrusted) {
    return "STALE" as const;
  }
  return "ALLOW" as const;
}
