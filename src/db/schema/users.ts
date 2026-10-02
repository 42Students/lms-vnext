import { sql } from "drizzle-orm";
import {
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
    platformStatus: userPlatformStatusEnum("platform_status")
      .notNull()
      .default("ACTIVE"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("users_email_ci_uq")
      .on(sql`lower(${table.email})`)
      .where(sql`${table.email} is not null`),
  ],
);
