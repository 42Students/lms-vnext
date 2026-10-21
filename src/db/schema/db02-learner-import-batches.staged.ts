/**
 * DB02 learner import lineage — registered storage in migration 0167.
 *
 * Current legacy production groups successfully-created learner accounts by a
 * bulk import UUID for audit/listing, but intentionally DISABLES generic batch
 * undo because imported learners may already own attendance/projects/etc.
 * This schema preserves lineage without creating a mass-delete primitive.
 * Producer and undo endpoints remain disabled until authorized membership
 * verification, dependency proof and reversible per-member actions are built.
 * Legacy bulkImportBatchId maps only after a trusted college+user UUID
 * crosswalk; vNext greenfield has no old rows to import.
 */
import { foreignKey, pgTable, primaryKey, timestamp, uniqueIndex, uuid } from "drizzle-orm/pg-core";
import { colleges } from "./colleges";
import { collegeMemberships } from "./memberships";
import { users } from "./users";

export const learnerImportBatches = pgTable(
  "learner_import_batches",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    collegeId: uuid("college_id")
      .notNull()
      .references(() => colleges.id, { onDelete: "restrict" }),
    createdByUserId: uuid("created_by_user_id")
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("learner_import_batches_id_college_uq").on(
      table.id,
      table.collegeId,
    ),
  ],
);

export const learnerImportBatchMembers = pgTable(
  "learner_import_batch_members",
  {
    batchId: uuid("batch_id").notNull(),
    collegeId: uuid("college_id").notNull(),
    membershipId: uuid("membership_id").notNull(),
    linkedAt: timestamp("linked_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    primaryKey({
      name: "learner_import_batch_members_pk",
      columns: [table.batchId, table.membershipId],
    }),
    foreignKey({
      name: "learner_import_batch_members_batch_fk",
      columns: [table.batchId, table.collegeId],
      foreignColumns: [
        learnerImportBatches.id,
        learnerImportBatches.collegeId,
      ],
    }).onDelete("restrict"),
    foreignKey({
      name: "learner_import_batch_members_membership_fk",
      columns: [table.membershipId, table.collegeId],
      foreignColumns: [
        collegeMemberships.id,
        collegeMemberships.collegeId,
      ],
    }).onDelete("restrict"),
    uniqueIndex("learner_import_batch_member_once_uq").on(
      table.membershipId,
    ),
  ],
);
