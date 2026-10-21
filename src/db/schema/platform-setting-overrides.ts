/** Registered in 0119: typed Super Admin setting overrides. No credentials stored. */
import {sql} from "drizzle-orm";
import {check,integer,pgTable,primaryKey,timestamp,uuid,varchar,uniqueIndex,index} from "drizzle-orm/pg-core";
import {users} from "./users";
export const platformSettingOverrides=pgTable("platform_setting_overrides",{
 scopeType:varchar("scope_type",{length:8}).notNull(),
 scopeId:varchar("scope_id",{length:40}).notNull(),
 key:varchar("key",{length:120}).notNull(),
 value:varchar("value",{length:4096}).notNull(),
 version:integer("version").notNull().default(1),
 /** Audit the row origin separately from the latest overriding editor. */
 createdAt:timestamp("created_at",{withTimezone:true}).notNull().defaultNow(),
 createdByUserId:uuid("created_by_user_id").references(()=>users.id,{onDelete:"restrict"}),
 updatedByUserId:uuid("updated_by_user_id").notNull().references(()=>users.id,{onDelete:"restrict"}),
 updatedAt:timestamp("updated_at",{withTimezone:true}).notNull().defaultNow(),
},t=>[
 primaryKey({columns:[t.scopeType,t.scopeId,t.key]}),
 check("platform_override_scope_ck",sql`(${t.scopeType}='GLOBAL' and ${t.scopeId}='GLOBAL') or (${t.scopeType}='COLLEGE' and ${t.scopeId} ~ '^[0-9a-f-]{36}$')`),
 check("platform_override_version_ck",sql`${t.version}>=1`),
]);

/** Old setting scope was nullable; canonical writes use GLOBAL/GLOBAL or a
 * verified college UUID. Legacy org/empty values are not inferred as grants.
 * Values above 4096 UTF-16 characters or keys exceeding 120 must be rejected
 * for manual migration review, never silently truncated. */
export function normalizeLegacyPlatformOverride(input:{
 scopeType:string|null;scopeId:string|null;key:string;value:string;
 resolvedCollegeId?:string|null;
}):{scopeType:"GLOBAL"|"COLLEGE";scopeId:string;key:string;value:string}{
 const kind=input.scopeType?.trim().toUpperCase()??"";
 const key=input.key.trim();
 if(!key||key.length>120||key.includes("\\u0000")||input.value.length>4096)
  throw new Error("Legacy override needs manual key/value review");
 if(kind===""||kind==="GLOBAL"){
  if(input.scopeId&&input.scopeId.trim().toUpperCase()!=="GLOBAL")
   throw new Error("Ambiguous legacy global override scope");
  return {scopeType:"GLOBAL",scopeId:"GLOBAL",key,value:input.value};
 }
 if(kind==="ORG"||kind==="ORGANIZATION")
  throw new Error("Legacy organization scope requires approved migration mapping");
 if(kind!=="COLLEGE"||!input.resolvedCollegeId||
  !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(input.resolvedCollegeId))
  throw new Error("Legacy college scope cannot be verified");
 return {scopeType:"COLLEGE",scopeId:input.resolvedCollegeId,key,value:input.value};
}
/** Importers group identical normalized scope+key and choose the latest
 * source (updatedAt, numeric source ID); conflicting ties require review. */
export function legacyOverrideWinner<T extends {updatedAt:string;legacyId:number}>(
 rows:readonly T[],
):T{
 if(!rows.length)throw new Error("No source overrides");
 const ordered=[...rows].sort((a,b)=>b.updatedAt.localeCompare(a.updatedAt)||b.legacyId-a.legacyId);
 if(ordered.length>1&&ordered[0].updatedAt===ordered[1].updatedAt&&
    ordered[0].legacyId===ordered[1].legacyId)
  throw new Error("Ambiguous legacy override winner");
 return ordered[0];
}

/** Source-only ORG keys cannot become runtime overrides: the canonical table
 * deliberately supports GLOBAL and COLLEGE scopes exclusively. A restricted,
 * append-only keyed digest proves the explicit disposition of an old ORG row,
 * without copying retired plaintext setting values or activating its scope. */
export const platformLegacyOrgOverrideArchives=pgTable("platform_legacy_org_override_archives",{
 id:uuid("id").defaultRandom().primaryKey(),
 sourceRowId:varchar("source_row_id",{length:40}).notNull(),
 legacyOrganizationId:varchar("legacy_organization_id",{length:40}).notNull(),
 key:varchar("key",{length:120}).notNull(),
 valueSha256:varchar("value_sha256",{length:64}).notNull(),
 sourceUpdatedAt:timestamp("source_updated_at",{withTimezone:true}).notNull(),
 decision:varchar("decision",{length:24}).notNull(),
 reason:varchar("reason",{length:500}).notNull(),
 archivedByUserId:uuid("archived_by_user_id").notNull().references(()=>users.id,{onDelete:"restrict"}),
 archivedAt:timestamp("archived_at",{withTimezone:true}).notNull().defaultNow(),
},t=>[
 uniqueIndex("platform_legacy_org_source_id_uq").on(t.sourceRowId),
 index("platform_legacy_org_scope_key_idx").on(t.legacyOrganizationId,t.key),
 check("platform_legacy_org_source_id_ck",sql`${t.sourceRowId} ~ '^[1-9][0-9]{0,18}$'`),
 check("platform_legacy_org_value_sha_ck",sql`${t.valueSha256} ~ '^[a-f0-9]{64}$'`),
 check("platform_legacy_org_decision_ck",sql`${t.decision} in ('ARCHIVED','REVIEW_REQUIRED')`),
 check("platform_legacy_org_reason_ck",sql`length(trim(${t.reason})) between 8 and 500`),
]);
export function planLegacyOrgOverrideDisposition<T extends {
 sourceRowId:string;organizationId:string;key:string;
 valueSha256:string;updatedAt:string;
}>(rows:readonly T[]){
 const groups=new Map<string,T[]>();
 for(const row of rows){
  if(!/^[1-9][0-9]{0,18}$/.test(row.sourceRowId)||
    !/^[a-f0-9]{64}$/.test(row.valueSha256)||
    !row.key.trim()||row.key.trim().length>120||
    !row.organizationId.trim()||!Number.isFinite(Date.parse(row.updatedAt)))
   throw new Error("Legacy ORG override requires manual source verification");
  const key=row.organizationId+":"+row.key.trim();
  groups.set(key,[...(groups.get(key)??[]),row]);
 }
 return [...groups.entries()].map(([key,versions])=>{
  const ordered=[...versions].sort((a,b)=>b.updatedAt.localeCompare(a.updatedAt)||
    (BigInt(b.sourceRowId)>BigInt(a.sourceRowId)?1:-1));
  const newest=ordered[0];
  const ambiguous=ordered.length>1&&ordered[0].updatedAt===ordered[1].updatedAt&&
   ordered[0].valueSha256!==ordered[1].valueSha256;
  return {scopeKey:key,sourceRowId:newest.sourceRowId,
   decision:ambiguous?"REVIEW_REQUIRED" as const:"ARCHIVED" as const,
   suppressedSourceRowIds:ordered.slice(1).map(item=>item.sourceRowId),
   runtimeOverrideCreated:false as const};
 });
}
