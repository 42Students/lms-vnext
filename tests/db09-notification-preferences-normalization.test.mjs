import { readFileSync } from "node:fs";
import assert from "node:assert/strict";
import test from "node:test";

const schema = readFileSync("src/db/schema/tpo-collaboration.ts", "utf8");
const ledger = JSON.parse(readFileSync(
  "docs/planning/database-parity-db09-field-ledger.json", "utf8"));

function tableBody(name, next) {
  const start = schema.indexOf("export const " + name + " = pgTable(");
  assert.ok(start >= 0, name + " missing");
  const end = next ? schema.indexOf("export const " + next, start + 1) : schema.length;
  assert.ok(end > start, name + " next declaration missing");
  return schema.slice(start, end);
}
const college = tableBody("placementTpoCollegeSettings", "placementTpoTrustedDomains");
const personal = tableBody("placementTpoUserPreferences", "placementTpoSavedViews");
const lookup = (id) => {
  const row = ledger.records.find(r => r.id === id);
  assert.ok(row, id + " missing from DB09 ledger");
  return row;
};

test("DB036 repaired malformed trusted domain expression and duplicate schema exports", () => {
  const names = [...schema.matchAll(/^export const ([A-Za-z_][\w]*)\s*=\s*pgTable\(/gm)]
    .map(m => m[1]);
  assert.ok(names.length >= 12);
  assert.equal(new Set(names).size, names.length, "Duplicate exported pgTable");
  const trusted = tableBody("placementTpoTrustedDomains", "placementTpoPrepCourses");
  assert.match(trusted, /placement_tpo_trusted_domains_shape_ck/);
  assert.match(trusted, /placement_tpo_trusted_domains_free_mail_ck/);
  assert.ok(trusted.includes("and $" + "{table.domain} ~ '^[a-z0-9.-]+[.][a-z]{2,}$'"),
    "Trusted domain regexp must be terminated correctly");
  assert.equal(
    schema.split("export const placementTpoUserPreferences = pgTable(").length - 1,
    1);
});

test("all four college notification toggles are typed non-null true-default flags", () => {
  const fields = [
    ["notifyDriveOpenEmail", "notify_drive_open_email"],
    ["notifyResultApplied", "notify_result_applied"],
    ["notifyNudges", "notify_nudges"],
    ["notifyPrepAssigned", "notify_prep_assigned"],
  ];
  for (const [name, column] of fields) {
    assert.ok(college.includes(
      name + ': boolean("' + column + '").notNull().default(true)'),
      name + " missing source default true");
  }
  assert.equal((college.match(/notify[A-Z]\w+: boolean\(/g) || []).length, 4);
});

test("five per-TPO preference booleans preserve false morning digest and four true defaults", () => {
  for (const [name, column, initial] of [
    ["morningDigest", "morning_digest", false],
    ["recruiterMessages", "recruiter_messages", true],
    ["requests", "requests", true],
    ["resultsReady", "results_ready", true],
    ["followUps", "follow_ups", true],
  ]) {
    assert.ok(personal.includes(
      name + ': boolean("' + column + '").notNull().default(' + initial + ')'),
      name + " source-default mismatch");
  }
  assert.equal((personal.match(/: boolean\("/g) || []).length, 5);
});

test("only fixed JSON keys are normalized; unrelated flexible settings remain JSON", () => {
  assert.doesNotMatch(college, /notifyToggles|jsonb\("notify_toggles"\)/);
  assert.doesNotMatch(personal, /preferences:\s*jsonb|jsonb\("preferences"\)/);
  assert.doesNotMatch(schema, /placement_tpo_college_settings_json_shape_ck|placement_tpo_user_preferences_json_ck/);
  assert.match(college, /jobTypes: jsonb\("job_types"\)/);
  assert.match(college, /outcomeLabels: jsonb\("outcome_labels"\)/);
});

test("personal preferences remain college and user scoped with a composite primary key", () => {
  assert.match(personal, /collegeId: uuid\("college_id"\)[\s\S]*?\.references\(\(\) => colleges\.id/);
  assert.match(personal, /userId: uuid\("user_id"\)[\s\S]*?\.references\(\(\) => users\.id/);
  assert.match(personal, /name: "placement_tpo_user_preferences_pk"/);
  assert.match(personal, /columns: \[table\.collegeId, table\.userId\]/);
});

test("canonical DB09 ledger records both intentional normalization redesigns", () => {
  for (const [id, columns] of [
    ["DB09-TPO_COLLEGE_SETTINGS-12", ["notify_drive_open_email", "notify_result_applied", "notify_nudges", "notify_prep_assigned"]],
    ["DB09-TPO_USER_PREFS-02", ["morning_digest", "recruiter_messages", "requests", "results_ready", "follow_ups"]],
  ]) {
    const row = lookup(id);
    assert.equal(row.status, "REDESIGNED");
    assert.equal(row.mappingTarget.status, "REDESIGNED_BOOLEAN_COLUMNS_SOURCE_REVIEWED_UNVERIFIED");
    for (const col of columns) assert.ok(row.mappingTarget.column.split(",").includes(col));
    assert.deepEqual(row.dbTestEvidence, []);
    assert.deepEqual(row.workflowEvidence, []);
  }
  assert.equal(ledger.records.length, 279);
  assert.equal(ledger.records.filter(x => x.status === "MAPPED").length, 195);
  assert.equal(ledger.records.filter(x => x.status === "REDESIGNED").length, 84);
  assert.equal(ledger.verifiedFieldCount, 0);
});

test("full PostgreSQL and API output parity remain external verification gates", () => {
  assert.match(ledger.lastReview.result, /0 DB\/workflow verified/);
  assert.ok(!college.includes("notify_toggles"));
  assert.ok(!personal.includes("prefs_json"));
});


test("college notification switches preserve exact event map and APP-always-on semantics", () => {
  const contract = readFileSync(
    "docs/planning/db09-notification-preferences-normalization-2026-10-11.md",
    "utf8",
  );
  for (const [event, key] of [
    ["DRIVE_PUBLISHED", "driveOpenEmail"],
    ["DRIVE_UPDATED", "driveOpenEmail"],
    ["APPLICATION_STATUS_CHANGED", "resultApplied"],
    ["NOW_INELIGIBLE", "resultApplied"],
    ["NUDGE", "nudges"],
    ["PREP_ASSIGNED", "prepAssigned"],
  ]) {
    assert.match(
      contract,
      new RegExp(event + "[^\\n]*" + key),
      event + " must remain mapped to " + key,
    );
  }
  assert.match(contract, /in-app notification is still materialized\/sent/i);
  assert.match(contract, /suppresses? only the \*\*non-APP delivery\*\*/i);
  assert.match(contract, /must \*\*never\*\* suppress mandatory/i);
});

test("personal preference evidence is API-persistent without invented UI or delivery claims", () => {
  const contract = readFileSync(
    "docs/planning/db09-notification-preferences-normalization-2026-10-11.md",
    "utf8",
  );
  const row = lookup("DB09-TPO_USER_PREFS-02");
  assert.match(contract, /GET \/api\/v1\/tpo\/my-preferences/);
  assert.match(contract, /PUT \/api\/v1\/tpo\/my-preferences/);
  assert.match(contract, /current frozen TPO page consumption is not proven/i);
  assert.match(row.semanticDefinition, /current frozen TPO page consumption.*not proven/i);
  assert.match(row.constraintAndLifecycleEvidence, /rendered consumer.*did not prove/i);
  assert.match(row.constraintAndLifecycleEvidence, /delivery honoring.*NOT established/i);
  assert.ok(
    row.consumerPaths.includes("src/main/java/com/_42students/lms/controller/tpo/TpoHubController.java"),
  );
  assert.ok(
    row.consumerPaths.includes("lms2-fe/src/api/Services/TpoHubService.js"),
  );
});
