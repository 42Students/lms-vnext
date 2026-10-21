/** Schema for a pending, additive DB10 immutable import ledger migration.
 * Deliberately kept separate from the lane-15-owned central schema until
 * migration replay and registry verification. Importer remains fail-closed. */
import {sql} from "drizzle-orm";
import {pgTable,uuid,varchar,timestamp,index,uniqueIndex,check} from "drizzle-orm/pg-core";
import {db10AuditFindings} from "@/db/schema/db10-audit-findings.draft";

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
