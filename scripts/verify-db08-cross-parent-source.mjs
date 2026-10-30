#!/usr/bin/env node
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const schema = readFileSync(resolve("src/db/schema/placements.ts"), "utf8");
const applicationService = readFileSync(resolve("src/modules/placements/application-service.ts"), "utf8");
const resultService = readFileSync(resolve("src/modules/placements/result-service.ts"), "utf8");
const requestService = readFileSync(resolve("src/modules/placements/request-service.ts"), "utf8");
const candidate = readFileSync(resolve("docs/planning/sql/db08-cross-parent-consistency-candidate.sql"), "utf8");

const checks = [];
function check(name, fn) {
  fn();
  checks.push(name);
}

check("application service scopes role option to job", () => {
  assert.match(applicationService, /placementJobRoleOptions\.id[\s\S]*roleOptionId[\s\S]*placementJobRoleOptions\.jobId[\s\S]*jobId/);
  assert.match(applicationService, /liveRole\.jobId\s*!==\s*job\.id/);
});

check("result service rejects application from another round job", () => {
  assert.match(resultService, /row\.application\.jobId\s*!==\s*round\.jobId/);
});

check("result staging revalidates exact job and shortlist under row locks", () => {
  const begin=resultService.indexOf("export async function stagePlacementRoundResult");
  const end=resultService.indexOf("async function loadResultContext",begin);
  assert.ok(begin>=0 && end>begin);
  const staging=resultService.slice(begin,end);
  assert.match(staging,/const \[lockedRound\][\s\S]*eq\(placementJobRounds\.jobId,job\.id\)[\s\S]*\.for\("update"\)/);
  assert.match(staging,/const \[lockedApplication\][\s\S]*eq\(placementApplications\.jobId,job\.id\)[\s\S]*\.for\("update"\)/);
  assert.match(staging,/const \[lockedScreening\][\s\S]*\.for\("share"\)/);
  assert.match(staging,/lockedScreening\.status!=="SHORTLISTED"/);
  assert.match(staging,/PLACEMENT_RESULT_SCREENING_NOT_SHORTLISTED/);
});

check("request service rejects cross-job round", () => {
  assert.match(requestService, /round\.jobId\s*!==\s*application\.job\.id/);
});

check("request service rejects offer from another application", () => {
  assert.match(requestService, /offer\.applicationId\s*!==\s*application\.application\.id/);
});

check("registered Drizzle still has independent vulnerable IDs", () => {
  const app = schema.slice(schema.indexOf("export const placementApplications"), schema.indexOf("export const placementApplicationStatusHistory"));
  assert.match(app, /jobId: uuid\("job_id"\)/);
  assert.match(app, /roleOptionId: uuid\("role_option_id"\)/);
  assert.doesNotMatch(app, /foreignKey\(/);

  const result = schema.slice(schema.indexOf("export const placementRoundResults"), schema.indexOf("export const placementOffers"));
  assert.match(result, /roundId: uuid\("round_id"\)/);
  assert.match(result, /applicationId: uuid\("application_id"\)/);
  assert.doesNotMatch(result, /jobId: uuid\("job_id"\)/);

  const request = schema.slice(schema.indexOf("export const placementLearnerRequests"), schema.indexOf("export const placementApplicationRoundExceptions"));
  assert.match(request, /applicationId: uuid\("application_id"\)/);
  assert.match(request, /roundId: uuid\("round_id"\)/);
  assert.match(request, /offerId: uuid\("offer_id"\)/);
  assert.doesNotMatch(request, /jobId: uuid\("job_id"\)/);
});

check("candidate binds application role option to same job", () => {
  assert.match(candidate, /db066_application_role_same_job_fk/);
  assert.match(candidate, /FOREIGN KEY \(role_option_id, job_id\)[\s\S]*placement_job_role_options\(id, job_id\)/);
});

check("candidate binds round result to one job", () => {
  assert.match(candidate, /db066_round_result_round_job_fk/);
  assert.match(candidate, /db066_round_result_application_job_fk/);
});

check("candidate binds request round and offer ownership", () => {
  assert.match(candidate, /db066_request_application_job_fk/);
  assert.match(candidate, /db066_request_round_job_fk/);
  assert.match(candidate, /db066_request_offer_application_fk/);
});

check("candidate binds exception to exact reschedule request type", () => {
  assert.match(candidate, /db066_exception_request_type_ck[\s\S]*ROUND_RESCHEDULE/);
  assert.match(candidate, /FOREIGN KEY \(request_id, application_id, round_id, request_type\)/);
  assert.match(candidate, /placement_learner_requests\(id, application_id, round_id, request_type\)/);
});

check("candidate has corrupt-row preflight", () => {
  assert.match(candidate, /DB066: application role option belongs to another job/);
  assert.match(candidate, /DB066: round result crosses jobs/);
  assert.match(candidate, /DB066: learner request targets another application\/job/);
  assert.match(candidate, /DB066: exception references unrelated reschedule request/);
});

process.stdout.write(JSON.stringify({
  task: "DB-066",
  status: "SOURCE_ASSERTIONS_PASSED",
  assertions: checks.length,
  checks,
}, null, 2) + "\n");
