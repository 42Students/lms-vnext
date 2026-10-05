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
