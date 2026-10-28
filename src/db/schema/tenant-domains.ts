import { sql } from "drizzle-orm";
import {
  boolean,
  check,
  index,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { colleges } from "./colleges";

export const tenantDomains = pgTable(
  "tenant_domains",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    collegeId: uuid("college_id")
      .notNull()
      .references(() => colleges.id, { onDelete: "restrict" }),
    host: varchar("host", { length: 255 }).notNull(),
    isPrimary: boolean("is_primary").notNull().default(false),
    isVerified: boolean("is_verified").notNull().default(false),
    verificationToken: varchar("verification_token", { length: 255 }),
    verifiedAt: timestamp("verified_at", { withTimezone: true }),
    lastCheckedAt: timestamp("last_checked_at", { withTimezone: true }),
    lastCheckResult: text("last_check_result"),
    /** Redacted DNS TXT diagnostics; service must remove verification secrets. */
    lastFoundValues: varchar("last_found_values", { length: 512 }),
    /** Tombstone preserves ownership and historical verification audit. */
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    // Retired names remain reserved globally. A partial live-only index
    // permitted a second owner to claim a tombstoned host via direct SQL.
    uniqueIndex("tenant_domains_host_uq")
      .on(sql`lower(${table.host})`),
    index("tenant_domains_college_idx").on(table.collegeId),
    uniqueIndex("tenant_domains_college_primary_uq")
      .on(table.collegeId)
      .where(sql`${table.isPrimary} = true and ${table.deletedAt} is null`),
    check(
      "tenant_domains_primary_verified_ck",
      sql`not ${table.isPrimary} or ${table.isVerified}`,
    ),
  ],
);

/** Import helper, not a substitute for an authorized verified-domain
 * provisioning action. Old integer college IDs require a verified crosswalk
 * to college UUIDs, and unverified source primary flags are quarantined. */
export function canonicalTenantHost(value:string):string{
 const host=value.trim().toLowerCase().replace(/\.$/,"");
 const labels=host.split(".");
 if(host.length>253||labels.length<2||labels.some(label=>
    label.length>63||!/^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/.test(label))||
    !/^(?:[a-z]{2,63}|xn--[a-z0-9-]{2,59})$/.test(labels[labels.length-1]??"")||
    /^\d+(?:\.\d+){3}$/.test(host))
  throw new Error("Invalid tenant domain host");
 return host;
}
export function legacyPrimaryTenantDomainCandidate(input:{
 legacyCollegeId:number;resolvedCollegeId:string|null;
 host:string;isPrimary:boolean;isVerified:boolean;verifiedAt:string|null;
}){
 if(!Number.isSafeInteger(input.legacyCollegeId)||input.legacyCollegeId<1||
    !input.resolvedCollegeId||
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(input.resolvedCollegeId))
  throw new Error("Unmapped legacy tenant college");
 if(input.isPrimary&&!input.isVerified)
  throw new Error("Unverified legacy primary must be reviewed before activation");
 const sourceTimestamp=input.verifiedAt?.trim()??"";
 if(input.isVerified!==Boolean(sourceTimestamp))
  throw new Error("Legacy domain verification status and timestamp conflict");
 if(sourceTimestamp&&(
    !/(?:Z|[+-]\d{2}:\d{2})$/.test(sourceTimestamp)||
    !Number.isFinite(Date.parse(sourceTimestamp))))
  throw new Error("Legacy domain verification timestamp requires timezone review");
 const verified=input.isVerified&&Boolean(sourceTimestamp);
 return {collegeId:input.resolvedCollegeId,host:canonicalTenantHost(input.host),
   isPrimary:input.isPrimary&&verified,isVerified:verified};
}
/** Public logos are resolved via the college branding's authorized object-key
 * grant, never from raw legacy image URLs or DNS diagnostic values. */
export const LEGACY_TENANT_DOMAIN_IMPORT_NOTES={
 diagnostics:"Redact TXT verification secrets and keep old raw DNS values in restricted import diagnostics",
 primary:"Prefer the newest verified canonical host per college; primary is never inferred from an unverified row",
 branding:"Re-upload and scan historic college logo assets before issuing signed/public images",
} as const;

/** Retained source domain tombstones never enter primary-host selection or
 * normal college branding. Only a verified, live domain can be made primary. */
export function legacyTenantDomainImportPlan(input:{
 legacyDomainId:string;legacyCollegeId:number;
 resolvedCollegeId:string|null;host:string;
 isDeleted:boolean;isPrimary:boolean;isVerified:boolean;
 verifiedAt:string|null;lastFoundValues:string|null;
}){
 if(!/^[1-9][0-9]{0,18}$/.test(input.legacyDomainId))
  throw new Error("Invalid historic domain identity");
 const active=legacyPrimaryTenantDomainCandidate({
  legacyCollegeId:input.legacyCollegeId,
  resolvedCollegeId:input.resolvedCollegeId,host:input.host,
  isPrimary:input.isPrimary&&!input.isDeleted,
  isVerified:input.isVerified,verifiedAt:input.verifiedAt,
 });
 const redacted=input.lastFoundValues?.replace(/(?:token|verification|secret)\s*[=:]\s*\S+/gi,
  "[REDACTED]").slice(0,512)??null;
 return {...active,sourceId:input.legacyDomainId,
  isPrimary:active.isPrimary&&!input.isDeleted,
  status:input.isDeleted?"ARCHIVED" as const:"ACTIVE" as const,
  diagnostics:redacted,requireNewVerification:!active.isVerified};
}


/** Prefer an actively verified, time-stamped college host. The legacy mail
 * sender fell back to an unverified primary domain; never do that here.
 * The URL can be used only after the calling service verifies the college's
 * active tenant scope, and the public fallback must itself be configured
 * on a trusted HTTPS host by the operator. */
export function verifiedCollegeEmailHost(
 collegeId:string,
 records:readonly {collegeId:string;host:string;isVerified:boolean;
  isPrimary:boolean;verifiedAt:Date|null;status?:string}[],
):string|null{
 const verified=records.filter(row=>row.collegeId===collegeId&&
  row.isVerified&&row.verifiedAt instanceof Date&&
  Number.isFinite(row.verifiedAt.getTime())&&row.status!=="ARCHIVED")
  .sort((a,b)=>Number(b.isPrimary)-Number(a.isPrimary)||
   b.verifiedAt!.getTime()-a.verifiedAt!.getTime()||
   a.host.localeCompare(b.host));
 for(const row of verified){
  try{return canonicalTenantHost(row.host);}catch{continue;}
 }
 return null;
}
