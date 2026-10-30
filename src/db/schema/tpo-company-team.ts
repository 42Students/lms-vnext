/** TPO-companies-05: college-private company context, never a recruiter-accessible thread. */
import {sql} from "drizzle-orm";
import {boolean,check,foreignKey,index,pgTable,primaryKey,text,timestamp,uniqueIndex,uuid} from "drizzle-orm/pg-core";
import {colleges} from "./colleges";
import {placementCompanies} from "./placements";
import {collegeMemberships} from "./memberships";

export const placementTpoCompanyTeamMessages=pgTable("placement_tpo_company_team_messages",{
 id:uuid("id").defaultRandom().primaryKey(),
 collegeId:uuid("college_id").notNull().references(()=>colleges.id,{onDelete:"restrict"}),
 companyId:uuid("company_id").notNull().references(()=>placementCompanies.id,{onDelete:"restrict"}),
 authorMembershipId:uuid("author_membership_id").notNull(),
 // Optional for existing internal writes; browser posts always supply the key.
 idempotencyKey:uuid("idempotency_key"),
 body:text("body").notNull(),
 decision:boolean("decision").notNull().default(false),
 askAssigneeMembershipId:uuid("ask_assignee_membership_id"),
 askDueAt:timestamp("ask_due_at",{withTimezone:true}),
 askStatus:text("ask_status"),
 editedAt:timestamp("edited_at",{withTimezone:true}),
 deletedAt:timestamp("deleted_at",{withTimezone:true}),
 createdAt:timestamp("created_at",{withTimezone:true}).notNull().defaultNow(),
},t=>[
 index("tpo_company_team_messages_college_company_time_idx").on(t.collegeId,t.companyId,t.createdAt),
 uniqueIndex("tpo_company_team_message_send_dedupe_uq").on(t.collegeId,t.companyId,t.authorMembershipId,t.idempotencyKey),
 foreignKey({name:"tpo_company_team_author_college_fk",columns:[t.authorMembershipId,t.collegeId],
  foreignColumns:[collegeMemberships.id,collegeMemberships.collegeId]}).onDelete("no action"),
 foreignKey({name:"tpo_company_team_assignee_college_fk",columns:[t.askAssigneeMembershipId,t.collegeId],
  foreignColumns:[collegeMemberships.id,collegeMemberships.collegeId]}).onDelete("no action"),
 check("tpo_company_team_message_body_ck",sql`length(btrim(${t.body})) between 1 and 4000`),
 check("tpo_company_team_ask_status_ck",sql`${t.askStatus} is null or ${t.askStatus} in ('OPEN','DONE','CANCELLED')`),
 check("tpo_company_team_ask_assignee_status_ck",sql`(${t.askAssigneeMembershipId} is null and ${t.askStatus} is null) or (${t.askAssigneeMembershipId} is not null and ${t.askStatus} is not null)`),
]);

export const placementTpoCompanyTeamFollows=pgTable("placement_tpo_company_team_follows",{
 collegeId:uuid("college_id").notNull().references(()=>colleges.id,{onDelete:"restrict"}),
 companyId:uuid("company_id").notNull().references(()=>placementCompanies.id,{onDelete:"restrict"}),
 membershipId:uuid("membership_id").notNull(),
 followedAt:timestamp("followed_at",{withTimezone:true}).notNull().defaultNow(),
},t=>[
 primaryKey({name:"tpo_company_team_follows_pk",columns:[t.collegeId,t.companyId,t.membershipId]}),
 foreignKey({name:"tpo_company_team_follow_member_college_fk",columns:[t.membershipId,t.collegeId],
  foreignColumns:[collegeMemberships.id,collegeMemberships.collegeId]}).onDelete("no action"),
]);
