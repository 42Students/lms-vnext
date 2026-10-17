/** SA-placements-projects-119..122: independent audit findings domain.
 * Register the matching SQL proposal before setting DB10_AUDIT_FINDINGS_READY.
 * This is not the bug_reports tracker schema.
 */
import {sql} from "drizzle-orm";
import {pgTable,uuid,varchar,text,timestamp,integer,jsonb,uniqueIndex,index,check} from "drizzle-orm/pg-core";
import {users} from "./users";

export const db10AuditFindings=pgTable("audit_findings",{
  id:uuid("id").defaultRandom().primaryKey(),
  externalId:varchar("external_id",{length:120}).notNull(),
  title:text("title").notNull(),
  summary:text("summary").notNull(),
  area:varchar("area",{length:80}).notNull(),
  kind:varchar("kind",{length:32}).notNull(),
  severity:varchar("severity",{length:16}).notNull(),
  status:varchar("status",{length:24}).notNull().default("NEW"),
  assignee:varchar("assignee",{length:150}),
  foundBy:varchar("found_by",{length:150}),
  foundAt:timestamp("found_at",{withTimezone:true}),
  sourceRepo:varchar("source_repo",{length:180}).notNull(),
  sourcePath:varchar("source_path",{length:500}),
  paths:jsonb("paths").$type<string[]>().notNull().default(sql`'[]'::jsonb`),
  pages:jsonb("pages").$type<string[]>().notNull().default(sql`'[]'::jsonb`),
  endpoints:jsonb("endpoints").$type<string[]>().notNull().default(sql`'[]'::jsonb`),
  steps:text("steps"),
  expected:text("expected"),
  actual:text("actual"),
  evidence:text("evidence"),
  suggestedFix:text("suggested_fix"),
  duplicateOf:uuid("duplicate_of"),
  fixCommits:jsonb("fix_commits").$type<Array<{repo:string;sha:string}>>().notNull().default(sql`'[]'::jsonb`),
  version:integer("version").notNull().default(0),
  importedAt:timestamp("imported_at",{withTimezone:true}).notNull().defaultNow(),
  updatedAt:timestamp("updated_at",{withTimezone:true}).notNull().defaultNow(),
},t=>[
  uniqueIndex("db10_audit_findings_external_id_uq").on(t.externalId),
  index("db10_audit_findings_status_severity_idx").on(t.status,t.severity,t.foundAt),
  index("db10_audit_findings_area_kind_idx").on(t.area,t.kind),
  check("db10_audit_findings_status_ck",sql`${t.status} in ('NEW','CONFIRMED','IN_PROGRESS','FIXED_DEV','RELEASED_PROD','VERIFIED','DUPLICATE','WONT_FIX','NEEDS_INFO','CANT_REPRODUCE')`),
  check("db10_audit_findings_severity_ck",sql`${t.severity} in ('CRITICAL','HIGH','MEDIUM','LOW')`),
  check("db10_audit_findings_kind_ck",sql`${t.kind} in ('BUG','SECURITY','DATA','UX','COPY','PERFORMANCE','ACCESSIBILITY')`),
  check("db10_audit_findings_version_ck",sql`${t.version} >= 0`),
]);

export const db10AuditFindingEvents=pgTable("audit_finding_events",{
  id:uuid("id").defaultRandom().primaryKey(),
  findingId:uuid("finding_id").notNull().references(()=>db10AuditFindings.id,{onDelete:"restrict"}),
  actorUserId:uuid("actor_user_id").notNull().references(()=>users.id,{onDelete:"restrict"}),
  action:varchar("action",{length:32}).notNull(),
  note:text("note"),
  fromStatus:varchar("from_status",{length:24}),
  toStatus:varchar("to_status",{length:24}),
  createdAt:timestamp("created_at",{withTimezone:true}).notNull().defaultNow(),
},t=>[
  index("db10_audit_finding_events_finding_idx").on(t.findingId,t.createdAt),
  check("db10_audit_finding_events_action_ck",
    sql`${t.action} in ('STATUS','ASSIGNEE','SEVERITY','DUPLICATE','FIX_COMMIT','COMMENT')`),
]);

export const db10AuditFindingSyncs=pgTable("audit_finding_syncs",{
  source:varchar("source",{length:120}).primaryKey(),
  lastSyncedAt:timestamp("last_synced_at",{withTimezone:true}),
  lastResult:varchar("last_result",{length:24}).notNull().default("NOT_CONFIGURED"),
  importedCount:integer("imported_count").notNull().default(0),
  refusedFiles:jsonb("refused_files").$type<Array<{path:string;reason:string}>>().notNull().default(sql`'[]'::jsonb`),
});
