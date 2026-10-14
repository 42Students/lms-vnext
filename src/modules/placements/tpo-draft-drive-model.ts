import { z } from "zod";

/** First-step draft fields only. Deadline is ISO with explicit zone offset. */
export const tpoDraftDriveStepOneSchema = z.object({
  confirmed: z.literal(true),
  companyRelationshipId: z.string().uuid(),
  seasonId: z.string().uuid(),
  title: z.string().trim().min(2).max(200),
  description: z.string().trim().min(1).max(20000),
  employmentType: z.enum(["FULL_TIME", "INTERNSHIP", "CONTRACT"]),
  workMode: z.enum(["ONSITE", "REMOTE", "HYBRID"]),
  applicationDeadline: z.iso.datetime({ offset: true }).nullable(),
}).strict().superRefine((value, ctx) => {
  if (value.applicationDeadline &&
      Date.parse(value.applicationDeadline) <= Date.now()) {
    ctx.addIssue({
      code: "custom",
      path: ["applicationDeadline"],
      message: "Application deadline must be a future, offset-qualified instant",
    });
  }
});

export function normalizedTpoDraftDeadline(value: string | null): Date | null {
  if (value === null) return null;
  const instant = new Date(value);
  if (!Number.isFinite(instant.getTime())) throw new Error("Invalid deadline");
  return instant;
}
