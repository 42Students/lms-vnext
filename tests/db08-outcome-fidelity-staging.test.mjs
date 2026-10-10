import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const sql = readFileSync("scripts/sql/db08-outcome-fidelity-staging.sql", "utf8");
const contract = readFileSync("docs/planning/database-parity-db08-outcome-fidelity.md", "utf8");

function alterFragments(table) {
  const re = new RegExp("ALTER TABLE\\s+" + table + "\\s+([\\s\\S]*?);", "g");
  return [...sql.matchAll(re)].map(m => m[1]).join("\n");
}
function assertColumn(table, column) {
  const fragments = alterFragments(table);
  assert.match(fragments, new RegExp("\\bADD COLUMN\\s+" + column + "\\b"),
    table + "." + column + " missing from staged DDL");
}

test("DB21 source stage is explicit and not a numbered migration", () => {
  assert.match(sql, /STAGING ONLY, NOT A DRIZZLE MIGRATION/);
  assert.match(contract, /POSTGRES_NOT_RUN/);
  assert.match(contract, /0 runtime-verified fields/);
  assert.match(sql, /V190__job_types_and_placement_outcomes\.sql/);
  assert.match(sql, /V161__tpo_v1_drives\.sql/);
  assert.doesNotMatch(sql, /^\s*(?:DROP TABLE|DROP COLUMN|DELETE FROM|TRUNCATE)\b/im);
});

test("DB21 preserves per-drive placed-count independent of employment type", () => {
  assertColumn("placement_jobs", "counts_as_placed");
  assert.match(alterFragments("placement_jobs"), /counts_as_placed boolean NOT NULL DEFAULT true/);
  assert.doesNotMatch(sql, /CHECK\s*\(\s*employment_type\s*(?:=|<>)/i);
  assert.match(contract, /Per-drive/);
});

test("DB21 current batch registration and immutable event snapshots capture outcome detail", () => {
  for (const name of ["outcome_label", "outcome_detail"]) {
    assertColumn("placement_batch_registrations", name);
  }
  for (const name of [
    "previous_outcome_label", "next_outcome_label",
    "previous_outcome_detail", "next_outcome_detail",
  ]) {
    assertColumn("placement_batch_registration_events", name);
  }
  assert.match(sql, /db08_registration_outcome_text_ck/);
  assert.match(sql, /db08_registration_event_outcome_text_ck/);
});

test("DB21 role and offer salary/bond terms retain decimal precision and reject negatives", () => {
  for (const table of ["placement_job_role_options", "placement_offers"]) {
    for (const name of [
      "fixed_lpa", "variable_lpa", "joining_bonus_lpa",
      "bond_months", "bond_amount",
    ]) assertColumn(table, name);
  }
  assert.match(sql, /fixed_lpa numeric\(10,2\)/);
  assert.match(sql, /joining_bonus_lpa numeric\(10,2\)/);
  assert.match(sql, /bond_amount numeric\(10,2\)/);
  assert.match(sql, /db08_role_package_nonnegative_ck/);
  assert.match(sql, /db08_offer_package_nonnegative_ck/);
});

test("DB21 offer kind, imported acceptance, dispute window and cascade state are explicitly staged", () => {
  for (const name of [
    "kind", "acceptance_channel", "accepted_disputable_until",
    "cascade_id", "revoke_reason", "released_at",
  ]) assertColumn("placement_offers", name);
  assert.match(sql, /db08_offer_kind_ck/);
  assert.match(sql, /kind IN \('LOI', 'OFFER'\)/);
  assert.match(sql, /db08_offer_acceptance_channel_ck/);
  assert.match(sql, /db08_offer_dispute_channel_ck/);
  assert.match(sql, /acceptance_channel = 'EXTERNAL_IMPORT'/);
  assert.match(sql, /db08_offers_cascade_id_idx/);
  assert.match(contract, /NOT implemented/);
});

test("DB21 contract preserves PostgreSQL, migration and producer-consumer gates as unexecuted", () => {
  for (const id of Array.from({length:11}, (_, i) => "DB21-" + String(i + 1).padStart(2, "0"))) {
    assert.ok(contract.includes(id), "Missing negative/race witness " + id);
  }
  assert.match(contract, /DB-019\/DB-020/);
  assert.match(contract, /NOT DONE_VERIFIED/);
});
