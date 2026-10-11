// DB-066 source gate. Static proof only, not PostgreSQL migration replay.
// Usage: node scripts/verify-db08-cross-parent-source.mjs
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

export function verifyDB08CrossParentSource(schema, sql) {
  const tables = [
    "placement_job_role_options", "placement_applications",
    "placement_job_rounds", "placement_round_results",
    "placement_offers", "placement_learner_requests",
    "placement_application_round_exceptions",
  ];
  const exports = [
    "placementJobRoleOptions", "placementApplications", "placementJobRounds",
    "placementRoundResults", "placementOffers", "placementLearnerRequests",
    "placementApplicationRoundExceptions",
  ];
  for (let i = 0; i < tables.length; i++) {
    assert.match(schema, new RegExp("export const " + exports[i] + " = pgTable\\(\\s*\\\"" + tables[i] + "\\\""),
      "Missing canonical placement parent/child table " + tables[i]);
  }
  const uniqueParentKeys = [
    "db066_role_option_id_job_uq", "db066_offer_id_application_uq",
    "db066_request_id_application_round_uq",
  ];
  const requiredChildFKs = [
    "db066_application_role_same_job_fk",
    "db066_round_result_round_job_fk",
    "db066_round_result_application_job_fk",
    "db066_request_application_job_fk",
    "db066_request_round_job_fk",
    "db066_request_offer_application_fk",
    "db066_exception_application_job_fk",
    "db066_exception_round_job_fk",
    "db066_exception_request_scope_fk",
  ];
  for (const name of [...uniqueParentKeys, ...requiredChildFKs]) {
    assert.equal(sql.split(name).length - 1, 1, "Missing/duplicate scoped invariant " + name);
  }
  assert.match(sql, /FOREIGN KEY \(role_option_id, job_id\)[\s\S]*?REFERENCES placement_job_role_options\(id, job_id\)/);
  assert.match(sql, /FOREIGN KEY \(round_id, job_id\)[\s\S]*?REFERENCES placement_job_rounds\(id, job_id\)/);
  assert.match(sql, /FOREIGN KEY \(application_id, job_id\)[\s\S]*?REFERENCES placement_applications\(id, job_id\)/);
  assert.match(sql, /FOREIGN KEY \(offer_id, application_id\)[\s\S]*?REFERENCES placement_offers\(id, application_id\)/);
  assert.match(sql, /FOREIGN KEY \(request_id, application_id, round_id\)[\s\S]*?REFERENCES placement_learner_requests\(id, application_id, round_id\)/);
  for (const table of ["placement_round_results","placement_learner_requests","placement_application_round_exceptions"]) {
    assert.ok(sql.includes("ALTER TABLE " + table + " ADD COLUMN job_id uuid"),
      "Missing shared job discriminator " + table);
    assert.ok(sql.includes("ALTER TABLE " + table + " ALTER COLUMN job_id SET NOT NULL"),
      "Missing fail-closed job discriminator " + table);
  }
  assert.match(sql, /db09-parent-composite-keys-candidate\.sql/);
  assert.match(sql, /DO \$db066_preflight\$/);
  assert.doesNotMatch(sql, /DROP\s+(?:TABLE|SCHEMA)\b/i);
  return {
    sourceGate: "PASS",
    tables: tables.length,
    parentKeys: uniqueParentKeys.length,
    scopedForeignKeys: requiredChildFKs.length,
    childJobColumns: 3,
    postgresExecution: "NOT_EXECUTED",
  };
}

if (process.argv[1]?.endsWith("verify-db08-cross-parent-source.mjs")) {
  const schema = readFileSync("src/db/schema/placements.ts", "utf8");
  const sql = readFileSync("docs/planning/sql/db08-cross-parent-consistency-candidate.sql", "utf8");
  console.log(JSON.stringify(verifyDB08CrossParentSource(schema, sql), null, 2));
}
