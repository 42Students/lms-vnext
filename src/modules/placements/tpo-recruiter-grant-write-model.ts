import { z } from "zod";

export const tpoRecruiterGrantChangeSchema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("GRANT"), confirmed: z.literal(true),
    companyRelationshipId: z.string().uuid(),
    email: z.string().trim().toLowerCase().max(320).pipe(z.email()),
    title: z.string().trim().max(160).nullable().optional(),
  }).strict(),
  z.object({
    action:z.literal("EXTEND"),confirmed:z.literal(true),
    grantId:z.string().uuid(),expectedUpdatedAt:z.iso.datetime({offset:true}),
    // vNext deliberately requires a finite end; unlike legacy, 0 does not
    // grant perpetual recruiter access. Omitted duration keeps legacy 6 months.
    months:z.number().int()
      .min(1,"Choose between 1 and 60 months")
      .max(60,"Choose between 1 and 60 months")
      .nullish().transform(value=>value??6),
  }).strict(),
  z.object({
    action: z.literal("REVOKE"), confirmed: z.literal(true),
    grantId: z.string().uuid(),
    expectedUpdatedAt: z.iso.datetime({ offset: true }),
    reason:z.string().trim().max(500,"Keep the reason under 500 characters")
      .nullable().optional(),
  }).strict(),
]);
export function isRecruiterGrantStale(
  updatedAt: Date, expectedUpdatedAt: string,
): boolean {
  return updatedAt.toISOString() !== new Date(expectedUpdatedAt).toISOString();
}
