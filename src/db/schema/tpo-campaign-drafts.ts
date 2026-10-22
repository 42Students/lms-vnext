/** TPO-campaigns-public-01/02: composer content for a TPO email campaign (one row per campaign). */
import { sql } from "drizzle-orm";
import {
  check,
  foreignKey,
  jsonb,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { colleges } from "./colleges";
import { placementTpoEmailCampaigns } from "./tpo-crm";
import { users } from "./users";

export const placementTpoCampaignDrafts = pgTable(
  "placement_tpo_campaign_drafts",
  {
    campaignId: uuid("campaign_id").primaryKey(),
    collegeId: uuid("college_id")
      .notNull()
      .references(() => colleges.id, { onDelete: "restrict" }),
    title: varchar("title", { length: 160 }).notNull(),
    subject: varchar("subject", { length: 200 }).notNull(),
    body: text("body").notNull(),
    /** TPO-campaigns-public-02: saved suppression summary (counts only; never addresses or tokens). */
    suppressionCounts: jsonb("suppression_counts")
      .$type<Record<string, number>>()
      .notNull()
      .default({}),
    /** Drift fix: created by migration 0105; sender display name shown on the draft. */
    senderName: varchar("sender_name", { length: 200 }).notNull(),
    suppressedCounts: jsonb("suppressed_counts")
      .$type<Record<string, number>>()
      .notNull()
      .default({}),
    templateKey: varchar("template_key", { length: 160 }).notNull(),
    segment: varchar("segment", { length: 24 }).notNull(),
    createdByUserId: uuid("created_by_user_id")
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    foreignKey({
      name: "tpo_campaign_draft_campaign_scope_fk",
      columns: [t.collegeId, t.campaignId],
      foreignColumns: [
        placementTpoEmailCampaigns.collegeId,
        placementTpoEmailCampaigns.id,
      ],
    }).onDelete("restrict"),
    check(
      "tpo_campaign_draft_segment_ck",
      sql`${t.segment} IN ('ALL_ELIGIBLE','NEW','UNASSIGNED')`,
    ),
    check(
      "tpo_campaign_draft_suppression_counts_ck",
      sql`jsonb_typeof(${t.suppressionCounts})='object'`,
    ),
    check(
      "tpo_campaign_draft_body_ck",
      sql`length(trim(${t.body})) BETWEEN 2 AND 10000`,
    ),
  ],
);

/**
 * Legacy V214 campaign header import mapping. Resolve both numeric principals
 * through a college-scoped crosswalk before writing either destination table.
 * Do not infer sender identity from an email, or reinterpret a sent campaign
 * as an editable draft. Old delivery counters stay available for audit.
 */
export function mapLegacyTpoCampaignHeader(
  row: {
    id: number;
    collegeId: number;
    subject: string;
    body: string;
    sentByFacultyId: number;
    recipients: number;
    sent: number;
    skipped: number;
    failed: number;
    createdAt: Date;
  },
  resolved: {
    collegeId: string;
    senderUserId: string;
    senderName: string;
  },
) {
  const counters = [row.recipients, row.sent, row.skipped, row.failed];
  if (
    !Number.isSafeInteger(row.id) || row.id <= 0 ||
    !Number.isSafeInteger(row.collegeId) || row.collegeId <= 0 ||
    !Number.isSafeInteger(row.sentByFacultyId) || row.sentByFacultyId <= 0 ||
    counters.some((count) => !Number.isSafeInteger(count) || count < 0) ||
    row.recipients > 500 ||
    row.sent + row.skipped + row.failed > row.recipients ||
    row.subject.trim().length === 0 || row.subject.length > 200 ||
    row.body.trim().length < 2 || row.body.length > 10000 ||
    !Number.isFinite(row.createdAt.getTime()) ||
    !resolved.collegeId || !resolved.senderUserId || !resolved.senderName.trim()
  ) {
    throw new Error("Invalid legacy TPO campaign header: quarantine source row");
  }

  const status = row.sent + row.skipped + row.failed === row.recipients
    ? "SENT" as const
    : "CANCELLED" as const;
  return {
    campaign: {
      legacyCampaignId: row.id,
      legacySenderUserId: row.sentByFacultyId,
      collegeId: resolved.collegeId,
      createdByUserId: resolved.senderUserId,
      status,
      totalRecipients: row.recipients,
      legacySubject: row.subject,
      legacyBody: row.body,
      legacySentCount: row.sent,
      legacyFailedCount: row.failed,
      createdAt: row.createdAt,
    },
    draft: {
      collegeId: resolved.collegeId,
      title: row.subject.slice(0, 160),
      subject: row.subject,
      body: row.body,
      senderName: resolved.senderName,
      createdByUserId: resolved.senderUserId,
      templateKey: "LEGACY_IMPORTED",
      segment: "ALL_ELIGIBLE" as const,
      suppressionCounts: { legacySkipped: row.skipped },
      suppressedCounts: { legacySkipped: row.skipped },
      createdAt: row.createdAt,
    },
  };
}
