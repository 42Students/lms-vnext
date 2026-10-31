#!/usr/bin/env node
// DB-019: distinguish historically staged DB07 concepts from registered
// physical target columns on current main. Source/schema evidence ONLY.
// Never treat a present column as semantic/producer/consumer/tenant proof.
import fs from "node:fs";
import path from "node:path";
import {fileURLToPath} from "node:url";

export const PROJECT_HISTORY_MIGRATIONS = Object.freeze([
  "0090_project_task_details",
  "0091_project_final_delivery",
  "0130_project_task_comment_kinds",
  "0196_lane15_project_change_history",
  "0216_project_task_history",
  "0218_project_meeting_member_delivery_history",
  "0257_project_legacy_fidelity",
]);

// Every currently TARGET_GAP_ACTIVE_CONCEPT project-history field is covered.
// These are precise PHYSICAL COLUMN correspondences, not full runtime parity.
export const PROJECT_HISTORY_COLUMN_CROSSWALK = Object.freeze({
  project_delivery_event: Object.freeze({
    table: "project_delivery_events",
    create: "0091_project_final_delivery",
    fields: Object.freeze({
      id:"id", created_at:"occurred_at", project_id:"project_id",
      delivery_id:"submission_id", action:"legacy_action",
      status:"legacy_status", actor_id:"legacy_actor_id",
      actor_name:"legacy_actor_name", actor_type:"legacy_actor_type",
      notes:"legacy_notes", attachment_url:"legacy_attachment_url",
      feedback:"legacy_feedback", revision_count:"legacy_revision_count",
    }),
  }),
  project_meeting_history: Object.freeze({
    table:"project_meeting_history",
    create:"0196_lane15_project_change_history",
    fields:Object.freeze({
      id:"id", created_at:"created_at", project_id:"project_id",
      project_meeting_id:"project_meeting_id", meeting_key:"meeting_key",
      action_type:"action_type", actor_user_id:"actor_user_id",
      actor_user_type:"actor_user_type", actor_name:"actor_name",
      before_json:"before_json", after_json:"after_json",
      changed_fields:"changed_fields", notes:"notes",
    }),
  }),
  project_resource_audit: Object.freeze({
    table:"project_resource_audit",
    create:"0196_lane15_project_change_history",
    fields:Object.freeze({
      id:"id", created_at:"created_at", project_id:"project_id",
      project_resource_id:"project_resource_id", resource_key:"resource_key",
      action_type:"action_type", actor_user_id:"actor_user_id",
      actor_user_type:"actor_user_type", actor_name:"actor_name",
      resource_order:"resource_order", before_json:"before_json",
      after_json:"after_json", changed_fields:"changed_fields",
    }),
  }),
  project_task_comment: Object.freeze({
    table:"project_task_comments",
    create:"0090_project_task_details",
    fields:Object.freeze({
      id:"id", created_at:"created_at", updated_at:"updated_at",
      project_id:"project_id", project_task_id:"task_id",
      commenter_id:"legacy_commenter_id",
      commenter_type:"legacy_commenter_type",
      commenter_name:"legacy_commenter_name",
      message:"body", progress_value:"progress_value",
      comment_type:"comment_kind", task_status_snapshot:"task_status_snapshot",
    }),
  }),
});
const type = "(?:uuid|timestamp|timestamptz|varchar|text|jsonb|integer|bigint|boolean|date|int)";
const escapeRe = text => text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

function createTableColumns(sql, table) {
  const re = new RegExp("CREATE\\s+TABLE(?:\\s+IF\\s+NOT\\s+EXISTS)?\\s+\\\"?" +
    escapeRe(table) + "\\\"?\\s*\\(([\\s\\S]*?)\\n\\);", "i");
  const body = sql.match(re)?.[1];
  if (!body) return null;
  const col = new RegExp("^\\s*\\\"?([a-z][a-z0-9_]*)\\\"?\\s+" + type + "\\b", "gim");
  return new Set([...body.matchAll(col)].map(x=>x[1].toLowerCase()));
}
function addedColumns(sql, table) {
  const re = new RegExp("ALTER\\s+TABLE\\s+\\\"?" + escapeRe(table) +
    "\\\"?\\s+ADD\\s+COLUMN(?:\\s+IF\\s+NOT\\s+EXISTS)?\\s+\\\"?" +
    "([a-z][a-z0-9_]*)\\\"?\\s+" + type + "\\b", "gim");
  return new Set([...sql.matchAll(re)].map(x=>x[1].toLowerCase()));
}

export function auditProjectRegisteredHistory(sourceReview, journal, migrations) {
  const errors = [];
  const fail = (code, field=null) => errors.push({code,...(field===null?{}:{field})});
  if (!sourceReview || !Array.isArray(sourceReview.tables) || !journal ||
    !Array.isArray(journal.entries) || !migrations || typeof migrations!=="object")
    return {valid:false,sourceOnly:true,errors:[{code:"INVALID_INPUT"}],acceptanceReady:false};
  const registered = new Set(journal.entries.map(entry=>entry.tag));
  const migrationTexts = new Map();
  for (const tag of PROJECT_HISTORY_MIGRATIONS) {
    if (!registered.has(tag) || typeof migrations[tag] !== "string")
      fail("MIGRATION_MISSING_FROM_JOURNAL_OR_SQL",tag);
    else migrationTexts.set(tag,migrations[tag]);
  }
  const ledger = new Map(sourceReview.tables.map(table=>[table.legacyTable,table]));
  const matched = [];
  const missing = [];
  let archivalOnly = 0;
  for (const [legacyTable,contract] of Object.entries(PROJECT_HISTORY_COLUMN_CROSSWALK)) {
    const record = ledger.get(legacyTable);
    const rows = (record?.fields||[]).filter(row=>row.decision==="TARGET_GAP_ACTIVE_CONCEPT");
    const configured = Object.keys(contract.fields);
    if (rows.length !== configured.length ||
        rows.some(row=>!Object.hasOwn(contract.fields,row.legacyField)) ||
        configured.some(field=>!rows.some(row=>row.legacyField===field)))
      fail("HISTORIC_REVIEW_CENSUS_OR_CROSSWALK_DRIFT",legacyTable);
    if (!migrationTexts.has(contract.create)) continue;
    const create = createTableColumns(migrationTexts.get(contract.create),contract.table);
    if (!create) { fail("CREATE_TABLE_NOT_REGISTERED",contract.table); continue; }
    const columns = new Set(create);
    const provenance = new Map([...create].map(col=>[col,contract.create]));
    for (const [tag,sql] of migrationTexts)
      for (const col of addedColumns(sql,contract.table)) {
        columns.add(col);if(!provenance.has(col))provenance.set(col,tag);
      }
    for (const row of rows) {
      const source = legacyTable+"."+row.legacyField;
      const mapped = contract.fields[row.legacyField];
      if (!columns.has(mapped)) {
        missing.push({source,target:contract.table+"."+mapped});
        fail("TARGET_COLUMN_NOT_IN_REGISTERED_MIGRATIONS",source);
      } else {
        const auditOnly = mapped.startsWith("legacy_");
        if(auditOnly)archivalOnly++;
        matched.push({source,target:contract.table+"."+mapped,
          registeredBy:provenance.get(mapped),
          scope:auditOnly?"LEGACY_SNAPSHOT_COLUMN_ONLY":"REGISTERED_COLUMN_SOURCE_ONLY"});
      }
    }
  }
  if (matched.length + missing.length !== 51 || matched.length !== 51)
    fail("INCOMPLETE_PROJECT_HISTORY_STRUCTURAL_EVIDENCE");
  return {
    valid:errors.length===0,errors,
    sourceOnly:true,physicalSchemaEvidenceOnly:true,
    sourceReviewStagedHistoryFields:51,
    registeredColumnMatches:matched.length,
    historicallyStagedTables:Object.keys(PROJECT_HISTORY_COLUMN_CROSSWALK).length,
    legacySnapshotFields:archivalOnly,
    reviewed:matched,missing,
    acceptanceReady:false,producerConsumerVerified:false,tenantRuntimeVerified:false,
    remaining:[
      "Registered SQL column presence does not establish field semantics, event immutability, actor authorization, history retention, or consumer equivalence",
      "Further DB07 field-level target gaps outside these 51 and DB019 global 2829-field disposition remain open",
      "PostgreSQL journal replay, race/privacy/tenant negatives, and DB020 database phase certification remain separately required",
    ]
  };
}

export function loadProjectRegisteredHistory(root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"..")) {
  const read = file=>JSON.parse(fs.readFileSync(path.join(root,file),"utf8"));
  const source = read("docs/planning/database-parity-db07-field-reconciliation.json");
  const journal = read("drizzle/meta/_journal.json");
  const migrations=Object.fromEntries(PROJECT_HISTORY_MIGRATIONS.map(tag=>
    [tag,fs.readFileSync(path.join(root,"drizzle",tag+".sql"),"utf8")]));
  return auditProjectRegisteredHistory(source,journal,migrations);
}

if (process.argv[1] && path.resolve(process.argv[1])===fileURLToPath(import.meta.url)) {
  try {const result=loadProjectRegisteredHistory(); console.log(JSON.stringify(result,null,2));
    if(!result.valid || process.argv.includes("--require-complete"))process.exitCode=2;
  } catch(error){console.error(error);process.exitCode=1;}
}
