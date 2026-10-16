import { createHash, randomBytes } from "node:crypto";
import { z } from "zod";

/** Raw secrets are issued only once. The database stores the SHA-256 digest. */
export const companyShareTokenSchema = z.string().regex(/^[A-Za-z0-9_-]{43}$/);
export const companyShareJobSchema = z.string().uuid();
export const companyShareIssueSchema = z.object({
  jobId: companyShareJobSchema,
  expiresInDays: z.coerce.number().int().min(1).max(7).default(2),
  selectedApplicationIds:z.array(z.string().uuid()).min(1).max(200)
   .refine(ids=>new Set(ids).size===ids.length,"Duplicate applicant selection").optional(),
}).strict();
export const companyShareRevokeSchema = z.object({
  shareId: z.string().uuid(),
  jobId: companyShareJobSchema,
}).strict();

export function issueCompanyShareToken() {
  const token = randomBytes(32).toString("base64url");
  return { token, digest: hashCompanyShareToken(token) };
}
export function hashCompanyShareToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}
export function isCompanyShareLive(
  record: { expiresAt: Date; revokedAt: Date | null },
  now: Date,
) {
  return Number.isFinite(now.getTime()) &&
    Number.isFinite(record.expiresAt.getTime()) &&
    record.revokedAt === null && record.expiresAt.getTime() > now.getTime();
}
export function companyShareExpiry(now: Date, days: number) {
  const parsed = companyShareIssueSchema.shape.expiresInDays.parse(days);
  return new Date(now.getTime() + parsed * 86_400_000);
}
