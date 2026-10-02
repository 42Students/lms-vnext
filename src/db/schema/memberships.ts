import {
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
    suspendedAt: timestamp("suspended_at", { withTimezone: true }),
    suspensionReason: text("suspension_reason"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("college_memberships_user_college_uq").on(
      table.userId,
      table.collegeId,
    ),
    index("college_memberships_college_status_idx").on(
      table.collegeId,
      table.status,
    ),
    index("college_memberships_user_status_idx").on(table.userId, table.status),
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
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("membership_roles_membership_role_uq").on(
      table.membershipId,
      table.role,
    ),
    index("membership_roles_role_idx").on(table.role),
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
