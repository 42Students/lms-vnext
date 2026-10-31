// Compare typed declarations against exact 323+ registered PostgreSQL catalog;
// preserves SQL-owned check and uniqueness semantics, never applies new DDL.
import {test} from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const aliases=[
  [
    "src/db/schema/db10-log-alerts.draft.ts",
    "log_alert_signatures",
    "log_alert_signatures_signature_hash_check",
    "check"
  ],
  [
    "src/db/schema/db10-log-alerts.draft.ts",
    "log_alert_signatures",
    "log_alert_signatures_occurrence_count_check",
    "check"
  ],
  [
    "src/db/schema/db10-log-alerts.draft.ts",
    "log_alert_signatures",
    "log_alert_signatures_fix_status_check",
    "check"
  ],
  [
    "src/db/schema/db10-log-alerts.draft.ts",
    "log_alert_signature_accounts",
    "log_alert_signature_accounts_account_key_hash_check",
    "check"
  ],
  [
    "src/db/schema/db10-log-alerts.draft.ts",
    "log_alert_states",
    "log_alert_states_state_key_check",
    "check"
  ],
  [
    "src/db/schema/db10-log-alerts.draft.ts",
    "log_alert_states",
    "log_alert_states_state_key_key",
    "index"
  ],
  [
    "src/db/schema/db10-log-alerts.draft.ts",
    "log_alert_daily_counts",
    "log_alert_daily_counts_occurrence_count_check",
    "check"
  ],
  [
    "src/db/schema/db10-log-alerts.draft.ts",
    "log_alert_observed_events",
    "log_alert_observed_events_event_hash_check",
    "check"
  ],
  [
    "src/db/schema/db10-audit-findings.draft.ts",
    "audit_findings",
    "audit_findings_external_id_key",
    "index"
  ],
  [
    "src/db/schema/db04-profile-education-images.staged.ts",
    "learner_profile_images",
    "learner_profile_images_receipt_purpose_check",
    "check"
  ],
  [
    "src/db/schema/db04-profile-education-images.staged.ts",
    "learner_profile_images",
    "learner_profile_images_display_order_check",
    "check"
  ],
  [
    "src/db/schema/attendance-parent-sms.ts",
    "attendance_parent_contacts",
    "attendance_parent_contacts_phone_e164_check",
    "check"
  ],
  [
    "src/db/schema/attendance-parent-sms.ts",
    "attendance_parent_sms_outbox",
    "attendance_parent_sms_outbox_kind_check",
    "check"
  ],
  [
    "src/db/schema/attendance-parent-sms.ts",
    "attendance_parent_sms_outbox",
    "attendance_parent_sms_outbox_status_check",
    "check"
  ]
];
test("DB020 14 typed aliases match actual PG17 CHECK/index constraints",()=>{
 const cat=JSON.parse(readFileSync(".verification/db020-registered-catalog-full.json","utf8"));
 assert.ok(cat.registeredMigrations>=323);
 const availableChecks=new Set(cat.constraints
   .filter(x=>x.type==="c" && x.validated).map(x=>x.table_name+":"+x.name));
 const availableIndices=new Set(cat.indexes
   .filter(x=>x.valid).map(x=>x.table_name+":"+x.name));
 for(const [path,table,name,kind] of aliases){
   const schema=readFileSync(path,"utf8");
   assert.ok(schema.includes('"'+name+'"'),path+" lacks registered "+name);
   const catalog=kind==="check"?availableChecks:availableIndices;
   assert.ok(catalog.has(table+":"+name),
     "PG17 missing active typed "+kind+" "+table+"."+name);
 }
 assert.equal(aliases.length,14);
});
