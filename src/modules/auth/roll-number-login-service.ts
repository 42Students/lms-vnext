import "server-only";

import { and, eq, sql } from "drizzle-orm";
import { z } from "zod";
import { getDb } from "@/db/client";
import { collegeMemberships, colleges, learnerProfiles, membershipRoles, users } from "@/db/schema";
import { LoginError } from "./login-service";
import { startLoginWithRuntime } from "./runtime";

/**
 * Old roll-number OTP is a lookup alias, NOT an authentication factor.
 * Sign-in still requires a fresh one-time code delivered to the learner's
 * existing registered phone/email. Never issue tokens from roll number alone.
 *
 * Explicit per-college opt-in after domain/privacy review. UUIDs here are
 * trusted tenant-college identities derived from the verified host, not input.
 * The platform host and unreviewed college domains always fail closed.
 */
export const rollNumberStartSchema = z.strictObject({
  rollNumber: z.string().trim().min(1).max(128),
});
export function rollNumberOtpEnabledForCollege(collegeId: string | null): boolean {
  if (!collegeId) return false;
  const allowlist = (process.env.AUTH_ROLL_NUMBER_COLLEGES ?? "")
    .split(",").map(value => value.trim().toLowerCase());
  return allowlist.includes(collegeId.toLowerCase());
}

export async function startLearnerRollNumberLogin(
  raw: unknown, tenantCollegeId: string | null, addressTag: string,
) {
  const input = rollNumberStartSchema.parse(raw);
  if (!rollNumberOtpEnabledForCollege(tenantCollegeId))
    throw new LoginError("CHANNEL_DISABLED");
  const matches = await getDb().select({
    userId: users.id,
    phone: users.phoneE164,
    email: users.email,
  }).from(learnerProfiles)
    .innerJoin(collegeMemberships,
      eq(collegeMemberships.id, learnerProfiles.membershipId))
    .innerJoin(membershipRoles, and(
      eq(membershipRoles.membershipId, collegeMemberships.id),
      eq(membershipRoles.role, "LEARNER"),
    ))
    .innerJoin(users, eq(users.id, collegeMemberships.userId))
    .innerJoin(colleges, eq(colleges.id, collegeMemberships.collegeId))
    .where(and(
      eq(collegeMemberships.collegeId, tenantCollegeId!),
      eq(collegeMemberships.status, "ACTIVE"),
      eq(users.platformStatus, "ACTIVE"),
      eq(colleges.status, "ACTIVE"),
      sql`lower(btrim(${learnerProfiles.rollNumber})) = lower(${input.rollNumber})`,
    )).limit(2);
  // Two learners sharing a roll number are never auto-selected. College admin
  // must repair conflicting roster data; no disambiguation via exposed PII.
  if (matches.length !== 1) throw new LoginError("NOT_REGISTERED");
  const learner = matches[0]!;
  const channel = learner.phone ? "PHONE" : "EMAIL";
  const contact = learner.phone ?? learner.email;
  if (!contact) throw new LoginError("CHANNEL_DISABLED");
  return startLoginWithRuntime({
    channel, contact, tenantCollegeId, ipTag: addressTag,
  });
}
