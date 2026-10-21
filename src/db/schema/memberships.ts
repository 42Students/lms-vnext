import { sql } from "drizzle-orm";
import {
  check,
  integer,
  index,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import {
  membershipRoleEnum,
  membershipStatusEnum,
  systemRoleEnum,
} from "./enums";
import { colleges } from "./colleges";
import { users } from "./users";

export const collegeMemberships = pgTable(
  "college_memberships",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    collegeId: uuid("college_id")
      .notNull()
      .references(() => colleges.id, { onDelete: "restrict" }),
    status: membershipStatusEnum("status").notNull().default("ACTIVE"),
    /** Mapping source account to one scoped membership; not an auth key. */
    legacyMembershipId: integer("legacy_membership_id"),
    legacyRemovedAt: timestamp("legacy_removed_at",{withTimezone:true}),
    suspendedAt: timestamp("suspended_at", { withTimezone: true }),
    suspensionReason: text("suspension_reason"),
    /** Membership-scoped write CAS; do not substitute for auth device revocation. */
    version: integer("version").notNull().default(1),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("college_memberships_legacy_college_id_uq")
      .on(table.collegeId,table.legacyMembershipId)
      .where(sql`${table.legacyMembershipId} is not null`),
    check("college_memberships_legacy_removed_ck",sql`
      ${table.legacyRemovedAt} is null or ${table.status} <> 'ACTIVE'`),
    uniqueIndex("college_memberships_user_college_uq").on(
      table.userId,
      table.collegeId,
    ),
    uniqueIndex("college_memberships_id_user_college_uq").on(
      table.id,
      table.userId,
      table.collegeId,
    ),
    uniqueIndex("college_memberships_id_college_uq").on(table.id, table.collegeId),
    index("college_memberships_college_status_idx").on(
      table.collegeId,
      table.status,
    ),
    index("college_memberships_user_status_idx").on(table.userId, table.status),
    check("college_memberships_version_ck", sql`${table.version} > 0`),
  ],
);

export const membershipRoles = pgTable(
  "membership_roles",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    membershipId: uuid("membership_id")
      .notNull()
      .references(() => collegeMemberships.id),
    role: membershipRoleEnum("role").notNull(),
    legacyRoleId: integer("legacy_role_id"),
    /** Imported role authority and audit are separate from the protected role enum. */
    assignedByUserId: uuid("assigned_by_user_id").references(
      () => users.id, { onDelete: "restrict" },
    ),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("membership_roles_membership_role_uq").on(
      table.membershipId,
      table.role,
    ),
    index("membership_roles_role_idx").on(table.role),
    index("membership_roles_source_lookup_idx").on(table.legacyRoleId,table.membershipId)
      .where(sql`${table.legacyRoleId} is not null`),
  ],
);

export const systemRoles = pgTable(
  "system_roles",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id),
    role: systemRoleEnum("role").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("system_roles_user_role_uq").on(table.userId, table.role),
    index("system_roles_role_idx").on(table.role),
  ],
);
