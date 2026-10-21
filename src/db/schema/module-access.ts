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
 if(typeof raw==="number")return raw===1;
 if(typeof raw!=="string")return false;
 const key=raw.trim().toLowerCase();
 return key==="true"||key==="1"||key==="yes"||key==="on"||key==="enabled";
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
