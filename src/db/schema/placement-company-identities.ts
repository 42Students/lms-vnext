import {sql} from "drizzle-orm";
import {boolean,integer,pgTable,uuid,varchar,timestamp,uniqueIndex,index} from "drizzle-orm/pg-core";
import {placementCompanies} from "./placements";
import {users} from "./users";
import {colleges} from "./colleges";

export const placementCompanyDomains=pgTable("placement_company_domains",{
 id:uuid("id").defaultRandom().primaryKey(),
 companyId:uuid("company_id").notNull().references(()=>placementCompanies.id,{onDelete:"restrict"}),
 domain:varchar("domain",{length:253}).notNull(),
 /** Domain trust is independent of company-level verification. */
 verifiedBy42:boolean("verified_by_42").notNull().default(false),
 verifiedAt:timestamp("verified_at",{withTimezone:true}),
 verifiedByUserId:uuid("verified_by_user_id").references(()=>users.id,{onDelete:"restrict"}),
 /** Imported actor/college provenance; never used to confer authorization. */
 addedByCollegeId:uuid("added_by_college_id").references(()=>colleges.id,{onDelete:"restrict"}),
 addedByUserType:varchar("added_by_user_type",{length:32}),
 legacyDomainId:integer("legacy_domain_id"),
 legacyCompanyId:integer("legacy_company_id"),
 legacyAddedByCollegeId:integer("legacy_added_by_college_id"),
 addedByUserId:uuid("added_by_user_id").notNull().references(()=>users.id,{onDelete:"restrict"}),
 createdAt:timestamp("created_at",{withTimezone:true}).notNull().defaultNow(),
},t=>[
 uniqueIndex("placement_company_domains_lower_domain_uq").on(sql`lower(${t.domain})`),
 index("placement_company_domains_company_idx").on(t.companyId),
 index("placement_company_domains_verification_idx").on(t.companyId,t.verifiedBy42),
]);

export const placementCompanyAliases=pgTable("placement_company_aliases",{
 id:uuid("id").defaultRandom().primaryKey(),
 companyId:uuid("company_id").notNull().references(()=>placementCompanies.id,{onDelete:"restrict"}),
 alias:varchar("alias",{length:160}).notNull(),
 addedByUserId:uuid("added_by_user_id").notNull().references(()=>users.id,{onDelete:"restrict"}),
 createdAt:timestamp("created_at",{withTimezone:true}).notNull().defaultNow(),
},t=>[
 uniqueIndex("placement_company_aliases_lower_alias_uq").on(sql`lower(${t.alias})`),
 index("placement_company_aliases_company_idx").on(t.companyId),
]);
