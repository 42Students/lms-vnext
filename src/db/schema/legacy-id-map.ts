import { sql } from "drizzle-orm";
import {
  check,
  foreignKey,
  index,
  jsonb,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { colleges } from "./colleges";

/**
 * One row per legacy-data import run (migration 0097). A batch is always
 * college scoped so an import can be audited and rolled back per tenant.
 * Used by the NSRIT legacy loader; no application code writes it.
 */
export const dataImportBatches = pgTable(
  "data_import_batches",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    collegeId: uuid("college_id")
      .notNull()
      .references(() => colleges.id, { onDelete: "restrict" }),
    sourceSystem: varchar("source_system", { length: 40 })
      .notNull()
      .default("LMS_LEGACY"),
    sourceLabel: varchar("source_label", { length: 120 }),
    loaderVersion: varchar("loader_version", { length: 40 }),
    snapshotSha256: varchar("snapshot_sha256", { length: 64 }),
    status: varchar("status", { length: 16 }).notNull().default("RUNNING"),
    counts: jsonb("counts").$type<Record<string, unknown>>(),
    startedAt: timestamp("started_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    finishedAt: timestamp("finished_at", { withTimezone: true }),
    rolledBackAt: timestamp("rolled_back_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    // Parent key for legacy_id_map's composite same-college FK.
    uniqueIndex("data_import_batches_id_college_uq").on(
      table.id,
      table.collegeId,
    ),
    index("data_import_batches_college_started_idx").on(
      table.collegeId,
      table.startedAt,
    ),
    check(
      "data_import_batches_status_ck",
      sql`${table.status} in ('RUNNING', 'COMPLETED', 'FAILED', 'ROLLED_BACK')`,
    ),
    check(
      "data_import_batches_sha_ck",
      sql`${table.snapshotSha256} is null or ${table.snapshotSha256} ~ '^[0-9a-f]{64}$'`,
    ),
    check(
      "data_import_batches_lifecycle_ck",
      sql`(${table.status} = 'RUNNING' and ${table.finishedAt} is null and ${table.rolledBackAt} is null)
        or (${table.status} in ('COMPLETED', 'FAILED') and ${table.finishedAt} is not null and ${table.rolledBackAt} is null)
        or (${table.status} = 'ROLLED_BACK' and ${table.rolledBackAt} is not null)`,
    ),
  ],
);

/**
 * Legacy id to vNext id mapping. Rows with a college_id are tenant scoped
 * (unique per college + source system + legacy entity + legacy id + target
 * entity) and may carry the import batch that created them; rows without a
 * college_id keep the original global uniqueness.
 */
export const legacyIdMap = pgTable(
  "legacy_id_map",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    legacyEntityType: text("legacy_entity_type").notNull(),
    legacyId: text("legacy_id").notNull(),
    newEntityType: text("new_entity_type").notNull(),
    newId: uuid("new_id").notNull(),
    metadata: jsonb("metadata").$type<Record<string, unknown>>(),
    collegeId: uuid("college_id").references(() => colleges.id, {
      onDelete: "restrict",
    }),
    batchId: uuid("batch_id"),
    sourceSystem: varchar("source_system", { length: 40 })
      .notNull()
      .default("LMS_LEGACY"),
    sourceHash: varchar("source_hash", { length: 64 }),
    migratedAt: timestamp("migrated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("legacy_id_map_source_target_uq")
      .on(table.legacyEntityType, table.legacyId, table.newEntityType)
      .where(sql`${table.collegeId} is null`),
    uniqueIndex("legacy_id_map_college_source_target_uq")
      .on(
        table.collegeId,
        table.sourceSystem,
        table.legacyEntityType,
        table.legacyId,
        table.newEntityType,
      )
      .where(sql`${table.collegeId} is not null`),
    index("legacy_id_map_new_id_idx").on(table.newId),
    index("legacy_id_map_batch_idx")
      .on(table.batchId)
      .where(sql`${table.batchId} is not null`),
    foreignKey({
      name: "legacy_id_map_batch_college_fk",
      columns: [table.batchId, table.collegeId],
      foreignColumns: [dataImportBatches.id, dataImportBatches.collegeId],
    }).onDelete("restrict"),
    check(
      "legacy_id_map_batch_college_ck",
      sql`${table.batchId} is null or ${table.collegeId} is not null`,
    ),
    check(
      "legacy_id_map_source_hash_ck",
      sql`${table.sourceHash} is null or ${table.sourceHash} ~ '^[0-9a-f]{64}$'`,
    ),
  ],
);
