import {
  index,
  jsonb,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

export const legacyIdMap = pgTable(
  "legacy_id_map",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    legacyEntityType: text("legacy_entity_type").notNull(),
    legacyId: text("legacy_id").notNull(),
    newEntityType: text("new_entity_type").notNull(),
    newId: uuid("new_id").notNull(),
    metadata: jsonb("metadata").$type<Record<string, unknown>>(),
    migratedAt: timestamp("migrated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("legacy_id_map_source_target_uq").on(
      table.legacyEntityType,
      table.legacyId,
      table.newEntityType,
    ),
    index("legacy_id_map_new_id_idx").on(table.newId),
  ],
);
