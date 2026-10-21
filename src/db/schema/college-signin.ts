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

/** DDL 0066 stores per-college overrides only. Old missing values inherited
 * the email-first default, not a hidden global admin policy. */
export function legacyCollegeSigninPolicy(
 rawMethod:string|null,verifiedCollegeId:string,
):{collegeId:string;method:"EMAIL_AND_PHONE"|"PHONE_AND_EMAIL"|"EMAIL_ONLY"|"PHONE_ONLY"}|null{
 if(rawMethod===null)return null;
 const map:Record<string,"EMAIL_AND_PHONE"|"PHONE_AND_EMAIL"|"EMAIL_ONLY"|"PHONE_ONLY">={
  EMAIL_PHONE:"EMAIL_AND_PHONE",PHONE_EMAIL:"PHONE_AND_EMAIL",
  EMAIL_ONLY:"EMAIL_ONLY",PHONE_ONLY:"PHONE_ONLY",
  EMAIL_AND_PHONE:"EMAIL_AND_PHONE",PHONE_AND_EMAIL:"PHONE_AND_EMAIL",
 };
 const method=map[rawMethod.trim().toUpperCase()];
 if(!method)throw new Error("Unsupported historical college sign-in mode");
 if(!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(verifiedCollegeId))
  throw new Error("Unresolved source college");
 return {collegeId:verifiedCollegeId,method};
}
