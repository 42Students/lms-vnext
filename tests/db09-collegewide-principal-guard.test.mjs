import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const sql = fs.readFileSync(
  path.resolve(process.cwd(), "drizzle/0075_db09_tpo_collaboration.sql"),
  "utf8",
);
const policy = fs.readFileSync(
  path.resolve(process.cwd(), "src/modules/permissions/policy.ts"),
  "utf8",
);

function functionBody(name) {
  const start = sql.indexOf(`CREATE FUNCTION ${name}(`);
  assert.notEqual(start, -1, `missing ${name}`);
  const end = sql.indexOf("$".repeat(2) + ";", start);
  assert.notEqual(end, -1, `unterminated ${name}`);
  return sql.slice(start, end);
}

// PostgreSQL permits END $; on the same line; do not scan into a later function.
for (const functionName of [
  "db09_assert_message_sender_scope",
  "db09_assert_share_creator_scope",
  "db09_assert_tpo_user_state_scope",
  "db09_assert_student_note_principals",
]) {
  test("function parser isolates same-line terminator: " + functionName, () => {
    const body = functionBody(functionName);
    assert.match(body, /RETURN NEW;\s*END\s*$/);
    assert.doesNotMatch(body.slice("CREATE FUNCTION ".length), /CREATE FUNCTION\s+\w+\s*\(/);
  });
}

test("canonical placements.manage is TPO/COLLEGE_ADMIN only", () => {
  const start = policy.indexOf('case "placements.manage":');
  assert.notEqual(start, -1);
  const end = policy.indexOf('case "college.manage":', start);
  assert.notEqual(end, -1);
  const block = policy.slice(start, end);
  assert.match(block, /hasMembershipRole\(context, "TPO"\)/);
  assert.match(block, /hasMembershipRole\(context, "COLLEGE_ADMIN"\)/);
  assert.doesNotMatch(block, /FACULTY_COORDINATOR|placement_tpo_team_members/);
});

test("DB09 college-wide TPO helper cannot be widened by team rows", () => {
  const body = functionBody("db09_has_active_tpo_actor");
  assert.match(body, /r\.role IN \('TPO','COLLEGE_ADMIN'\)/);
  assert.doesNotMatch(body, /placement_tpo_team_members/);
  assert.doesNotMatch(body, /FACULTY_COORDINATOR|TPO_ADMIN/);
});

test("college-wide collaboration guards use the fail-closed helper", () => {
  for (const functionName of [
    "db09_assert_message_sender_scope",
    "db09_assert_share_creator_scope",
    "db09_assert_tpo_user_state_scope",
    "db09_assert_student_note_principals",
  ]) {
    assert.match(
      functionBody(functionName),
      /db09_has_active_tpo_actor/,
      `${functionName} must use canonical college-wide TPO authority`,
    );
  }
});

test("registered recruiter grant checks active same-company principal", () => {
  const body = functionBody("db09_has_active_recruiter_grant");
  assert.match(body, /r\.company_id = p\.company_id/);
  assert.match(body, /g\.status = 'ACTIVE'/);
  assert.match(body, /u\.platform_status = 'ACTIVE'/);
});
