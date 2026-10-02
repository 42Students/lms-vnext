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
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("tenant_domains_host_uq").on(sql`lower(${table.host})`),
    index("tenant_domains_college_idx").on(table.collegeId),
    uniqueIndex("tenant_domains_college_primary_uq")
      .on(table.collegeId)
      .where(sql`${table.isPrimary} = true`),
    check(
      "tenant_domains_primary_verified_ck",
      sql`not ${table.isPrimary} or ${table.isVerified}`,
    ),
  ],
);
