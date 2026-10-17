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
    months:z.union([z.literal(3),z.literal(6),z.literal(12)]),
  }).strict(),
  z.object({
    action: z.literal("REVOKE"), confirmed: z.literal(true),
    grantId: z.string().uuid(),
    expectedUpdatedAt: z.iso.datetime({ offset: true }),
  }).strict(),
]);
export function isRecruiterGrantStale(
  updatedAt: Date, expectedUpdatedAt: string,
): boolean {
  return updatedAt.toISOString() !== new Date(expectedUpdatedAt).toISOString();
}
