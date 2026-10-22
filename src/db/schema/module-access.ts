import { sql } from "drizzle-orm";
import {
  boolean,
  check,
  index,
  pgTable,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { users } from "./users";

/**
 * Legacy app_setting crosswalk is intentionally NOT an automatic table copy.
 * Approved module keys only: projects, placements, electives. Translate
 * GLOBAL→GLOBAL, ORGANIZATION→ORGANIZATION, COLLEGE→COLLEGE,
 * DEPARTMENT→DEPARTMENT, PROGRAM→PROGRAM, BATCH→COHORT,
 * CLASS→SECTION (only for a real section), LEARNER→MEMBERSHIP.
 * The old integer scope ID must be looked up through a verified tenant-scoped
 * UUID mapping; GROUP_BACKED classes do not become fabricated sections.
 * Parse explicitly approved boolean setting values, reject unknown keys,
 * ambiguous duplicate rules, invalid scopes and unverified role membership.
 * Never grant access based on a raw legacy setting_key/value. Greenfield
 * vNext requires no historical AppSetting migration at present.
 */
export const moduleAccessRules = pgTable(
  "module_access_rules",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    scopeType: varchar("scope_type", { length: 32 }).notNull(),
    scopeId: uuid("scope_id"),
    module: varchar("module", { length: 32 }).notNull(),
    enabled: boolean("enabled").notNull(),
    locked: boolean("locked").notNull().default(false),
    updatedByUserId: uuid("updated_by_user_id").references(
      () => users.id,
      { onDelete: "restrict" },
    ),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    check(
      "module_access_rules_scope_type_ck",
      sql`${table.scopeType} in ('MEMBERSHIP', 'SECTION', 'COHORT', 'PROGRAM', 'DEPARTMENT', 'COLLEGE', 'ORGANIZATION', 'GLOBAL')`,
    ),
    check(
      "module_access_rules_module_ck",
      sql`${table.module} in ('projects', 'placements', 'electives')`,
    ),
    check(
      "module_access_rules_global_shape_ck",
      sql`(${table.scopeType} = 'GLOBAL' and ${table.scopeId} is null)
        or (${table.scopeType} <> 'GLOBAL' and ${table.scopeId} is not null)`,
    ),
    uniqueIndex("module_access_rules_scoped_uq")
      .on(table.scopeType, table.scopeId, table.module)
      .where(sql`${table.scopeId} is not null`),
    uniqueIndex("module_access_rules_global_uq")
      .on(table.scopeType, table.module)
      .where(sql`${table.scopeId} is null`),
    index("module_access_rules_module_idx").on(
      table.module,
      table.enabled,
    ),
  ],
);

/** Every legacy AppSetting import is reviewed as (module, scope, ID, value,
 * locked). Duplicate scope-module pairs with conflicting values are errors,
 * never last-write-wins. Orphan locks become import exceptions, not false
 * disabled rules. Public tree views may show both effective access and the
 * nearest inherited lock, but cannot use this table as a permission grant. */
export const LEGACY_MODULE_SETTING_KEYS={
 "PROJECTS":"projects","PLACEMENTS":"placements","ELECTIVES":"electives",
} as const;
export function legacyModuleBooleanToken(raw:unknown):boolean{
 if(typeof raw==="boolean")return raw;
 if(raw===0||raw===1)return raw===1;
 if(typeof raw!=="string")throw new Error("Unknown historic module setting value");
 const key=raw.trim().toLowerCase();
 if(["true","1","yes","on","enabled"].includes(key))return true;
 if(["false","0","no","off","disabled"].includes(key))return false;
 throw new Error("Unknown historic module setting value");
}
export function moduleRuleTreeProjection(input:{
 effectiveEnabled:boolean;locked:boolean;
 inheritedLocked:boolean;lockScope:string|null;
}){
 return {enabled:input.effectiveEnabled,
   locked:input.locked||input.inheritedLocked,
   lockInherited:input.inheritedLocked,
   lockedByScope:input.lockScope};
}


/** Stage only approved module keys into strictly scoped vNext rules.
 * Unknown settings are handled by their owning platform-settings consumer,
 * never coerced into a deny/allow module rule. Source numeric scope IDs must
 * resolve through a verified same-tenant UUID map before activation. */
export function importLegacyModuleSetting(input:{
 settingKey:string;value:unknown;locked:boolean;
 legacyScopeType:string;resolvedScopeId:string|null;
 legacyUpdatedAt:string;sourceId:number;
}){
 const moduleKey=LEGACY_MODULE_SETTING_KEYS[
  input.settingKey.trim().toUpperCase() as keyof typeof LEGACY_MODULE_SETTING_KEYS
 ];
 if(!moduleKey)throw new Error("Unmapped old app_setting key");
 const scopeNames:Readonly<Record<string,string>>={
  GLOBAL:"GLOBAL",ORGANIZATION:"ORGANIZATION",COLLEGE:"COLLEGE",
  DEPARTMENT:"DEPARTMENT",PROGRAM:"PROGRAM",BATCH:"COHORT",
  CLASS:"SECTION",LEARNER:"MEMBERSHIP",
 };
 const scopeType=scopeNames[input.legacyScopeType.trim().toUpperCase()];
 if(!scopeType)throw new Error("Unknown historic module scope");
 const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
 if(scopeType==="GLOBAL"?input.resolvedScopeId!==null:
   input.resolvedScopeId===null||!uuid.test(input.resolvedScopeId))
  throw new Error("Unverified historic module scope ID");
 if(!Number.isSafeInteger(input.sourceId)||input.sourceId<1||
  !/(?:Z|[+-]\d{2}:\d{2})$/.test(input.legacyUpdatedAt)||
  !Number.isFinite(Date.parse(input.legacyUpdatedAt)))
  throw new Error("Historical module setting identity or time invalid");
 return {scopeType,scopeId:input.resolvedScopeId,module:moduleKey,
  enabled:legacyModuleBooleanToken(input.value),locked:input.locked,
  sourceId:input.sourceId,sourceUpdatedAt:new Date(input.legacyUpdatedAt),
  readyForOwnerReview:true as const};
}
export function rejectConflictingLegacyModuleRules<T extends {
 scopeType:string;scopeId:string|null;module:string;
 enabled:boolean;locked:boolean;
}>(values:readonly T[]):readonly T[]{
 const seen=new Map<string,T>();
 for(const row of values){
  const key=row.scopeType+":"+row.scopeId+":"+row.module;
  const current=seen.get(key);
  if(current&&(current.enabled!==row.enabled||current.locked!==row.locked))
   throw new Error("Contradictory historic module rules");
  if(!current)seen.set(key,row);
 }
 return [...seen.values()];
}
