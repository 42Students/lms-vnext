/** SA-placements-projects-119..122: independent audit findings domain.
 * Storage is registered in migration 0168; DB10_AUDIT_FINDINGS_READY stays disabled
 * until replay, actor validation and sync status endpoint acceptance.
 * This is not the bug_reports tracker schema.
 */
import {sql} from "drizzle-orm";
import {pgTable,uuid,varchar,text,timestamp,integer,jsonb,uniqueIndex,index,check,foreignKey} from "drizzle-orm/pg-core";
import {users} from "./users";

export const db10AuditFindings=pgTable("audit_findings",{
  id:uuid("id").defaultRandom().primaryKey(),
  externalId:varchar("external_id",{length:120}).notNull(),
  title:text("title").notNull(),
  summary:text("summary").notNull(),
  area:varchar("area",{length:80}).notNull(),
  kind:varchar("kind",{length:32}).notNull(),
  severity:varchar("severity",{length:16}).notNull(),
  reportedSeverity:varchar("reported_severity",{length:32}),
  roles:jsonb("roles").$type<string[]>().notNull().default(sql`'[]'::jsonb`),
  environment:varchar("environment",{length:80}),
  status:varchar("status",{length:24}).notNull().default("NEW"),
  assignee:varchar("assignee",{length:150}),
  foundBy:varchar("found_by",{length:150}),
  foundAt:timestamp("found_at",{withTimezone:true}),
  sourceRepo:varchar("source_repo",{length:180}).notNull(),
  sourceCommitSha:varchar("source_commit_sha",{length:64}),
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
  // Mirrors the registered duplicate-of FK; self-reference is optional
  // but must never point to a nonexistent historical audit finding.
  foreignKey({name:"db10_audit_findings_duplicate_fk",
    columns:[t.duplicateOf],foreignColumns:[t.id]}).onDelete("restrict"),
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
  actorUserId:uuid("actor_user_id").references(()=>users.id,{onDelete:"restrict"}),
  actorKind:varchar("actor_kind",{length:24}).notNull().default("USER"),
  actorLabel:varchar("actor_label",{length:150}),
  sourceFile:varchar("source_file",{length:500}),
  sourceCommitSha:varchar("source_commit_sha",{length:64}),
  relatedCommits:jsonb("related_commits").$type<Array<{repo:string;sha:string}>>().notNull().default(sql`'[]'::jsonb`),
  fromValue:jsonb("from_value"),
  toValue:jsonb("to_value"),
  action:varchar("action",{length:32}).notNull(),
  note:text("note"),
  fromStatus:varchar("from_status",{length:24}),
  toStatus:varchar("to_status",{length:24}),
  createdAt:timestamp("created_at",{withTimezone:true}).notNull().defaultNow(),
},t=>[
  index("db10_audit_finding_events_finding_idx").on(t.findingId,t.createdAt),
  check("db10_audit_finding_events_actor_kind_ck",sql`${t.actorKind} in ('USER','SYNC_AGENT','SYSTEM')`),
  check("db10_audit_finding_events_actor_shape_ck",sql`(${t.actorKind} = 'USER' and ${t.actorUserId} is not null) or (${t.actorKind} <> 'USER' and ${t.actorUserId} is null and length(btrim(coalesce(${t.actorLabel},''))) > 0)`),
  check("db10_audit_finding_events_action_ck",
    sql`${t.action} in ('STATUS','ASSIGNEE','SEVERITY','DUPLICATE','FIX_COMMIT','COMMENT')`),
]);

export const db10AuditFindingSyncs=pgTable("audit_finding_syncs",{
  source:varchar("source",{length:120}).primaryKey(),
  repo:varchar("repo",{length:180}),
  lastCommit:varchar("last_commit",{length:64}),
  lastError:text("last_error"),
  lastSuccessAt:timestamp("last_success_at",{withTimezone:true}),
  lastSyncedAt:timestamp("last_synced_at",{withTimezone:true}),
  lastResult:varchar("last_result",{length:24}).notNull().default("NOT_CONFIGURED"),
  importedCount:integer("imported_count").notNull().default(0),
  refusedFiles:jsonb("refused_files").$type<Array<{path:string;reason:string}>>().notNull().default(sql`'[]'::jsonb`),
});

/** Provenance of individually ingested audit-finding files. Every attempted
 * source SHA remains immutable, including changed/tampered and deleted files.
 * Sync service must not silently overwrite previously accepted findings. */
export const db10AuditFindingFiles=pgTable("audit_finding_file",{
 id:uuid("id").defaultRandom().primaryKey(),
 source:varchar("source",{length:120}).notNull(),
 sourcePath:varchar("source_path",{length:500}).notNull(),
 blobSha:varchar("blob_sha",{length:64}).notNull(),
 action:varchar("action",{length:16}).notNull(),
 result:varchar("result",{length:24}).notNull(),
 errorCode:varchar("error_code",{length:80}),
 findingId:uuid("finding_id").references(()=>db10AuditFindings.id,{onDelete:"restrict"}),
 runId:varchar("run_id",{length:120}),
 sourceCommitSha:varchar("source_commit_sha",{length:64}),
 checkedAt:timestamp("checked_at",{withTimezone:true}).notNull().defaultNow(),
},t=>[
 uniqueIndex("audit_finding_file_unique_attempt_uq")
  .on(t.source,t.sourcePath,t.blobSha,t.action),
 index("audit_finding_file_source_path_time_idx")
  .on(t.source,t.sourcePath,t.checkedAt),
 index("audit_finding_file_finding_time_idx")
  .on(t.findingId,t.checkedAt),
 check("audit_finding_file_sha_ck",
  sql`${t.blobSha} ~ '^[a-f0-9]{40}([a-f0-9]{24})?$'`),
 check("audit_finding_file_action_ck",
  sql`${t.action} in ('IMPORT','UPDATE','DELETE')`),
 check("audit_finding_file_result_ck",
  sql`${t.result} in ('ACCEPTED','UNCHANGED','TAMPERED','DELETED','REFUSED')`),
 check("audit_finding_file_error_len_ck",
  sql`${t.errorCode} is null or length(${t.errorCode}) between 1 and 80`),
]);

/** Imported audit events are not user edits. A sync producer must record
 * attempted provenance, actor kind and original status even for deleted or
 * tampered sources, and must not silently mark a refusal as success. */
export const LEGACY_FINDING_SYNC_DISPOSITIONS={
 NEW:"IMPORTED",UPDATED:"SYNCED",TAMPERED:"TAMPERED",
 DELETED:"DELETED",REFUSED:"REFUSED",
} as const;
export function auditFindingSyncDisposition(input:{
 event: keyof typeof LEGACY_FINDING_SYNC_DISPOSITIONS;
 sourceFile:string;repo:string;commit:string;
 actorKind:"SYNC_AGENT"|"SYSTEM";actorLabel:string;
 originalExternalId:string;
}){
 if(!/^[A-Za-z0-9][A-Za-z0-9._-]{0,119}$/.test(input.originalExternalId)||
   !input.actorLabel.trim()||input.actorLabel.length>150||
   !/^[0-9a-f]{40}$/i.test(input.commit)||
   !input.sourceFile||input.sourceFile.length>500||
   !input.repo||input.repo.length>180)
  throw new Error("Unverified sync provenance");
 return {...input,action:LEGACY_FINDING_SYNC_DISPOSITIONS[input.event],
  actorUserId:null as null};
}
