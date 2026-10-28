import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
const read = p => readFileSync(new URL(p, import.meta.url),"utf8");
const sql = read("../drizzle/0304_db04_normalized_profile_persistence.sql");
const barrel = read("../src/db/schema/index.ts");
const journal = JSON.parse(read("../drizzle/meta/_journal.json"));
const receipts = read("../src/db/schema/profile-verification.ts");
test("DB-007 registered journal and schema include normalized parents, not duplicate gallery",()=>{
 assert.equal(journal.entries.find(row=>row.tag==="0304_db04_normalized_profile_persistence")?.idx,304);
 for(const table of ["learner_profile_education_entries","learner_profile_education_documents",
 "learner_profile_identity_summaries","learner_profile_private_document_bindings",
 "learner_profile_video_intros"]){
  assert.ok(sql.includes("CREATE TABLE "+table),table);
 }
 assert.ok(!sql.includes("CREATE TABLE learner_profile_images"));
 assert.ok(barrel.includes('from "./db04-profile-education-images.staged"'));
 assert.ok(barrel.includes('from "./db04-learner-profile-extras.staged"'));
});
test("DB-007 receipt ownership, scan, ledger and history guards are registered",()=>{
 for(const s of ["learner_profile_education_documents_receipt_fk",
 "learner_profile_video_intro_receipt_fk","learner_profile_private_binding_receipt_fk",
 "db04_education_document_usable_guard","db04_video_intro_update_guard",
 "db04_private_profile_binding_usable_guard","db04_profile_verification_events_immutable",
 "db04_profile_verification_events_no_truncate","db04_profile_verifications_revision"]){
  assert.ok(sql.includes(s),s);
 }
 assert.ok(sql.includes("FOR SHARE;"));
 assert.ok(sql.includes("VIDEO_INTRO"));
 assert.ok(receipts.includes("'OFFER_LETTER','VIDEO_INTRO'"));
 assert.ok(sql.includes("legacy_grade_raw varchar(120)"));
});
