import {sql} from "drizzle-orm";
import {pgTable,uuid,varchar,timestamp,uniqueIndex,index} from "drizzle-orm/pg-core";
import {placementCompanies} from "./placements";
import {users} from "./users";

export const placementCompanyDomains=pgTable("placement_company_domains",{
 id:uuid("id").defaultRandom().primaryKey(),
 companyId:uuid("company_id").notNull().references(()=>placementCompanies.id,{onDelete:"restrict"}),
 domain:varchar("domain",{length:253}).notNull(),
 addedByUserId:uuid("added_by_user_id").notNull().references(()=>users.id,{onDelete:"restrict"}),
 createdAt:timestamp("created_at",{withTimezone:true}).notNull().defaultNow(),
},t=>[
 uniqueIndex("placement_company_domains_lower_domain_uq").on(sql`lower(${t.domain})`),
 index("placement_company_domains_company_idx").on(t.companyId),
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
