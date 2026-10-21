import { sql } from "drizzle-orm";
import {
  boolean,
  check,
  index,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { colleges } from "./colleges";

export const tenantDomains = pgTable(
  "tenant_domains",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    collegeId: uuid("college_id")
      .notNull()
      .references(() => colleges.id, { onDelete: "restrict" }),
    host: varchar("host", { length: 255 }).notNull(),
    isPrimary: boolean("is_primary").notNull().default(false),
    isVerified: boolean("is_verified").notNull().default(false),
    verificationToken: varchar("verification_token", { length: 255 }),
    verifiedAt: timestamp("verified_at", { withTimezone: true }),
    lastCheckedAt: timestamp("last_checked_at", { withTimezone: true }),
    lastCheckResult: text("last_check_result"),
    /** Redacted DNS TXT diagnostics; service must remove verification secrets. */
    lastFoundValues: varchar("last_found_values", { length: 512 }),
    /** Tombstone preserves ownership and historical verification audit. */
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("tenant_domains_host_uq")
      .on(sql`lower(${table.host})`)
      .where(sql`${table.deletedAt} is null`),
    index("tenant_domains_college_idx").on(table.collegeId),
    uniqueIndex("tenant_domains_college_primary_uq")
      .on(table.collegeId)
      .where(sql`${table.isPrimary} = true and ${table.deletedAt} is null`),
    check(
      "tenant_domains_primary_verified_ck",
      sql`not ${table.isPrimary} or ${table.isVerified}`,
    ),
  ],
);
