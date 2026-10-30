import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

// SQL migration 0133 deliberately enables application-free general support
// requests. Do not regress this to an assignment-only NOT NULL contract or
// narrow the DB-level request-kind/check constraints in a generated migration.
test("DB020 typed learner requests preserve registered 0133 nullable application and eight kinds", () => {
  const schema=readFileSync("src/db/schema/placements.ts","utf8");
  const migration=readFileSync("drizzle/0133_lanes_round_1.sql","utf8");
  const start=schema.indexOf("export const placementLearnerRequests = pgTable(");
  const end=schema.indexOf("export const placementApplicationRoundExceptions = pgTable(",start);
  assert.ok(start>=0 && end>start);
  const body=schema.slice(start,end);
  assert.match(migration,/ALTER TABLE placement_learner_requests\s+ALTER COLUMN application_id DROP NOT NULL/i);
  assert.match(body,/applicationId: uuid\("application_id"\)\s*\.references\(/);
  const type=body.slice(body.indexOf('"placement_learner_requests_type_ck"'),body.indexOf('"placement_learner_requests_status_ck"'));
  const shape=body.slice(body.indexOf('"placement_learner_requests_target_shape_ck"'),body.indexOf('"placement_learner_requests_lifecycle_ck"'));
  for(const kind of ["APPLICATION_WITHDRAWAL","ROUND_RESCHEDULE","OFFER_EXTENSION","OFF_CAMPUS_OFFER","REGISTRATION_CHANGE","ABSENCE_DISPUTE","CORRECTION_WITH_PROOF","PLACEMENT_AFTER_PLACEMENT"]){
    assert.ok(type.includes("'"+kind+"'"),"typed kind missing "+kind);
    assert.ok(shape.includes("'"+kind+"'"),"target shape missing "+kind);
  }
  assert.match(shape,/applicationId\} is not null/);
  assert.match(shape,/jsonb_typeof\(\$\{table\.effectPayload\}\) = 'object'/);
});
