import { sql } from "drizzle-orm";
import { check, integer, pgTable, timestamp, uuid, varchar } from "drizzle-orm/pg-core";
import { colleges } from "./colleges";

/**
 * Per-college sign-in method policy. The authentication engine must not treat
 * this as an override until historical identifiers/credentials are validated.
 */
export const collegeSigninPolicies = pgTable(
  "college_signin_policies",
  {
    collegeId: uuid("college_id")
      .primaryKey()
      .references(() => colleges.id, { onDelete: "restrict" }),
    method: varchar("method", { length: 32 }).notNull(),
    version: integer("version").notNull().default(0),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    check(
      "college_signin_policies_method_ck",
      sql`${t.method} in ('EMAIL_AND_PHONE', 'PHONE_AND_EMAIL', 'EMAIL_ONLY', 'PHONE_ONLY')`,
    ),
    check("college_signin_policies_version_ck", sql`${t.version} >= 0`),
  ],
);
