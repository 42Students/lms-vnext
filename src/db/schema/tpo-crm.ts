import { sql } from "drizzle-orm";
import {
  boolean,
  check,
  date,
  foreignKey,
  index,
  integer,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { colleges } from "./colleges";
import { collegeMemberships } from "./memberships";
import { placementCompanyRelationships } from "./placements";
import { users } from "./users";

/**
 * DB09-A: legacy recruiter_lead (23 source fields).
 *
 * Only the manual CRM stage is persisted. Invite/account/drive lifecycle
 * remains derived from source facts, matching the frozen legacy contract.
 */
export const placementTpoLeads = pgTable(
  "placement_tpo_leads",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    legacyLeadId: integer("legacy_lead_id"),
    legacyCollegeId: integer("legacy_college_id"),
    legacyOwnerFacultyId: integer("legacy_owner_faculty_id"),
    collegeId: uuid("college_id")
      .notNull()
      .references(() => colleges.id, { onDelete: "restrict" }),
    companyRelationshipId: uuid("company_relationship_id").references(
      () => placementCompanyRelationships.id,
      { onDelete: "restrict" },
    ),
    name: varchar("name", { length: 150 }).notNull(),
    designation: varchar("designation", { length: 100 }),
    emailNorm: varchar("email_norm", { length: 150 }),
    phoneNorm: varchar("phone_norm", { length: 20 }),
    companyName: varchar("company_name", { length: 150 }),
    companyLogoObjectPath: text("company_logo_object_path"),
    ownerMembershipId: uuid("owner_membership_id").references(
      () => collegeMemberships.id,
      { onDelete: "restrict" },
    ),
    manualStage: varchar("manual_stage", { length: 15 })
      .notNull()
      .default("NEW"),
    notNowReason: varchar("not_now_reason", { length: 255 }),
    notNowUntil: date("not_now_until", { mode: "string" }),
    source: varchar("source", { length: 30 }),
    inviteTokenHash: varchar("invite_token_hash", { length: 128 }),
    inviteSentAt: timestamp("invite_sent_at", { withTimezone: true }),
    inviteClickedAt: timestamp("invite_clicked_at", { withTimezone: true }),
    inviteReminderSentAt: timestamp("invite_reminder_sent_at", {
      withTimezone: true,
    }),
    inviteBouncedAt: timestamp("invite_bounced_at", { withTimezone: true }),
    unsubscribedAt: timestamp("unsubscribed_at", { withTimezone: true }),
    recruiterUserId: uuid("recruiter_user_id").references(
      () => users.id,
      { onDelete: "restrict" },
    ),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    uniqueIndex("placement_tpo_leads_college_id_id_uq").on(
      t.collegeId,
      t.id,
    ),
    uniqueIndex("placement_tpo_leads_college_email_uq")
      .on(t.collegeId, t.emailNorm)
      .where(sql`${t.emailNorm} is not null`),
    uniqueIndex("placement_tpo_leads_college_phone_uq")
      .on(t.collegeId, t.phoneNorm)
      .where(sql`${t.phoneNorm} is not null`),
    uniqueIndex("placement_tpo_leads_invite_hash_uq")
      .on(t.inviteTokenHash)
      .where(sql`${t.inviteTokenHash} is not null`),
    index("placement_tpo_leads_college_stage_updated_idx").on(
      t.collegeId,
      t.manualStage,
      t.updatedAt,
    ),
    index("placement_tpo_leads_owner_idx").on(
      t.ownerMembershipId,
      t.updatedAt,
    ),
    check(
      "placement_tpo_leads_stage_ck",
      sql`${t.manualStage} in ('NEW', 'CONTACTED', 'NOT_NOW')`,
    ),
    check(
      "placement_tpo_leads_contact_ck",
      sql`${t.emailNorm} is not null or ${t.phoneNorm} is not null`,
    ),
    check(
      "placement_tpo_leads_name_ck",
      sql`length(trim(${t.name})) > 0`,
    ),
    check(
      "placement_tpo_leads_email_lower_ck",
      sql`${t.emailNorm} is null or ${t.emailNorm} = lower(${t.emailNorm})`,
    ),
    check(
      "placement_tpo_leads_phone_digits_ck",
      sql`${t.phoneNorm} is null or ${t.phoneNorm} ~ '^[0-9]{7,20}$'`,
    ),
    check(
      "placement_tpo_leads_invite_hash_ck",
      sql`${t.inviteTokenHash} is null or ${t.inviteTokenHash} ~ '^[a-f0-9]{64}$'`,
    ),
    check(
      "placement_tpo_leads_invite_lifecycle_ck",
      sql`(${t.inviteTokenHash} is null or ${t.inviteSentAt} is not null)
        and (${t.inviteClickedAt} is null or
          (${t.inviteSentAt} is not null and ${t.inviteClickedAt} >= ${t.inviteSentAt}))
        and (${t.inviteReminderSentAt} is null or
          (${t.inviteSentAt} is not null and ${t.inviteReminderSentAt} >= ${t.inviteSentAt}))
        and (${t.inviteBouncedAt} is null or
          (${t.inviteSentAt} is not null and ${t.inviteBouncedAt} >= ${t.inviteSentAt}))
        and (${t.unsubscribedAt} is null or ${t.inviteTokenHash} is null)`,
    ),
  ],
);

/**
 * Legacy recruiter_lead_activity (8 fields). college_id is added in vNext
 * so the lead relationship is enforceably tenant scoped.
 */
export const placementTpoLeadActivities = pgTable(
  "placement_tpo_lead_activities",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    legacyActivityId: integer("legacy_activity_id"),
    legacyLeadId: integer("legacy_lead_id"),
    collegeId: uuid("college_id")
      .notNull()
      .references(() => colleges.id, { onDelete: "restrict" }),
    leadId: uuid("lead_id").notNull(),
    type: varchar("type", { length: 20 }).notNull(),
    outcome: varchar("outcome", { length: 30 }),
    note: varchar("note", { length: 2000 }),
    isSystem: boolean("is_system").notNull().default(false),
    createdByUserId: uuid("created_by_user_id").references(
      () => users.id,
      { onDelete: "restrict" },
    ),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    foreignKey({
      name: "placement_tpo_lead_activities_scoped_fk",
      columns: [t.collegeId, t.leadId],
      foreignColumns: [placementTpoLeads.collegeId, placementTpoLeads.id],
    }).onDelete("restrict"),
    index("placement_tpo_lead_activities_lead_time_idx").on(
      t.collegeId,
      t.leadId,
      t.createdAt,
    ),
    check(
      "placement_tpo_lead_activities_type_ck",
      sql`${t.type} in ('CALL', 'WHATSAPP', 'EMAIL', 'MEETING', 'NOTE', 'SYSTEM')`,
    ),
    check(
      "placement_tpo_lead_activities_system_ck",
      sql`(${t.type} = 'SYSTEM') = ${t.isSystem}`,
    ),
  ],
);

/**
 * Legacy follow_up (7 fields). Completion is terminal for schedule movement;
 * the stronger staged SQL adds owner-principal and terminal-state triggers.
 */
export const placementTpoFollowups = pgTable(
  "placement_tpo_followups",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    legacyFollowupId: integer("legacy_followup_id"),
    legacyLeadId: integer("legacy_lead_id"),
    collegeId: uuid("college_id")
      .notNull()
      .references(() => colleges.id, { onDelete: "restrict" }),
    leadId: uuid("lead_id").notNull(),
    dueAt: timestamp("due_at", { withTimezone: true }).notNull(),
    ownerMembershipId: uuid("owner_membership_id").references(
      () => collegeMemberships.id,
      { onDelete: "restrict" },
    ),
    note: varchar("note", { length: 500 }),
    doneAt: timestamp("done_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    foreignKey({
      name: "placement_tpo_followups_scoped_fk",
      columns: [t.collegeId, t.leadId],
      foreignColumns: [placementTpoLeads.collegeId, placementTpoLeads.id],
    }).onDelete("restrict"),
    index("placement_tpo_followups_college_due_idx").on(
      t.collegeId,
      t.doneAt,
      t.dueAt,
    ),
    index("placement_tpo_followups_lead_idx").on(
      t.collegeId,
      t.leadId,
    ),
    check(
      "placement_tpo_followups_done_time_ck",
      sql`${t.doneAt} is null or ${t.doneAt} >= ${t.createdAt}`,
    ),
  ],
);

/**
 * T-S1-03: hashed recruiter-invite OTP challenge. Stores only HMAC digests,
 * never the six-digit code or a credential. Scoped FK keeps the challenge in
 * the lead's college.
 */
export const recruiterInviteCodes = pgTable(
  "recruiter_invite_code",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    leadId: uuid("lead_id")
      .notNull()
      .references(() => placementTpoLeads.id, { onDelete: "restrict" }),
    collegeId: uuid("college_id")
      .notNull()
      .references(() => colleges.id, { onDelete: "restrict" }),
    tokenHash: varchar("token_hash", { length: 64 }).notNull(),
    codeHash: varchar("code_hash", { length: 64 }).notNull(),
    sentAt: timestamp("sent_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    failedAttempts: integer("failed_attempts").notNull().default(0),
    consumedAt: timestamp("consumed_at", { withTimezone: true }),
    deliveryState: varchar("delivery_state", { length: 16 })
      .notNull()
      .default("PENDING"),
  },
  (t) => [
    foreignKey({
      name: "recruiter_invite_code_scoped_fk",
      columns: [t.collegeId, t.leadId],
      foreignColumns: [placementTpoLeads.collegeId, placementTpoLeads.id],
    }).onDelete("restrict"),
    index("recruiter_invite_code_lead_sent_idx").on(t.leadId, t.sentAt.desc()),
    index("recruiter_invite_code_college_sent_idx").on(
      t.collegeId,
      t.sentAt.desc(),
    ),
    index("recruiter_invite_code_token_active_idx").on(
      t.tokenHash,
      t.sentAt.desc(),
    ),
    check(
      "recruiter_invite_code_token_hash_ck",
      sql`${t.tokenHash} ~ '^[0-9a-f]{64}$'`,
    ),
    check(
      "recruiter_invite_code_code_hash_ck",
      sql`${t.codeHash} ~ '^[0-9a-f]{64}$'`,
    ),
    check(
      "recruiter_invite_code_expiry_ck",
      sql`${t.expiresAt} > ${t.sentAt} and ${t.expiresAt} <= ${t.sentAt} + interval '10 minutes'`,
    ),
    check(
      "recruiter_invite_code_attempts_ck",
      sql`${t.failedAttempts} between 0 and 5`,
    ),
    check(
      "recruiter_invite_code_delivery_state_ck",
      sql`${t.deliveryState} in ('PENDING', 'SENT', 'FAILED')`,
    ),
    check(
      "recruiter_invite_code_time_ck",
      sql`${t.consumedAt} is null or ${t.consumedAt} >= ${t.sentAt}`,
    ),
  ],
);

/**
 * T-S2-04: TPO email campaign header. The 500-recipient cap is enforced by a
 * row-locking trigger on the recipients table (migration 0095), not only by
 * `total_recipients`. No delivery route is enabled by this table alone.
 */
export const placementTpoEmailCampaigns = pgTable(
  "placement_tpo_email_campaigns",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    legacyCampaignId: integer("legacy_campaign_id"),
    legacySenderUserId: integer("legacy_sender_user_id"),
    collegeId: uuid("college_id")
      .notNull()
      .references(() => colleges.id, { onDelete: "restrict" }),
    createdByUserId: uuid("created_by_user_id")
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    status: varchar("status", { length: 16 }).notNull().default("DRAFT"),
    totalRecipients: integer("total_recipients").notNull().default(0),
    legacySubject: text("legacy_subject"),
    legacyBody: text("legacy_body"),
    legacySentCount: integer("legacy_sent_count"),
    legacyFailedCount: integer("legacy_failed_count"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    uniqueIndex("tpo_email_campaign_college_id_uq").on(t.collegeId, t.id),
    index("tpo_email_campaign_college_created_idx").on(
      t.collegeId,
      t.createdAt,
    ),
    check(
      "placement_tpo_email_campaigns_status_ck",
      sql`${t.status} in ('DRAFT','SENDING','SENT','CANCELLED')`,
    ),
    check(
      "placement_tpo_email_campaigns_total_ck",
      sql`${t.totalRecipients} between 0 and 500`,
    ),
  ],
);

/**
 * T-S2-04: one row per lead per campaign. `recipient_key` is the keyed HMAC of
 * the normalized email (never the address) so two leads sharing an address
 * cannot both be sent the same campaign.
 */
export const placementTpoEmailCampaignRecipients = pgTable(
  "placement_tpo_email_campaign_recipients",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    legacyRecipientId: integer("legacy_recipient_id"),
    collegeId: uuid("college_id").notNull(),
    campaignId: uuid("campaign_id").notNull(),
    leadId: uuid("lead_id").notNull(),
    recipientKey: varchar("recipient_key", { length: 64 }).notNull(),
    /** Historical SHA-256 is not valid as a current signed unsubscribe proof. */
    legacyUnsubscribeSha256: varchar("legacy_unsubscribe_sha256", { length: 64 }),
    status: varchar("status", { length: 24 }).notNull().default("PENDING"),
    unsubscribedAt: timestamp("unsubscribed_at", { withTimezone: true }),
    sentAt: timestamp("sent_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    foreignKey({
      name: "tpo_email_recipient_campaign_fk",
      columns: [t.collegeId, t.campaignId],
      foreignColumns: [
        placementTpoEmailCampaigns.collegeId,
        placementTpoEmailCampaigns.id,
      ],
    }).onDelete("restrict"),
    foreignKey({
      name: "tpo_email_recipient_lead_fk",
      columns: [t.collegeId, t.leadId],
      foreignColumns: [placementTpoLeads.collegeId, placementTpoLeads.id],
    }).onDelete("restrict"),
    uniqueIndex("tpo_email_recipient_campaign_lead_uq").on(
      t.campaignId,
      t.leadId,
    ),
    uniqueIndex("tpo_email_recipient_campaign_key_uq").on(
      t.campaignId,
      t.recipientKey,
    ),
    index("tpo_email_recipient_legacy_unsubscribe_idx").on(t.legacyUnsubscribeSha256)
      .where(sql`${t.legacyUnsubscribeSha256} is not null`),
    check("tpo_email_recipient_legacy_unsubscribe_ck",
      sql`${t.legacyUnsubscribeSha256} is null or ${t.legacyUnsubscribeSha256} ~ '^[a-f0-9]{64}$'`),
    index("tpo_email_recipient_college_campaign_idx").on(
      t.collegeId,
      t.campaignId,
    ),
    check(
      "placement_tpo_email_recipients_key_ck",
      sql`${t.recipientKey} ~ '^[0-9a-f]{64}$'`,
    ),
    check(
      "placement_tpo_email_recipients_status_ck",
      sql`${t.status} in ('PENDING','SKIPPED_NO_EMAIL','SKIPPED_UNSUBSCRIBED','QUEUED','SENT','FAILED','UNSUBSCRIBED')`,
    ),
  ],
);
