import {sql} from "drizzle-orm";
import {check,pgTable,text,timestamp,uniqueIndex,uuid,varchar} from "drizzle-orm/pg-core";
import {users} from "./users";
import {colleges} from "./colleges";

/** Encrypted Google refresh credentials are never included in public queries.
 * A connection is scoped to the exact signed-in user and their active college.
 * Revocation nulls the ciphertext so the secret cannot be refreshed again.
 */
export const mentorGoogleCalendarConnections=pgTable("mentor_google_calendar_connections",{
 id:uuid("id").defaultRandom().primaryKey(),
 userId:uuid("user_id").notNull().references(()=>users.id,{onDelete:"restrict"}),
 collegeId:uuid("college_id").notNull().references(()=>colleges.id,{onDelete:"restrict"}),
 refreshTokenCiphertext:text("refresh_token_ciphertext"),
 scope:text("scope").notNull(),
 calendarId:varchar("calendar_id",{length:254}).notNull().default("primary"),
 connectedAt:timestamp("connected_at",{withTimezone:true}).notNull().defaultNow(),
 updatedAt:timestamp("updated_at",{withTimezone:true}).notNull().defaultNow(),
 revokedAt:timestamp("revoked_at",{withTimezone:true}),
},table=>[
 uniqueIndex("mentor_google_calendar_connections_owner_uq").on(table.userId,table.collegeId),
 check("mentor_google_calendar_connections_token_state_ck",
  sql`${table.revokedAt} is not null or ${table.refreshTokenCiphertext} is not null`),
]);
