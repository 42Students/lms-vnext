import { sql } from "drizzle-orm";
import {
  foreignKey,
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
