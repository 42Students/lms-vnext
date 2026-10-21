import {sql} from "drizzle-orm";
import {boolean,check,integer,pgTable,uuid,varchar,timestamp,uniqueIndex,index} from "drizzle-orm/pg-core";
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
 legacyAddedByUserId:integer("legacy_added_by_user_id"),
 legacyAddedByUserName:varchar("legacy_added_by_user_name",{length:160}),
 legacySourceTimeZone:varchar("legacy_source_time_zone",{length:60}),
 /** Imported system actor may have no surviving user; live service still requires an actor. */
 addedByUserId:uuid("added_by_user_id").references(()=>users.id,{onDelete:"restrict"}),
 createdAt:timestamp("created_at",{withTimezone:true}).notNull().defaultNow(),
},t=>[
 uniqueIndex("placement_company_domains_lower_domain_uq").on(sql`lower(${t.domain})`),
 index("placement_company_domains_company_idx").on(t.companyId),
 index("placement_company_domains_company_order_idx").on(t.companyId,t.domain,t.id),
 check("placement_company_domains_name_ck",sql`length(trim(${t.domain})) between 1 and 253`),
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

/** The old source badge belongs to each verified domain, never the parent company. */
export function legacyCompanyDomainVerificationCopy(verifiedBy42: boolean): string {
  return verifiedBy42 ? "Verified by 42" : "Not verified";
}

/** Source 150-character input bound; do not truncate old imported 253-char domains. */
export function normalizeLegacyCompanyDomainInput(raw: string): {
  value: string | null; error: "REQUIRED" | "TOO_LONG" | "INVALID" | null;
} {
  const value = raw.trim().toLowerCase().replace(/\.$/, "");
  if (!value) return { value: null, error: "REQUIRED" };
  if (value.length > 150) return { value: null, error: "TOO_LONG" };
  const labels = value.split(".");
  if (labels.length < 2 || labels.some(part=>part.length===0 || part.length>63 ||
    !/^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/.test(part))) {
    return { value: null, error: "INVALID" };
  }
  return { value, error: null };
}
