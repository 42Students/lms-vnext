import { sql } from "drizzle-orm";
import { boolean, index, integer, pgTable, text, timestamp, uniqueIndex, uuid } from "drizzle-orm/pg-core";
import { organizationStatusEnum } from "./enums";

export const organizations = pgTable(
  "organizations",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    /** Imported numeric organization identity is never a public tenant selector. */
    legacyOrganizationId: integer("legacy_organization_id"),
    legacyWasDeleted: boolean("legacy_was_deleted"),
    legacySourceName:text("legacy_source_name"),
    legacyDeletedAt:timestamp("legacy_deleted_at",{withTimezone:true}),
    archivedAt:timestamp("archived_at",{withTimezone:true}),
    name: text("name").notNull(),
    status: organizationStatusEnum("status").notNull().default("ACTIVE"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("organizations_legacy_id_uq").on(table.legacyOrganizationId)
      .where(sql`${table.legacyOrganizationId} is not null`),
    index("organizations_legacy_source_name_idx").on(sql`lower(${table.legacySourceName})`)
      .where(sql`${table.legacySourceName} is not null and ${table.legacyOrganizationId} is not null`),
    uniqueIndex("organizations_active_name_uq")
      .on(sql`lower(${table.name})`)
      .where(sql`${table.status} = 'ACTIVE'`),
  ],
);
