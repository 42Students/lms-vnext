import { sql } from "drizzle-orm";
import {
  check,
  integer,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { userPlatformStatusEnum } from "./enums";

export const users = pgTable(
  "users",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    identityUid: varchar("identity_uid", { length: 128 }).notNull().unique(),
    phoneE164: varchar("phone_e164", { length: 32 }).unique(),
    email: text("email"),
    displayName: text("display_name"),
    /** Global identity write CAS; membership/profile revisions remain independent. */
    version: integer("version").notNull().default(1),
    platformStatus: userPlatformStatusEnum("platform_status")
      .notNull()
      .default("ACTIVE"),
    /** Historic successful sign-in time; authorization uses live session/role state. */
    lastLoginAt: timestamp("last_login_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    check("users_version_ck", sql`${table.version} > 0`),
    uniqueIndex("users_email_ci_uq")
      .on(sql`lower(${table.email})`)
      .where(sql`${table.email} is not null`),
  ],
);
