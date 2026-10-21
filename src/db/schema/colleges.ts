import { sql } from "drizzle-orm";
import {
  foreignKey,
  integer,
  check,
  index,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { organizations } from "./organizations";
import { collegeMemberships } from "./memberships";
import { collegeStatusEnum } from "./enums";

export const colleges = pgTable(
  "colleges",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    legacyCollegeId: integer("legacy_college_id"),
    legacyOrganizationId: integer("legacy_organization_id"),
    legacyUniqueId: varchar("legacy_unique_id",{length:64}),
    legacyChairId: integer("legacy_chair_id"),
    legacyViceChairId: integer("legacy_vice_chair_id"),
    legacyLogoUrl: varchar("legacy_logo_url",{length:255}),
    legacyDomainHost: varchar("legacy_domain_host",{length:255}),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "restrict" }),
    name: text("name").notNull(),
    code: varchar("code", { length: 64 }).notNull(),
    logoObjectPath: text("logo_object_path"),
    /** Optional roles point to a scoped college membership, not a global user. */
    chairMembershipId: uuid("chair_membership_id"),
    viceChairMembershipId: uuid("vice_chair_membership_id"),
    addressLine1: text("address_line1"),
    addressLine2: text("address_line2"),
    landmark: text("landmark"),
    city: varchar("city", { length: 128 }),
    state: varchar("state", { length: 128 }),
    country: varchar("country", { length: 128 }),
    postalCode: varchar("postal_code", { length: 32 }),
    status: collegeStatusEnum("status").notNull().default("ACTIVE"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("colleges_code_uq").on(sql`lower(${table.code})`),
    uniqueIndex("colleges_legacy_id_uq").on(table.legacyCollegeId)
      .where(sql`${table.legacyCollegeId} is not null`),
    uniqueIndex("colleges_legacy_unique_id_uq").on(sql`lower(${table.legacyUniqueId})`)
      .where(sql`${table.legacyUniqueId} is not null`),
    check("colleges_legacy_unique_id_ck",sql`
      ${table.legacyUniqueId} is null or length(trim(${table.legacyUniqueId})) between 1 and 64`),
    uniqueIndex("colleges_id_organization_uq").on(table.id, table.organizationId),
    foreignKey({
      name: "colleges_chair_membership_scope_fk",
      columns: [table.chairMembershipId, table.id],
      foreignColumns: [collegeMemberships.id, collegeMemberships.collegeId],
    }).onDelete("restrict"),
    foreignKey({
      name: "colleges_vice_chair_membership_scope_fk",
      columns: [table.viceChairMembershipId, table.id],
      foreignColumns: [collegeMemberships.id, collegeMemberships.collegeId],
    }).onDelete("restrict"),
    index("colleges_organization_idx").on(table.organizationId),
    index("colleges_organization_status_idx").on(
      table.organizationId,
      table.status,
    ),
  ],
);
