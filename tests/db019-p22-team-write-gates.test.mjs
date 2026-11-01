import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const service = readFileSync("src/modules/placements/tpo-settings-team-actions-service.ts", "utf8");
const schema = readFileSync("src/db/schema/tpo-collaboration.ts", "utf8");
const migration = readFileSync(
  "docs/legacy-source/backend/src/main/resources/db/migration/V201__drop_tpo_coordinator_roles.sql", "utf8");
const segment = service.slice(service.indexOf("export async function addTpoTeamAssignment"),
  service.indexOf("/** Removal previews"));

test("P22 team mutation rechecks live TPO authority in the write transaction", () => {
  const start = segment.indexOf("return getDb().transaction(async tx=>");
  const guard = segment.indexOf('await assertPersistedPlatformPermission(tx,context,"placements.manage"');
  const candidate = segment.indexOf("const [candidate]=await tx.select", guard);
  const insert = segment.indexOf("await tx.insert(placementTpoTeamMembers)", guard);
  assert.ok(start >= 0 && start < guard && guard < candidate && candidate < insert);
  assert.match(segment, /collegeId:actor\.collegeId,organizationId:actor\.organizationId/);
  assert.match(segment, /eq\(collegeMemberships\.collegeId,actor\.collegeId\)/);
  assert.match(segment, /eq\(collegeMemberships\.status,"ACTIVE"\)/);
  assert.match(segment, /eq\(users\.platformStatus,"ACTIVE"\)/);
  assert.doesNotMatch(segment, /await getDb\(\)\.insert\(placementTpoTeamMembers\)/);
});

test("new TPO team assignments honor V201 admin-only role and registered column constraint", () => {
  assert.match(migration, /role <> 'TPO_ADMIN'/);
  assert.match(segment, /const role="TPO_ADMIN" as const/);
  assert.doesNotMatch(segment, /const role=roles\.some/);
  assert.match(segment, /set:\{role,departmentId:null\}/);
  const tableBlock = schema.slice(schema.indexOf("export const placementTpoTeamMembers"),
    schema.indexOf("export const placementRecruiterApplicantNotes"));
  assert.match(tableBlock, /placement_tpo_team_members_department_ck/);
  assert.match(tableBlock, /\(\$\{table\.role\} = 'TPO_ADMIN' and \$\{table\.departmentId\} is null\)/);
});

test("coordinator read compatibility remains separate and uncertified", () => {
  const roster = readFileSync("src/modules/placements/tpo-settings-read-model.ts", "utf8");
  assert.match(roster, /FACULTY_COORDINATOR/);
  assert.match(roster, /STUDENT_COORDINATOR/);
});
