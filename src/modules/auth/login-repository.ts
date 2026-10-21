import "server-only";

import { and, eq, sql } from "drizzle-orm";
import { getDb } from "@/db/client";
import {
  collegeMemberships,
  colleges,
  identityAuthAttempts,
  organizations,
  placementCompanies,
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

/** Match the same active recruiter scope used by request-context resolution.
 * Never turn a suspended/revoked recruiter grant into an active login persona.
 * Shared users with other active college roles may still sign in normally.
 */
async function hasUsableRecruiterGrant(userId: string, collegeId?: string) {
  const db = getDb();
  const [row] = await db
    .select({ id: placementRecruiterCollegeGrants.id })
    .from(placementRecruiterCollegeGrants)
    .innerJoin(placementRecruiterProfiles,
      eq(placementRecruiterProfiles.userId, placementRecruiterCollegeGrants.recruiterUserId))
    .innerJoin(placementCompanies,
      eq(placementCompanies.id, placementRecruiterProfiles.companyId))
    .innerJoin(placementCompanyRelationships,
      eq(placementCompanyRelationships.id, placementRecruiterCollegeGrants.companyRelationshipId))
    .innerJoin(colleges, eq(colleges.id, placementCompanyRelationships.collegeId))
    .innerJoin(organizations, eq(organizations.id, colleges.organizationId))
    .innerJoin(users, eq(users.id, placementRecruiterCollegeGrants.recruiterUserId))
    .where(and(
      eq(placementRecruiterCollegeGrants.recruiterUserId, userId),
      eq(users.platformStatus, "ACTIVE"),
      eq(placementRecruiterProfiles.status, "ACTIVE"),
      eq(placementCompanies.status, "ACTIVE"),
      eq(placementCompanyRelationships.status, "ACTIVE"),
      eq(placementCompanyRelationships.companyId, placementRecruiterProfiles.companyId),
      eq(placementRecruiterCollegeGrants.status, "ACTIVE"),
      eq(placementRecruiterCollegeGrants.verificationStatus, "VERIFIED"),
      sql`${placementRecruiterCollegeGrants.validUntil} > clock_timestamp()`,
      sql`${placementRecruiterCollegeGrants.capabilities} @> ARRAY['DRIVES']::text[]`,
      eq(colleges.status, "ACTIVE"),
      eq(organizations.status, "ACTIVE"),
      collegeId ? eq(colleges.id, collegeId) : undefined,
    ))
    .limit(1);
  return Boolean(row);
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
        collegeStatus: colleges.status,
        organizationStatus: organizations.status,
      })
      .from(collegeMemberships)
      .innerJoin(colleges, eq(colleges.id, collegeMemberships.collegeId))
      .innerJoin(
        organizations,
        eq(organizations.id, colleges.organizationId),
      )
      .where(eq(collegeMemberships.userId, userId));
    // A membership at an archived college or organization cannot sign in:
    // report it as SUSPENDED so no caller treats it as ACTIVE.
    return rows.map((row) => ({
      id: row.id,
      collegeId: row.collegeId,
      status:
        row.status === "ACTIVE" &&
        (row.collegeStatus !== "ACTIVE" ||
          row.organizationStatus !== "ACTIVE")
          ? ("SUSPENDED" as const)
          : row.status,
    })) as LoginMembership[];
  },

  hasAnyRecruiterGrant(userId) {
    return hasUsableRecruiterGrant(userId);
  },
  async isSuperAdmin(userId) {
    const result = await getDb().execute(sql`
      SELECT 1 FROM system_roles
      WHERE user_id = ${userId} AND role = 'SUPER_ADMIN' LIMIT 1
    `);
    return rowsOf(result).length === 1;
  },

  hasRecruiterGrantAtCollege(userId, collegeId) {
    return hasUsableRecruiterGrant(userId, collegeId);
  },
  async createAttempt(input) {
    // Serialize concurrent starts for one contact so the send cap cannot be
    // exceeded by a burst of parallel requests.
    return getDb().transaction(async (tx) => {
      // Always contact first, then address, so concurrent starts cannot deadlock.
      await tx.execute(
        sql`SELECT pg_advisory_xact_lock(hashtext(${input.contactFingerprint}))`,
      );
      if (input.ipTag) {
        await tx.execute(
          sql`SELECT pg_advisory_xact_lock(hashtext(${"ip:" + input.ipTag}))`,
        );
      }
      const counted = await tx.execute(sql`
        SELECT
          count(*) FILTER (
            WHERE contact_fingerprint = ${input.contactFingerprint}
              AND ip_tag IS NOT DISTINCT FROM ${input.ipTag}
              AND used_at IS NULL
          )::int AS contact_and_address,
          count(*) FILTER (
            WHERE contact_fingerprint = ${input.contactFingerprint}
              AND used_at IS NULL
          )::int AS contact_total,
          count(*) FILTER (
            WHERE ${input.ipTag}::text IS NOT NULL AND ip_tag = ${input.ipTag}
          )::int AS address_total
        FROM identity_auth_attempts
        WHERE created_at > now() - make_interval(mins => ${input.rateLimit.windowMinutes})
          AND (contact_fingerprint = ${input.contactFingerprint}
               OR (${input.ipTag}::text IS NOT NULL AND ip_tag = ${input.ipTag}))
      `);
      const row = rowsOf(counted)[0] as
        | { contact_and_address: number; contact_total: number; address_total: number }
        | undefined;
      if (
        Number(row?.contact_and_address ?? 0) >= input.rateLimit.perContactAndAddress ||
        Number(row?.contact_total ?? 0) >= input.rateLimit.perContact ||
        Number(row?.address_total ?? 0) >= input.rateLimit.perAddress
      ) {
        return false;
      }
      // A newly started challenge supersedes earlier unused codes for the
      // same verified user/contact. This prevents old SMS and email codes
      // from surviving a restart in another tab or device.
      await tx.execute(sql`
        UPDATE identity_auth_attempts
        SET used_at = now(), sms_code_mac = NULL,
            sms_code_expires_at = NULL, email_code_mac = NULL,
            email_code_expires_at = NULL, version = version + 1
        WHERE user_id = ${input.userId}
          AND contact_fingerprint = ${input.contactFingerprint}
          AND used_at IS NULL AND expires_at > now()
      `);
      await tx.execute(sql`
      INSERT INTO identity_auth_attempts (
        id, user_id, college_id, target_role, contact_fingerprint, ip_tag,
        sms_code_mac, sms_code_expires_at,
        email_code_mac, email_code_expires_at, email_code_sent_at,
        created_at, expires_at
      ) VALUES (
        ${input.id}, ${input.userId}, ${input.collegeId}, 'LOGIN',
        ${input.contactFingerprint}, ${input.ipTag},
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
        dbNow: sql<Date>`now()`.mapWith((v) => new Date(v)),
        id: identityAuthAttempts.id,
        userId: identityAuthAttempts.userId,
        collegeId: identityAuthAttempts.collegeId,
        smsCodeMac: identityAuthAttempts.smsCodeMac,
        smsCodeExpiresAt: identityAuthAttempts.smsCodeExpiresAt,
        emailCodeMac: identityAuthAttempts.emailCodeMac,
        emailCodeExpiresAt: identityAuthAttempts.emailCodeExpiresAt,
        emailCodeSentAt: identityAuthAttempts.emailCodeSentAt,
        resendAttempts: identityAuthAttempts.resendAttempts,
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

  async setEmailCode(id, mac, gapSeconds, maxResends = 5) {
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
        AND resend_attempts < ${maxResends}
        AND (
          email_code_sent_at IS NULL
          OR email_code_sent_at <= now() - make_interval(secs => ${gapSeconds})
        )
      RETURNING id
    `);
    return rowsOf(result).length === 1;
  },

  async releaseUndeliveredEmailCode(id, mac) {
    await getDb().execute(sql`
      UPDATE identity_auth_attempts
      SET email_code_mac = NULL,
          email_code_expires_at = NULL,
          email_code_sent_at = NULL,
          resend_attempts = greatest(0,resend_attempts-1),
          version = version + 1
      WHERE id = ${id} AND email_code_mac = ${mac}
        AND used_at IS NULL AND expires_at > now()
    `);
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

  async consumeAttempt(id, userId, session) {
    // Consume and session insert commit or roll back together, so a failed
    // insert never burns the one-time code.
    return getDb().transaction(async (tx) => {
      const consumed = await consumeInTransaction(tx, id);
      if (!consumed) return false;
      if (session && userId) {
        if (session.previousDigest) {
          await tx.execute(sql`
            UPDATE identity_device_sessions
            SET revoked_at = now(),
                revoked_by_user_id = user_id,
                revocation_reason = 'RELOGIN'
            WHERE credential_digest = ${session.previousDigest}
              AND user_id = ${userId}
              AND revoked_at IS NULL
          `);
        }
        await tx.execute(sql`
          INSERT INTO identity_device_sessions (
            user_id, credential_digest, device_name, user_agent, ip_address,
            created_at, last_seen_at, expires_at
          ) VALUES (
            ${userId}, ${session.digest}, NULL,
            ${session.userAgent ? session.userAgent.slice(0, 512) : null},
            ${session.ipAddress ? session.ipAddress.slice(0, 64) : null},
            now(), now(),
            now() + make_interval(secs => ${session.maxAgeSeconds})
          )
        `);
      }
      return true;
    });
  },
};

type Executor = Pick<ReturnType<typeof getDb>, "execute">;

async function consumeInTransaction(tx: Executor, id: string) {
  {
    const result = await tx.execute(sql`
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
  }
}
