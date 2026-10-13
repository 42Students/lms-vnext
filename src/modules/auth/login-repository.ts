import "server-only";

import { and, eq, sql } from "drizzle-orm";
import { getDb } from "@/db/client";
import {
  collegeMemberships,
  identityAuthAttempts,
  placementCompanyRelationships,
  placementRecruiterCollegeGrants,
  placementRecruiterProfiles,
  users,
} from "@/db/schema";
import type {
  AttemptRecord,
  LoginMembership,
  LoginRepository,
  LoginUser,
} from "./login-service";

const userColumns = {
  id: users.id,
  identityUid: users.identityUid,
  phoneE164: users.phoneE164,
  email: users.email,
  displayName: users.displayName,
  platformStatus: users.platformStatus,
};

function rowsOf(result: unknown): Record<string, unknown>[] {
  return (result as { rows: Record<string, unknown>[] }).rows ?? [];
}

export const drizzleLoginRepository: LoginRepository = {
  async findUserByPhone(phoneE164) {
    const [row] = await getDb()
      .select(userColumns)
      .from(users)
      .where(eq(users.phoneE164, phoneE164))
      .limit(1);
    return (row as LoginUser | undefined) ?? null;
  },

  async findUserByEmail(email) {
    const [row] = await getDb()
      .select(userColumns)
      .from(users)
      .where(sql`lower(${users.email}) = ${email.toLowerCase()}`)
      .limit(1);
    return (row as LoginUser | undefined) ?? null;
  },

  async findUserById(userId) {
    const [row] = await getDb()
      .select(userColumns)
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);
    return (row as LoginUser | undefined) ?? null;
  },

  async listMemberships(userId) {
    const rows = await getDb()
      .select({
        id: collegeMemberships.id,
        collegeId: collegeMemberships.collegeId,
        status: collegeMemberships.status,
      })
      .from(collegeMemberships)
      .where(eq(collegeMemberships.userId, userId));
    return rows as LoginMembership[];
  },

  async isSuperAdmin(userId) {
    const result = await getDb().execute(sql`
      SELECT 1 FROM system_roles
      WHERE user_id = ${userId} AND role = 'SUPER_ADMIN' LIMIT 1
    `);
    return rowsOf(result).length === 1;
  },

  async hasRecruiterGrantAtCollege(userId, collegeId) {
    const [row] = await getDb()
      .select({ id: placementRecruiterCollegeGrants.id })
      .from(placementRecruiterCollegeGrants)
      .innerJoin(
        placementRecruiterProfiles,
        eq(
          placementRecruiterProfiles.userId,
          placementRecruiterCollegeGrants.recruiterUserId,
        ),
      )
      .innerJoin(
        placementCompanyRelationships,
        eq(
          placementCompanyRelationships.id,
          placementRecruiterCollegeGrants.companyRelationshipId,
        ),
      )
      .where(
        and(
          eq(placementRecruiterCollegeGrants.recruiterUserId, userId),
          eq(placementRecruiterCollegeGrants.status, "ACTIVE"),
          eq(placementRecruiterProfiles.status, "ACTIVE"),
          eq(placementCompanyRelationships.collegeId, collegeId),
        ),
      )
      .limit(1);
    return Boolean(row);
  },

  async countRecentAttempts(fingerprint, windowMinutes) {
    const result = await getDb().execute(sql`
      SELECT count(*)::int AS n
      FROM identity_auth_attempts
      WHERE contact_fingerprint = ${fingerprint}
        AND created_at > now() - make_interval(mins => ${windowMinutes})
    `);
    return Number(rowsOf(result)[0]?.n ?? 0);
  },

  async createAttempt(input) {
    // Serialize concurrent starts for one contact so the send cap cannot be
    // exceeded by a burst of parallel requests.
    return getDb().transaction(async (tx) => {
      await tx.execute(
        sql`SELECT pg_advisory_xact_lock(hashtext(${input.contactFingerprint}))`,
      );
      const counted = await tx.execute(sql`
        SELECT count(*)::int AS n
        FROM identity_auth_attempts
        WHERE contact_fingerprint = ${input.contactFingerprint}
          AND created_at > now() - make_interval(mins => ${input.rateLimit.windowMinutes})
      `);
      if (Number(rowsOf(counted)[0]?.n ?? 0) >= input.rateLimit.max) {
        return false;
      }
      await tx.execute(sql`
      INSERT INTO identity_auth_attempts (
        id, user_id, college_id, target_role, contact_fingerprint,
        sms_code_mac, sms_code_expires_at,
        email_code_mac, email_code_expires_at, email_code_sent_at,
        created_at, expires_at
      ) VALUES (
        ${input.id}, ${input.userId}, ${input.collegeId}, 'LOGIN',
        ${input.contactFingerprint},
        ${input.smsCodeMac},
        ${input.smsCodeMac ? sql`now() + interval '5 minutes'` : null},
        ${input.emailCodeMac},
        ${input.emailCodeMac ? sql`now() + interval '5 minutes'` : null},
        ${input.emailCodeMac ? sql`now()` : null},
        now(), now() + interval '5 minutes'
      )
    `);
      return true;
    });
  },

  async loadAttempt(id) {
    const [row] = await getDb()
      .select({
        id: identityAuthAttempts.id,
        userId: identityAuthAttempts.userId,
        collegeId: identityAuthAttempts.collegeId,
        smsCodeMac: identityAuthAttempts.smsCodeMac,
        smsCodeExpiresAt: identityAuthAttempts.smsCodeExpiresAt,
        emailCodeMac: identityAuthAttempts.emailCodeMac,
        emailCodeExpiresAt: identityAuthAttempts.emailCodeExpiresAt,
        verificationAttempts:
          identityAuthAttempts.verificationAttempts,
        expiresAt: identityAuthAttempts.expiresAt,
        usedAt: identityAuthAttempts.usedAt,
      })
      .from(identityAuthAttempts)
      .where(eq(identityAuthAttempts.id, id))
      .limit(1);
    return (row as AttemptRecord | undefined) ?? null;
  },

  async setEmailCode(id, mac, gapSeconds) {
    const result = await getDb().execute(sql`
      UPDATE identity_auth_attempts
      SET email_code_mac = ${mac},
          email_code_expires_at = least(now() + interval '5 minutes', expires_at),
          email_code_sent_at = now(),
          resend_attempts = resend_attempts + 1,
          version = version + 1
      WHERE id = ${id}
        AND used_at IS NULL
        AND expires_at > now()
        AND (
          email_code_sent_at IS NULL
          OR email_code_sent_at <= now() - make_interval(secs => ${gapSeconds})
        )
      RETURNING id
    `);
    return rowsOf(result).length === 1;
  },

  async reserveVerification(id) {
    const result = await getDb().execute(sql`
      UPDATE identity_auth_attempts
      SET verification_attempts = verification_attempts + 1,
          version = version + 1
      WHERE id = ${id}
        AND used_at IS NULL
        AND expires_at > now()
        AND verification_attempts < 5
      RETURNING id
    `);
    return rowsOf(result).length === 1;
  },

  async consumeAttempt(id) {
    const result = await getDb().execute(sql`
      UPDATE identity_auth_attempts
      SET verified_at = now(),
          used_at = now(),
          sms_code_mac = NULL,
          sms_code_expires_at = NULL,
          email_code_mac = NULL,
          email_code_expires_at = NULL,
          version = version + 1
      WHERE id = ${id}
        AND used_at IS NULL
        AND expires_at > now()
      RETURNING id
    `);
    return rowsOf(result).length === 1;
  },
};
