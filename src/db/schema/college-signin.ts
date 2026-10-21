import { sql } from "drizzle-orm";
import { check, integer, pgTable, timestamp, uuid, varchar } from "drizzle-orm/pg-core";
import { colleges } from "./colleges";

/**
 * Per-college sign-in method policy. The authentication engine must not treat
 * this as an override until historical identifiers/credentials are validated.
 * Legacy college_branding.login_methods map: EMAIL_PHONE→EMAIL_AND_PHONE,
 * PHONE_EMAIL→PHONE_AND_EMAIL, EMAIL_ONLY/PHONE_ONLY unchanged.
 * A NULL old method means inherited email-first DEFAULT, NOT a saved override;
 * do not insert a policy row for it. Only explicit authorized non-null legacy
 * settings can create a versioned college policy after UUID college crosswalk.
 * Unknown strings must be refused, never coerced into a permissive login mode.
 * Main public sign-in stays independently email-first in the vNext auth model.
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
