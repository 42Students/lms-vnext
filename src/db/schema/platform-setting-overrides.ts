/** Registered in 0119: typed Super Admin setting overrides. No credentials stored. */
import {sql} from "drizzle-orm";
import {check,integer,pgTable,primaryKey,timestamp,uuid,varchar} from "drizzle-orm/pg-core";
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
