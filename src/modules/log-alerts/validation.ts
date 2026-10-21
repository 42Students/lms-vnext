import { z } from "zod";

export const knownErrorIdSchema = z.string().uuid();
export const knownErrorListSchema = z.object({
  environment: z.enum(["PRODUCTION", "UAT", "DEVELOPMENT"]).default("PRODUCTION"),
  limit: z.coerce.number().int().min(1).max(100).default(40),
}).strict();

export const knownErrorMutationSchema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("MUTE"),
    muted: z.boolean(),
    reason: z.string().trim().max(255).optional(),
  }).strict(),
  z.object({
    action: z.literal("STATUS"),
    status: z.enum(["OPEN", "FIXED", "EXPECTED"]),
    commit: z.string().trim().regex(/^[0-9a-f]{7,64}$/i).optional(),
    note: z.string().trim().max(500).optional(),
    issuePublicId: z.string().trim().min(1).max(32).optional(),
  }).strict(),
  z.object({ action: z.literal("ACKNOWLEDGE") }).strict(),
  z.object({
    action: z.literal("LINK_ISSUE"),
    issuePublicId: z.string().trim().max(32).nullable(),
  }).strict(),
]);

export type KnownErrorMutation = z.infer<typeof knownErrorMutationSchema>;

/** Optional legacy error-signature mute adapter. Never accept an arbitrary
 * raw path/message as a signature ID: resolve one exact, environment-scoped
 * persisted sample first. An ambiguous/missing sample fails closed.
 */
export const legacyKnownErrorMuteLookupSchema=z.strictObject({
 environment:z.enum(["PRODUCTION","UAT","DEVELOPMENT"]),
 message:z.string().trim().min(1).max(500),
 path:z.string().trim().min(1).max(255),
 muted:z.boolean(),
 reason:z.string().trim().max(255).optional(),
});
