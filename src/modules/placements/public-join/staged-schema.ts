/** Proposal only. All public queries must check table registration first. */
import {integer,pgTable,timestamp,uuid,varchar,index,uniqueIndex} from "drizzle-orm/pg-core";
export const publicJoinLinks=pgTable("placement_public_join_links",{
 id:uuid("id").defaultRandom().primaryKey(),
 tokenHash:varchar("token_hash",{length:64}).notNull(),
 collegeId:uuid("college_id").notNull(),
 companyId:uuid("company_id"),
 companyDomain:varchar("company_domain",{length:254}),
 scope:varchar("scope",{length:12}).notNull(),
 expiresAt:timestamp("expires_at",{withTimezone:true}).notNull(),
 revokedAt:timestamp("revoked_at",{withTimezone:true}),
 createdAt:timestamp("created_at",{withTimezone:true}).notNull().defaultNow(),
},t=>[uniqueIndex("public_join_links_hash_uq").on(t.tokenHash),
 index("public_join_links_college_idx").on(t.collegeId,t.scope)]);
export const publicJoinChallenges=pgTable("placement_public_join_challenges",{
 id:uuid("id").defaultRandom().primaryKey(),
 linkId:uuid("link_id").notNull(),
 workEmail:varchar("work_email",{length:254}).notNull(),
 codeHash:varchar("code_hash",{length:64}).notNull(),
 attempts:integer("attempts").notNull().default(0),
 expiresAt:timestamp("expires_at",{withTimezone:true}).notNull(),
 verifiedAt:timestamp("verified_at",{withTimezone:true}),
 createdAt:timestamp("created_at",{withTimezone:true}).notNull().defaultNow(),
},t=>[index("public_join_challenges_link_email_idx").on(t.linkId,t.workEmail,t.createdAt)]);
