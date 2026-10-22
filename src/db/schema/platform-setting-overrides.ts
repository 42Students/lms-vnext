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
 if(!key||key.length>120||/[\u0000-\u001f\u007f]/.test(key)||input.value.length>4096)
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
 const oldScope=input.scopeId?.trim()??"";
 if(!oldScope||(
   /^[0-9a-f]{8}-[0-9a-f-]{27}$/i.test(oldScope)&&
   oldScope.toLowerCase()!==input.resolvedCollegeId.toLowerCase()))
  throw new Error("Legacy scope ID does not match the approved college crosswalk");
 return {scopeType:"COLLEGE",scopeId:input.resolvedCollegeId,key,value:input.value};
}
/** Importers group identical normalized scope+key and choose the latest
 * source (updatedAt, numeric source ID); conflicting ties require review. */
export function legacyOverrideWinner<T extends {updatedAt:string;legacyId:number}>(
 rows:readonly T[],
):T{
 if(!rows.length)throw new Error("No source overrides");
 const verified=rows.map(row=>{
  if(!Number.isSafeInteger(row.legacyId)||row.legacyId<1||
     !/(?:Z|[+-]\d{2}:\d{2})$/.test(row.updatedAt)||
     !Number.isFinite(Date.parse(row.updatedAt)))
   throw new Error("Legacy override timestamp or identity requires review");
  return {row,instant:Date.parse(row.updatedAt)};
 });
 const ordered=verified.sort((a,b)=>b.instant-a.instant||
   b.row.legacyId-a.row.legacyId).map(item=>item.row);
 if(ordered[0]&&ordered[1]&&Date.parse(ordered[0].updatedAt)===Date.parse(ordered[1].updatedAt)&&
    ordered[0].legacyId===ordered[1].legacyId)
  throw new Error("Ambiguous legacy override winner");
 const winner=ordered[0];
 if(!winner)throw new Error("Missing legacy override winner");
 return winner;
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
  if(!newest)throw new Error("Missing legacy ORG override");
  const runnerUp=ordered[1];
  const ambiguous=runnerUp!==undefined&&newest.updatedAt===runnerUp.updatedAt&&
   newest.valueSha256!==runnerUp.valueSha256;
  return {scopeKey:key,sourceRowId:newest.sourceRowId,
   decision:ambiguous?"REVIEW_REQUIRED" as const:"ARCHIVED" as const,
   suppressedSourceRowIds:ordered.slice(1).map(item=>item.sourceRowId),
   runtimeOverrideCreated:false as const};
 });
}

/** Explicit AppSetting scope crosswalk. Ordinary global/college settings stay
 * in platformSettingOverrides; finer-grained *module* decisions are routed to
 * module_access_rules after checking the old numeric ID against a UUID map.
 * A legacy tombstone is an audited removal, never a disabled inherited rule.
 * Matching by a naked legacy numeric ID without scope is forbidden. */
export type LegacyModuleScope=
  "GLOBAL"|"ORGANIZATION"|"COLLEGE"|"DEPARTMENT"|
  "PROGRAM"|"BATCH"|"CLASS"|"LEARNER";
export type CanonicalModuleScope=
  "GLOBAL"|"ORGANIZATION"|"COLLEGE"|"DEPARTMENT"|
  "PROGRAM"|"COHORT"|"SECTION"|"MEMBERSHIP";
export type LegacyModuleSettingCandidate={
  sourceId:string;scope:LegacyModuleScope;legacyScopeId:string|null;
  settingKey:string;enabled:boolean;locked:boolean;deleted:boolean;
  updatedAt:string;scopeUuid:string|null;
};
export function mapLegacyModuleSetting(candidate:LegacyModuleSettingCandidate){
 const sourceId=candidate.sourceId.trim();
 if(!/^[1-9][0-9]{0,18}$/.test(sourceId))
  throw new Error("Invalid legacy setting row ID");
 const moduleKeys:Record<string,"projects"|"placements"|"electives">={
  PROJECTS:"projects",PLACEMENTS:"placements",ELECTIVES:"electives",
 };
 const moduleKey=moduleKeys[candidate.settingKey.trim().toUpperCase()];
 if(!moduleKey)throw new Error("Unapproved historical module setting");
 const scopes:Record<LegacyModuleScope,CanonicalModuleScope>={
  GLOBAL:"GLOBAL",ORGANIZATION:"ORGANIZATION",COLLEGE:"COLLEGE",
  DEPARTMENT:"DEPARTMENT",PROGRAM:"PROGRAM",BATCH:"COHORT",
  CLASS:"SECTION",LEARNER:"MEMBERSHIP",
 };
 const scopeType=scopes[candidate.scope],id=candidate.scopeUuid;
 if(scopeType==="GLOBAL"){
  if(candidate.legacyScopeId!==null||id!==null)
   throw new Error("Legacy GLOBAL scope cannot carry a scoped ID");
 }else if(!candidate.legacyScopeId?.trim()||!id||
   !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id)){
  throw new Error("Historical scoped module decision needs verified mapping");
 }
 const date=new Date(candidate.updatedAt);
 if(!Number.isFinite(date.getTime())||
    !/(?:Z|[+-]\d{2}:\d{2})$/.test(candidate.updatedAt))
  throw new Error("Historical setting time requires explicit source zone");
 return {sourceId,scopeType,scopeId:scopeType==="GLOBAL"?null:id,
  module:moduleKey,enabled:candidate.enabled,locked:candidate.locked,
  deleted:candidate.deleted,updatedAt:date.toISOString()};
}
export function planLegacyModuleRuleImport(rows:readonly LegacyModuleSettingCandidate[]){
 const mapped=rows.map(mapLegacyModuleSetting);
 const groups=new Map<string,typeof mapped>();
 for(const item of mapped){
  const key=item.scopeType+":"+(item.scopeId??"GLOBAL")+":"+item.module;
  const items=groups.get(key)??[];
  items.push(item);groups.set(key,items);
 }
 return [...groups.values()].map(group=>{
  const ordered=[...group].sort((a,b)=>b.updatedAt.localeCompare(a.updatedAt)||
    (BigInt(b.sourceId)>BigInt(a.sourceId)?1:-1));
  const latest=ordered[0]!;
  if(ordered.some(item=>item.updatedAt===latest.updatedAt&&
    (item.enabled!==latest.enabled||item.locked!==latest.locked||
     item.deleted!==latest.deleted)))
   throw new Error("Conflicting historical module decisions");
  return {...latest,active:!latest.deleted,
    supersededSourceIds:ordered.slice(1).map(row=>row.sourceId)};
 });
}
