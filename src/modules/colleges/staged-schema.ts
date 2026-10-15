import {pgTable,uuid,varchar,integer,timestamp} from "drizzle-orm/pg-core";
/** Proposed only: the authentication engine must not use this until an owner migration and auth design are approved. */
export const collegeSignInPoliciesStaged=pgTable("college_signin_policies",{
 collegeId:uuid("college_id").primaryKey(),
 method:varchar("method",{length:32}).notNull(),
 version:integer("version").notNull().default(0),
 updatedAt:timestamp("updated_at",{withTimezone:true}).notNull(),
});
