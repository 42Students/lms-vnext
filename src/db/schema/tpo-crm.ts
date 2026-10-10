import { sql } from "drizzle-orm";
import {
  boolean,
  check,
  date,
  foreignKey,
  index,
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
 * DB09-A: legacy recruiter_lead (23 source fields, V161 + subsequent
 * recruiter-lead renames). Stages tied to account/invite/drive facts
 * remain derived by services; only NEW/CONTACTED/NOT_NOW is persisted.
 *
 * Legacy owner_faculty_id -> optional college_memberships.id.
 * Legacy company_id -> optional college-scoped company relationship.
 * Legacy recruiter_id -> optional canonical recruiter user.
 * These identity changes require producer/consumer semantic sign-off.
 */
export const placementTpoLeads = pgTable(
  "placement_tpo_leads",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    collegeId: uuid("college_id")
      .notNull()
      .references(() => colleges.id, { onDelete: "restrict" }),
    companyRelationshipId: uuid("company_relationship_id")
      .references(() => placementCompanyRelationships.id, {
        onDelete: "restrict",
      }),
    name: varchar("name", { length: 150 }).notNull(),
    designation: varchar("designation", { length: 100 }),
    emailNorm: varchar("email_norm", { length: 150 }),
    phoneNorm: varchar("phone_norm", { length: 20 }),
    companyName: varchar("company_name", { length: 150 }),
    companyLogoObjectPath: text("company_logo_object_path"),
    ownerMembershipId: uuid("owner_membership_id")
      .references(() => collegeMemberships.id, {
        onDelete: "restrict",
      }),
    manualStage: varchar("manual_stage", { length: 15 })
      .notNull()
      .default("NEW"),
    notNowReason: varchar("not_now_reason", { length: 255 }),
    notNowUntil: date("not_now_until", { mode: "string" }),
    source: varchar("source", { length: 30 }),
    inviteTokenHash: varchar("invite_token_hash", { length: 128 }),
    inviteSentAt: timestamp("invite_sent_at", { withTimezone: true }),
    inviteClickedAt: timestamp("invite_clicked_at", { withTimezone: true }),
    inviteReminderSentAt: timestamp("invite_reminder_sent_at", { withTimezone: true }),
    inviteBouncedAt: timestamp("invite_bounced_at", { withTimezone: true }),
    unsubscribedAt: timestamp("unsubscribed_at", { withTimezone: true }),
    recruiterUserId: uuid("recruiter_user_id")
      .references(() => users.id, { onDelete: "restrict" }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    uniqueIndex("placement_tpo_leads_college_id_id_uq").on(t.collegeId, t.id),
    uniqueIndex("placement_tpo_leads_college_email_uq")
      .on(t.collegeId, t.emailNorm)
      .where(sql`${t.emailNorm} is not null`),
    uniqueIndex("placement_tpo_leads_college_phone_uq")
      .on(t.collegeId, t.phoneNorm)
      .where(sql`${t.phoneNorm} is not null`),
    uniqueIndex("placement_tpo_leads_invite_hash_uq")
      .on(t.inviteTokenHash)
      .where(sql`${t.inviteTokenHash} is not null`),
    index("placement_tpo_leads_college_stage_updated_idx")
      .on(t.collegeId, t.manualStage, t.updatedAt),
    index("placement_tpo_leads_owner_idx")
      .on(t.ownerMembershipId, t.updatedAt),
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
      sql`${t.phoneNorm} is null or ${t.phoneNorm} ~ '^[0-9]{7,20}
  ],
);

/**
 * DB09-A: legacy recruiter_lead_activity (8 fields). Adds college_id
 * for a composite tenant FK; updates/deletes prohibited by the
 * staged PostgreSQL history trigger.
 */
export const placementTpoLeadActivities = pgTable(
  "placement_tpo_lead_activities",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    collegeId: uuid("college_id")
      .notNull()
      .references(() => colleges.id, { onDelete: "restrict" }),
    leadId: uuid("lead_id").notNull(),
    type: varchar("type", { length: 20 }).notNull(),
    outcome: varchar("outcome", { length: 30 }),
    note: varchar("note", { length: 2000 }),
    isSystem: boolean("is_system").notNull().default(false),
    createdByUserId: uuid("created_by_user_id")
      .references(() => users.id, { onDelete: "restrict" }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull().defaultNow(),
  },
  (t) => [
    foreignKey({
      name: "placement_tpo_lead_activities_scoped_fk",
      columns: [t.collegeId, t.leadId],
      foreignColumns: [placementTpoLeads.collegeId, placementTpoLeads.id],
    }).onDelete("restrict"),
    index("placement_tpo_lead_activities_lead_time_idx")
      .on(t.collegeId, t.leadId, t.createdAt),
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
 * DB09-A: legacy follow_up (7 fields). The same-college FK stops a
 * forged child row from attaching to a lead in another college.
 */
export const placementTpoFollowups = pgTable(
  "placement_tpo_followups",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    collegeId: uuid("college_id")
      .notNull()
      .references(() => colleges.id, { onDelete: "restrict" }),
    leadId: uuid("lead_id").notNull(),
    dueAt: timestamp("due_at", { withTimezone: true }).notNull(),
    ownerMembershipId: uuid("owner_membership_id")
      .references(() => collegeMemberships.id, { onDelete: "restrict" }),
    note: varchar("note", { length: 500 }),
    doneAt: timestamp("done_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull().defaultNow(),
  },
  (t) => [
    foreignKey({
      name: "placement_tpo_followups_scoped_fk",
      columns: [t.collegeId, t.leadId],
      foreignColumns: [placementTpoLeads.collegeId, placementTpoLeads.id],
    }).onDelete("restrict"),
    index("placement_tpo_followups_college_due_idx")
      .on(t.collegeId, t.doneAt, t.dueAt),
    index("placement_tpo_followups_lead_idx")
      .on(t.collegeId, t.leadId),
  ],
);
`,
    ),
    check(
      "placement_tpo_leads_invite_hash_ck",
      sql`${t.inviteTokenHash} is null or ${t.inviteTokenHash} ~ '^[a-f0-9]{64}
  ],
);

/**
 * DB09-A: legacy recruiter_lead_activity (8 fields). Adds college_id
 * for a composite tenant FK; updates/deletes prohibited by the
 * staged PostgreSQL history trigger.
 */
export const placementTpoLeadActivities = pgTable(
  "placement_tpo_lead_activities",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    collegeId: uuid("college_id")
      .notNull()
      .references(() => colleges.id, { onDelete: "restrict" }),
    leadId: uuid("lead_id").notNull(),
    type: varchar("type", { length: 20 }).notNull(),
    outcome: varchar("outcome", { length: 30 }),
    note: varchar("note", { length: 2000 }),
    isSystem: boolean("is_system").notNull().default(false),
    createdByUserId: uuid("created_by_user_id")
      .references(() => users.id, { onDelete: "restrict" }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull().defaultNow(),
  },
  (t) => [
    foreignKey({
      name: "placement_tpo_lead_activities_scoped_fk",
      columns: [t.collegeId, t.leadId],
      foreignColumns: [placementTpoLeads.collegeId, placementTpoLeads.id],
    }).onDelete("restrict"),
    index("placement_tpo_lead_activities_lead_time_idx")
      .on(t.collegeId, t.leadId, t.createdAt),
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
 * DB09-A: legacy follow_up (7 fields). The same-college FK stops a
 * forged child row from attaching to a lead in another college.
 */
export const placementTpoFollowups = pgTable(
  "placement_tpo_followups",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    collegeId: uuid("college_id")
      .notNull()
      .references(() => colleges.id, { onDelete: "restrict" }),
    leadId: uuid("lead_id").notNull(),
    dueAt: timestamp("due_at", { withTimezone: true }).notNull(),
    ownerMembershipId: uuid("owner_membership_id")
      .references(() => collegeMemberships.id, { onDelete: "restrict" }),
    note: varchar("note", { length: 500 }),
    doneAt: timestamp("done_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull().defaultNow(),
  },
  (t) => [
    foreignKey({
      name: "placement_tpo_followups_scoped_fk",
      columns: [t.collegeId, t.leadId],
      foreignColumns: [placementTpoLeads.collegeId, placementTpoLeads.id],
    }).onDelete("restrict"),
    index("placement_tpo_followups_college_due_idx")
      .on(t.collegeId, t.doneAt, t.dueAt),
    index("placement_tpo_followups_lead_idx")
      .on(t.collegeId, t.leadId),
  ],
);
`,
    ),
  ],
);

/**
 * DB09-A: legacy recruiter_lead_activity (8 fields). Adds college_id
 * for a composite tenant FK; updates/deletes prohibited by the
 * staged PostgreSQL history trigger.
 */
export const placementTpoLeadActivities = pgTable(
  "placement_tpo_lead_activities",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    collegeId: uuid("college_id")
      .notNull()
      .references(() => colleges.id, { onDelete: "restrict" }),
    leadId: uuid("lead_id").notNull(),
    type: varchar("type", { length: 20 }).notNull(),
    outcome: varchar("outcome", { length: 30 }),
    note: varchar("note", { length: 2000 }),
    isSystem: boolean("is_system").notNull().default(false),
    createdByUserId: uuid("created_by_user_id")
      .references(() => users.id, { onDelete: "restrict" }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull().defaultNow(),
  },
  (t) => [
    foreignKey({
      name: "placement_tpo_lead_activities_scoped_fk",
      columns: [t.collegeId, t.leadId],
      foreignColumns: [placementTpoLeads.collegeId, placementTpoLeads.id],
    }).onDelete("restrict"),
    index("placement_tpo_lead_activities_lead_time_idx")
      .on(t.collegeId, t.leadId, t.createdAt),
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
 * DB09-A: legacy follow_up (7 fields). The same-college FK stops a
 * forged child row from attaching to a lead in another college.
 */
export const placementTpoFollowups = pgTable(
  "placement_tpo_followups",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    collegeId: uuid("college_id")
      .notNull()
      .references(() => colleges.id, { onDelete: "restrict" }),
    leadId: uuid("lead_id").notNull(),
    dueAt: timestamp("due_at", { withTimezone: true }).notNull(),
    ownerMembershipId: uuid("owner_membership_id")
      .references(() => collegeMemberships.id, { onDelete: "restrict" }),
    note: varchar("note", { length: 500 }),
    doneAt: timestamp("done_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull().defaultNow(),
  },
  (t) => [
    foreignKey({
      name: "placement_tpo_followups_scoped_fk",
      columns: [t.collegeId, t.leadId],
      foreignColumns: [placementTpoLeads.collegeId, placementTpoLeads.id],
    }).onDelete("restrict"),
    index("placement_tpo_followups_college_due_idx")
      .on(t.collegeId, t.doneAt, t.dueAt),
    index("placement_tpo_followups_lead_idx")
      .on(t.collegeId, t.leadId),
  ],
);
