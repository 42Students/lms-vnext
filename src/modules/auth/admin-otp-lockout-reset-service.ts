import "server-only";

import { sql } from "drizzle-orm";
import { getDb } from "@/db/client";
import { activityEvents } from "@/db/schema";
import { getAuthConfig } from "./config";
import { contactFingerprint } from "./crypto";
import { adminOtpLockoutResetSchema, normalizePhone } from "./login-service";
import { hasMembershipRole, isSuperAdmin, type RequestContext } from "@/modules/identity/context";

/**
 * Staff-assisted sign-in recovery. Unlike the legacy phone-wide destructive
 * lockout reset, this clears only 10-minute LOGIN challenges for one resolved
 * user and contact. Address-wide pumping budgets remain enforced.
 *
 * The contact is kept out of URLs, success responses, events and exception text.
 * The target and actor are rechecked in the transaction; an existing cookie
 * alone is never authorization to remove attempts.
 */
export async function resetLoginOtpLockout(
  context: RequestContext,
  rawInput: unknown,
): Promise<{ ok: true }> {
  const administrator = isSuperAdmin(context);
  const collegeAdmin = hasMembershipRole(context, "COLLEGE_ADMIN");
  if (!administrator && !collegeAdmin) throw new Error("FORBIDDEN");
  const input = adminOtpLockoutResetSchema.parse(rawInput);
  const phone = normalizePhone(input.phone);
  if (!phone) throw new Error("INVALID_CONTACT");
  const scopedCollegeId = administrator ? null : context.membership?.collegeId ?? null;
  if (!administrator && !scopedCollegeId) throw new Error("FORBIDDEN");
  const fingerprint = contactFingerprint(getAuthConfig().secret, "phone", phone);
  const db = getDb();
  await db.transaction(async tx => {
    // Same per-contact lock as createAttempt, so a new code cannot race with reset.
    await tx.execute(sql`SELECT pg_advisory_xact_lock(hashtext(${fingerprint}))`);
    const authorized = administrator
      ? sql`EXISTS (
          SELECT 1 FROM system_roles r JOIN users u ON u.id = r.user_id
          WHERE r.user_id = ${context.user.id}::uuid
            AND r.role = 'SUPER_ADMIN' AND u.platform_status = 'ACTIVE'
        )`
      : sql`EXISTS (
          SELECT 1 FROM college_memberships m
          JOIN membership_roles mr ON mr.membership_id = m.id
          JOIN users u ON u.id = m.user_id
          JOIN colleges c ON c.id = m.college_id
          JOIN organizations o ON o.id = c.organization_id
          WHERE m.id = ${context.membership?.id ?? null}::uuid
            AND m.user_id = ${context.user.id}::uuid
            AND m.college_id = ${scopedCollegeId}::uuid
            AND m.status = 'ACTIVE' AND mr.role = 'COLLEGE_ADMIN'
            AND u.platform_status = 'ACTIVE'
            AND c.status = 'ACTIVE' AND o.status = 'ACTIVE'
        )`;
    const permission = await tx.execute<{ allowed: boolean }>(
      sql`SELECT ${authorized} AS allowed`,
    );
    if (!permission.rows[0]?.allowed) throw new Error("FORBIDDEN");
    const target = await tx.execute<{ id: string }>(sql`
      SELECT u.id FROM users u WHERE u.phone_e164 = ${phone}
      AND (${scopedCollegeId}::uuid IS NULL OR EXISTS (
        SELECT 1 FROM college_memberships m
        WHERE m.user_id = u.id AND m.college_id = ${scopedCollegeId}::uuid
      )) LIMIT 1 FOR UPDATE
    `);
    const targetId = target.rows[0]?.id ?? null;
    let removed = 0;
    if (targetId) {
      // Purge matching challenge MACs as well as contact buckets. Expired
      // attempts and other users/contacts remain untouched. Do not reset IP caps.
      const deleted = await tx.execute<{ id: string }>(sql`
        DELETE FROM identity_auth_attempts
        WHERE user_id = ${targetId}::uuid
          AND contact_fingerprint = ${fingerprint}
          AND target_role = 'LOGIN'
          AND created_at > clock_timestamp() - interval '10 minutes'
        RETURNING id
      `);
      removed = deleted.rows.length;
    }
    await tx.insert(activityEvents).values({
      module: "IDENTITY",
      eventType: "identity.otp_lockout.reset",
      importance: "HIGH",
      subjectType: "user",
      subjectId: targetId ?? "unmatched",
      summary: "Administrator reviewed OTP lockout recovery",
      actorUserId: context.user.id,
      actorMembershipId: administrator ? null : context.membership?.id ?? null,
      collegeId: scopedCollegeId,
      organizationId: administrator ? null : context.membership?.organizationId ?? null,
      metadata: {
        reason: input.reason,
        matchedAccount: Boolean(targetId),
        resetChallenges: removed,
        requesterRateLimitPreserved: true,
      },
    });
  });
  // Do not disclose whether the supplied contact belongs to a student.
  return { ok: true };
}
