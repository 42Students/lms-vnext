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
    uniqueIndex("tenant_domains_host_uq")
      .on(sql`lower(${table.host})`)
      .where(sql`${table.deletedAt} is null`),
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
 if(host.length>253||host.length<4||host.includes("/")||host.includes(":")||
   !/^[a-z0-9.-]+$/.test(host)||host.includes("..")||
   host.startsWith(".")||host.endsWith("."))
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
 const verified=input.isVerified&&Boolean(input.verifiedAt);
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
