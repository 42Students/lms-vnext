/**
 * One user-bound login challenge (phone SMS and/or email code).
 * Codes are stored only as keyed HMAC (never raw), expire within five
 * minutes, and share one atomic verification budget across channels.
 * Contract: docs/planning/db01-auth-otp-handoff-contract.md.
 *
 * Legacy learnerId=0 preuser challenge intentionally cannot bypass this
 * authenticated user FK: a future pre-registration endpoint needs a distinct,
 * expiring non-account intent keyed by a stable HMAC fingerprint and rate limit,
 * with proof of ownership BEFORE binding to a newly created UUID user.
 * Never insert placeholder users, raw OTPs, roll numbers or plaintext contact
 * into this table. No historical verification OTPs are imported to vNext.
 * Hash/expiry/version constraints supersede legacy plaintext learner_acct_verification.
 */
import { sql } from "drizzle-orm";
import {
  check,
  foreignKey,
  index,
  integer,
  pgTable,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { users } from "./users";
import { colleges } from "./colleges";
import { collegeMemberships } from "./memberships";
import { placementApplications } from "./placements";

export const identityAuthAttempts = pgTable(
  "identity_auth_attempts",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    collegeId: uuid("college_id")
      .references(() => colleges.id, { onDelete: "restrict" }),
    membershipId: uuid("membership_id")
      .references(() => collegeMemberships.id, { onDelete: "restrict" }),
    targetRole: varchar("target_role", { length: 24 }).notNull(),
    /** Source-only identity crosswalk; never an authorization principal. */
    legacyAccountId: integer("legacy_account_id"),
    legacyAccountType: varchar("legacy_account_type",{length:24}),
    blockedUntil: timestamp("blocked_until",{withTimezone:true}),
    supersededAt: timestamp("superseded_at",{withTimezone:true}),
    contactFingerprint: varchar("contact_fingerprint", { length: 64 })
      .notNull(),
    // Short one-way tag of the requesting address; lets the send cap count
    // per contact AND per requester so one caller cannot lock a person out.
    ipTag: varchar("ip_tag", { length: 24 }),
    smsCodeMac: varchar("sms_code_mac", { length: 64 }),
    smsCodeExpiresAt: timestamp("sms_code_expires_at", { withTimezone: true }),
    emailCodeMac: varchar("email_code_mac", { length: 64 }),
    emailCodeExpiresAt: timestamp("email_code_expires_at", { withTimezone: true }),
    emailCodeSentAt: timestamp("email_code_sent_at", { withTimezone: true }),
    verificationAttempts: integer("verification_attempts").notNull().default(0),
    resendAttempts: integer("resend_attempts").notNull().default(0),
    version: integer("version").notNull().default(1),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull().defaultNow(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    verifiedAt: timestamp("verified_at", { withTimezone: true }),
    usedAt: timestamp("used_at", { withTimezone: true }),
  },
  (table) => [
    // Requires W01 composite UNIQUE (id,user_id,college_id) on memberships.
    // MATCH SIMPLE skips nullable membershipId; shape CHECK below closes bypass.
    foreignKey({
      name: "identity_auth_attempts_membership_scope_fk",
      columns: [table.membershipId, table.userId, table.collegeId],
      foreignColumns: [
        collegeMemberships.id,
        collegeMemberships.userId,
        collegeMemberships.collegeId,
      ],
    }).onDelete("restrict"),
    check(
      "identity_auth_attempts_membership_college_shape_ck",
      sql`${table.membershipId} IS NULL OR ${table.collegeId} IS NOT NULL`,
    ),
    index("identity_auth_attempts_user_expiry_idx").on(
      table.userId,
      table.expiresAt,
    ),
    index("identity_auth_attempts_contact_rate_idx").on(
      table.contactFingerprint,
      table.createdAt,
    ),
    index("identity_auth_attempts_expiry_idx").on(table.expiresAt),
    index("identity_auth_attempts_user_contact_state_idx")
      .on(table.userId,table.contactFingerprint,table.targetRole,table.createdAt),
    index("identity_auth_attempts_contact_ip_idx").on(
      table.contactFingerprint,
      table.ipTag,
      table.createdAt,
    ),
    index("identity_auth_attempts_ip_rate_idx").on(
      table.ipTag,
      table.createdAt,
    ),
    check(
      "identity_auth_attempts_expiry_ck",
      sql`${table.expiresAt} > ${table.createdAt}`,
    ),
    check(
      "identity_auth_attempts_attempt_bounds_ck",
      sql`${table.verificationAttempts} BETWEEN 0 AND 5 AND ${table.resendAttempts} >= 0`,
    ),
    check("identity_auth_attempts_superseded_ck",sql`
      ${table.supersededAt} is null or ${table.supersededAt} >= ${table.createdAt}
    `),
    check(
      "identity_auth_attempts_version_ck",
      sql`${table.version} >= 1`,
    ),
    check(
      "identity_auth_attempts_sms_shape_ck",
      sql`(${table.smsCodeMac} IS NULL) = (${table.smsCodeExpiresAt} IS NULL)`,
    ),
    check(
      "identity_auth_attempts_email_shape_ck",
      sql`(${table.emailCodeMac} IS NULL) = (${table.emailCodeExpiresAt} IS NULL)`,
    ),
    check(
      "identity_auth_attempts_mac_shape_ck",
      sql`(${table.smsCodeMac} IS NULL OR ${table.smsCodeMac} ~ '^[0-9a-f]{64}$') AND
          (${table.emailCodeMac} IS NULL OR ${table.emailCodeMac} ~ '^[0-9a-f]{64}$') AND
          ${table.contactFingerprint} ~ '^[0-9a-f]{64}$'`,
    ),
    check(
      "identity_auth_attempts_timestamp_ck",
      sql`(${table.verifiedAt} IS NULL OR (${table.verifiedAt} >= ${table.createdAt} AND ${table.verifiedAt} < ${table.expiresAt})) AND
          (${table.usedAt} IS NULL OR (${table.usedAt} >= ${table.createdAt} AND ${table.usedAt} < ${table.expiresAt}))`,
    ),
    check(
      "identity_auth_attempts_five_minute_expiry_ck",
      sql`${table.expiresAt} <= ${table.createdAt} + interval '5 minutes'`,
    ),
    check(
      "identity_auth_attempts_target_role_shape_ck",
      sql`char_length(btrim(${table.targetRole})) BETWEEN 1 AND 24`,
    ),
    check(
      "identity_auth_attempts_consumed_shape_ck",
      sql`${table.usedAt} IS NULL OR
          (${table.verifiedAt} IS NOT NULL
           AND ${table.verifiedAt} <= ${table.usedAt}
           AND ${table.smsCodeMac} IS NULL
           AND ${table.smsCodeExpiresAt} IS NULL
           AND ${table.emailCodeMac} IS NULL
           AND ${table.emailCodeExpiresAt} IS NULL)`,
    ),
  ],
);


/** The legacy 24-hour email-verification link is independent of the five-minute
 * SMS/email OTP challenge. Store only keyed fingerprints of email and bearer
 * secrets; retain successful proof on a separate durable user-scoped record.
 * Legacy application String IDs must be resolved and ownership checked. */
export const identityEmailVerificationLinks=pgTable("identity_email_verification_links",{
  id:uuid("id").defaultRandom().primaryKey(),
  userId:uuid("user_id").notNull().references(()=>users.id,{onDelete:"restrict"}),
  collegeId:uuid("college_id").references(()=>colleges.id,{onDelete:"restrict"}),
  membershipId:uuid("membership_id").references(()=>collegeMemberships.id,{onDelete:"restrict"}),
  applicationId:uuid("application_id").references(()=>placementApplications.id,{onDelete:"restrict"}),
  legacyApplicationId:varchar("legacy_application_id",{length:36}),
  emailFingerprint:varchar("email_fingerprint",{length:64}).notNull(),
  emailKeyVersion:varchar("email_key_version",{length:16}).notNull(),
  tokenDigest:varchar("token_digest",{length:64}).notNull(),
  createdAt:timestamp("created_at",{withTimezone:true}).notNull().defaultNow(),
  expiresAt:timestamp("expires_at",{withTimezone:true}).notNull(),
  verifiedAt:timestamp("verified_at",{withTimezone:true}),
  revokedAt:timestamp("revoked_at",{withTimezone:true}),
},table=>[
  uniqueIndex("identity_email_link_digest_uq").on(table.tokenDigest),
  index("identity_email_link_contact_idx").on(table.emailFingerprint,table.createdAt),
  index("identity_email_link_application_idx").on(table.applicationId,table.createdAt)
    .where(sql`${table.applicationId} is not null`),
  index("identity_email_link_expiry_idx").on(table.expiresAt)
    .where(sql`${table.verifiedAt} is null and ${table.revokedAt} is null`),
  foreignKey({name:"identity_email_link_membership_scope_fk",
    columns:[table.membershipId,table.userId,table.collegeId],
    foreignColumns:[collegeMemberships.id,collegeMemberships.userId,collegeMemberships.collegeId],
  }).onDelete("restrict"),
  check("identity_email_link_shape_ck",sql`
    (${table.membershipId} is null or ${table.collegeId} is not null)
    and (${table.applicationId} is null or (${table.membershipId} is not null
      and ${table.collegeId} is not null))
    and ${table.emailFingerprint} ~ '^[0-9a-f]{64}$'
    and ${table.tokenDigest} ~ '^[0-9a-f]{64}$'
    and length(trim(${table.emailKeyVersion})) between 1 and 16
  `),
  check("identity_email_link_ttl_ck",sql`
    ${table.expiresAt} > ${table.createdAt}
    and ${table.expiresAt} <= ${table.createdAt}+interval '24 hours'
    and (${table.verifiedAt} is null or
      (${table.verifiedAt} >= ${table.createdAt} and ${table.verifiedAt} <= ${table.expiresAt}))
    and (${table.revokedAt} is null or ${table.revokedAt} >= ${table.createdAt})
  `),
]);

/** Verified email ownership persists after the link expires, and is not a
 * globally visible 'email verified' flag as in the old lookup. */
export const identityEmailOwnershipProofs=pgTable("identity_email_ownership_proofs",{
  id:uuid("id").defaultRandom().primaryKey(),
  userId:uuid("user_id").notNull().references(()=>users.id,{onDelete:"restrict"}),
  emailFingerprint:varchar("email_fingerprint",{length:64}).notNull(),
  emailKeyVersion:varchar("email_key_version",{length:16}).notNull(),
  verificationLinkId:uuid("verification_link_id").notNull()
    .references(()=>identityEmailVerificationLinks.id,{onDelete:"restrict"}),
  verifiedAt:timestamp("verified_at",{withTimezone:true}).notNull(),
  revokedAt:timestamp("revoked_at",{withTimezone:true}),
  createdAt:timestamp("created_at",{withTimezone:true}).notNull().defaultNow(),
},table=>[
  uniqueIndex("identity_email_proof_active_uq").on(table.userId,table.emailFingerprint)
    .where(sql`${table.revokedAt} is null`),
  index("identity_email_proof_link_idx").on(table.verificationLinkId),
  check("identity_email_proof_state_ck",sql`
    ${table.emailFingerprint} ~ '^[0-9a-f]{64}$'
    and length(trim(${table.emailKeyVersion})) between 1 and 16
    and (${table.revokedAt} is null or ${table.revokedAt} >= ${table.verifiedAt})
  `),
]);

/** Source disposition for the seven email-token fields, legacy six-field
 * login_user and 18-field mobile attempt: no raw email/phone/OTP/password
 * or numeric IDs are ever trusted as credentials or imported automatically. */
export const LEGACY_IDENTITY_FIELD_CROSSWALK={
  emailVerification:{
    token:"HMAC bearer digest",applicationId:"resolved same-college application UUID",
    createdAt:"source wall time converted from verified IST",email:"HMAC contact fingerprint",
    expiresAt:"24-hour link TTL",verified:"scoped durable ownership proof",
    verifiedAt:"independent ownership timestamp",
  },
  loginUser:{
    id:"users UUID via explicit source map",createdAt:"users.createdAt",
    isDeleted:"users.platformStatus",updatedAt:"users.updatedAt",
    password:"retired, require fresh sign-in",userName:"approved normalized contact",
  },
  mobileLoginAttempt:{
    id:"challenge UUID",userId:"user UUID / membership UUID",
    userType:"targetRole",collegeId:"validated college UUID",
    organizationId:"persisted college relation",phone:"keyed fingerprint",
    otp:"sms HMAC only",emailOtp:"email HMAC only",
    used:"usedAt",verificationAttempts:"verificationAttempts",
    blockedTillTs:"blockedUntil",expired:"expiresAt database clock",
  },
  learnerVerification:{
    learnerId:"user UUID + learner membership UUID",
    rollNumber:"learner profile only",phoneNumber:"HMAC contact fingerprint",
    verifyStatus:"verifiedAt/usedAt",incorrectAttempts:"verificationAttempts",
    expired:"trusted expiry comparison",blockedTillTs:"blockedUntil",
  },
} as const;

export function identityAttemptPublicState(input:{
 expiresAt:Date;verifiedAt:Date|null;usedAt:Date|null;
 supersededAt:Date|null;blockedUntil:Date|null;verificationAttempts:number;
},now:Date){
 const verified=input.verifiedAt!==null&&input.usedAt!==null;
 const blocked=Boolean(input.blockedUntil&&input.blockedUntil>now);
 const expired=now>=input.expiresAt||input.supersededAt!==null;
 return {status:verified?"VERIFIED" as const:blocked?"BLOCKED" as const:
   expired?"EXPIRED" as const:"PENDING" as const,
   attemptsRemaining:Math.max(0,5-input.verificationAttempts),
   mayRestart:expired&&!blocked};
}

/** Pre-user onboarding is a separate challenge: no placeholder users, no
 * learnerId=0 foreign keys and no raw roll, email, phone or OTP at rest.
 * A verified challenge is only contact ownership evidence, not enrollment. */
export const identityPreuserChallenges=pgTable("identity_preuser_challenges",{
 id:uuid("id").defaultRandom().primaryKey(),
 collegeId:uuid("college_id").notNull().references(()=>colleges.id,{onDelete:"restrict"}),
 channel:varchar("channel",{length:12}).notNull(),
 source:varchar("source",{length:16}).notNull(),
 contactFingerprint:varchar("contact_fingerprint",{length:64}).notNull(),
 rollFingerprint:varchar("roll_fingerprint",{length:64}),
 codeMac:varchar("code_mac",{length:64}).notNull(),
 attempts:integer("attempts").notNull().default(0),
 createdAt:timestamp("created_at",{withTimezone:true}).notNull().defaultNow(),
 expiresAt:timestamp("expires_at",{withTimezone:true}).notNull(),
 verifiedAt:timestamp("verified_at",{withTimezone:true}),
 consumedAt:timestamp("consumed_at",{withTimezone:true}),
 revokedAt:timestamp("revoked_at",{withTimezone:true}),
},t=>[
 index("identity_preuser_contact_rate_idx").on(t.collegeId,t.contactFingerprint,t.createdAt),
 index("identity_preuser_roll_rate_idx").on(t.collegeId,t.rollFingerprint,t.createdAt)
   .where(sql`${t.rollFingerprint} is not null`),
 index("identity_preuser_expiry_idx").on(t.expiresAt),
 check("identity_preuser_channel_ck",sql`${t.channel} in ('EMAIL','PHONE')`),
 check("identity_preuser_source_ck",sql`${t.source} in ('CONTACT','ROLL')`),
 check("identity_preuser_roll_shape_ck",sql`(${t.source}='ROLL')=(${t.rollFingerprint} is not null)`),
 check("identity_preuser_hash_ck",sql`
   ${t.contactFingerprint} ~ '^[0-9a-f]{64}$' and
   (${t.rollFingerprint} is null or ${t.rollFingerprint} ~ '^[0-9a-f]{64}$')
   and ${t.codeMac} ~ '^[0-9a-f]{64}$'`),
 check("identity_preuser_attempts_ck",sql`${t.attempts} between 0 and 5`),
 check("identity_preuser_ttl_ck",sql`
   ${t.expiresAt}>${t.createdAt} and
   ${t.expiresAt}<=${t.createdAt}+interval '5 minutes'`),
 check("identity_preuser_state_ck",sql`
  (${t.verifiedAt} is null or
    (${t.verifiedAt}>=${t.createdAt} and ${t.verifiedAt}<${t.expiresAt}))
  and (${t.consumedAt} is null or
    (${t.verifiedAt} is not null and ${t.consumedAt}>=${t.verifiedAt}))
  and (${t.revokedAt} is null or ${t.revokedAt}>=${t.createdAt}`),
]);
