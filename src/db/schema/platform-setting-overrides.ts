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
