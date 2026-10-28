/**
 * DB04 learner profile gap closure — REGISTERED.
 *
 * Source-backed targets for active learner identity/resume/video fields.
 * DB-007 registers these tables and the VIDEO_INTRO receipt purpose in 0304.
 * External uploads still require scanner and object attestation.
 */
import { sql } from "drizzle-orm";
import {
  check,
  foreignKey,
  pgTable,
  primaryKey,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { collegeMemberships } from "./memberships";
import { profilePrivateDocumentReceipts } from "./profile-verification";

export const learnerProfileIdentitySummaries = pgTable(
  "learner_profile_identity_summaries",
  {
    learnerMembershipId: uuid("learner_membership_id")
      .primaryKey()
      .references(() => collegeMemberships.id, { onDelete: "restrict" }),
    aadhaarLast4: varchar("aadhaar_last4", { length: 4 }),
    panLast4: varchar("pan_last4", { length: 4 }),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    check(
      "learner_profile_identity_aadhaar_last4_ck",
      sql`${table.aadhaarLast4} is null or ${table.aadhaarLast4} ~ '^[0-9]{4}$'`,
    ),
    check(
      "learner_profile_identity_pan_last4_ck",
      sql`${table.panLast4} is null or ${table.panLast4} ~ '^[A-Z0-9]{4}$'`,
    ),
  ],
);

export const learnerProfilePrivateDocumentBindings = pgTable(
  "learner_profile_private_document_bindings",
  {
    learnerMembershipId: uuid("learner_membership_id")
      .notNull()
      .references(() => collegeMemberships.id, { onDelete: "restrict" }),
    purpose: varchar("purpose", { length: 32 }).notNull(),
    receiptId: uuid("receipt_id").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    primaryKey({
      name: "learner_profile_private_binding_pk",
      columns: [table.learnerMembershipId, table.purpose],
    }),
    foreignKey({
      name: "learner_profile_private_binding_receipt_fk",
      columns: [table.receiptId, table.learnerMembershipId, table.purpose],
      foreignColumns: [
        profilePrivateDocumentReceipts.id,
        profilePrivateDocumentReceipts.owningMembershipId,
        profilePrivateDocumentReceipts.purpose,
      ],
    }).onDelete("restrict"),
    uniqueIndex("learner_profile_private_binding_receipt_uq").on(
      table.receiptId,
    ),
    check(
      "learner_profile_private_binding_purpose_ck",
      sql`${table.purpose} in ('AADHAAR','PAN','RESUME')`,
    ),
  ],
);

export const learnerProfileVideoIntros = pgTable(
  "learner_profile_video_intros",
  {
    learnerMembershipId: uuid("learner_membership_id")
      .primaryKey()
      .references(() => collegeMemberships.id, { onDelete: "restrict" }),
    receiptId: uuid("receipt_id").notNull(),
    receiptPurpose: varchar("receipt_purpose", { length: 32 })
      .notNull()
      .default("VIDEO_INTRO"),
    uploadedAt: timestamp("uploaded_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    foreignKey({
      name: "learner_profile_video_intro_receipt_fk",
      columns: [
        table.receiptId,
        table.learnerMembershipId,
        table.receiptPurpose,
      ],
      foreignColumns: [
        profilePrivateDocumentReceipts.id,
        profilePrivateDocumentReceipts.owningMembershipId,
        profilePrivateDocumentReceipts.purpose,
      ],
    }).onDelete("restrict"),
    uniqueIndex("learner_profile_video_intro_receipt_uq").on(table.receiptId),
    check(
      "learner_profile_video_intro_purpose_ck",
      sql`${table.receiptPurpose} = 'VIDEO_INTRO'`,
    ),
    check(
      "learner_profile_video_intro_time_ck",
      sql`${table.uploadedAt} <= now() + interval '5 minutes'`,
    ),
  ],
);
