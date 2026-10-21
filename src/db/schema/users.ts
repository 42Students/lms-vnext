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
    /** Legacy identity snapshots are for controlled imports and staff display
     * only. Password hashes are deliberately not copied into vNext. */
    legacyUserName: varchar("legacy_user_name",{length:160}),
    legacyUniqueId: varchar("legacy_unique_id",{length:160}),
    legacyFirstName: varchar("legacy_first_name",{length:160}),
    legacyLastName: varchar("legacy_last_name",{length:160}),
    legacyBusinessTitle: varchar("legacy_business_title",{length:160}),
    legacyUserType: varchar("legacy_user_type",{length:40}),
    legacySourceCreatedLocal: timestamp("legacy_source_created_local",{withTimezone:false}),
    legacySourceUpdatedLocal: timestamp("legacy_source_updated_local",{withTimezone:false}),
    legacySourceTimeZone: varchar("legacy_source_time_zone",{length:80}),
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
    index("users_legacy_username_idx")
      .on(sql`lower(${table.legacyUserName})`)
      .where(sql`${table.legacyUserName} is not null`),
    index("users_legacy_unique_id_idx")
      .on(table.legacyUniqueId)
      .where(sql`${table.legacyUniqueId} is not null`),
    uniqueIndex("users_email_ci_uq")
      .on(sql`lower(${table.email})`)
      .where(sql`${table.email} is not null`),
  ],
);
