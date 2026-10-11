import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const read = (p) => fs.readFileSync(path.resolve(process.cwd(), p), "utf8");

test("DB09 trusted domains are normalized rather than JSON settings", () => {
  const schema = read("src/db/schema/tpo-collaboration.ts");
  assert.doesNotMatch(schema, /trustedDomains:\s*jsonb\(/);
  assert.match(schema, /export const placementTpoTrustedDomains = pgTable/);
  assert.match(schema, /"placement_tpo_trusted_domains"/);
  assert.match(schema, /placement_tpo_trusted_domains_shape_ck/);
  assert.match(schema, /placement_tpo_trusted_domains_free_mail_ck/);
  for (const freeMail of [
    "gmail.com", "googlemail.com", "yahoo.com", "outlook.com",
    "hotmail.com", "icloud.com", "protonmail.com", "mail.com",
  ]) {
    assert.match(schema, new RegExp("'" + freeMail.replace(".", "\\.") + "'"));
  }
});

test("DB09 prep courses are normalized to a real course FK", () => {
  const schema = read("src/db/schema/tpo-collaboration.ts");
  assert.doesNotMatch(schema, /prepCourseIds:\s*jsonb\(/);
  assert.match(schema, /export const placementTpoPrepCourses = pgTable/);
  assert.match(schema, /"placement_tpo_prep_courses"/);
  assert.match(schema, /\.references\(\(\) => courses\.id/);
  assert.match(schema, /placement_tpo_prep_courses_pk/);
});

test("DB09 trusted-domain SQL preserves source domain policy and TPO scope", () => {
  const sql = read("docs/planning/sql/db09-tpo-settings-normalization-candidate.sql");
  assert.match(sql, /CREATE TABLE placement_tpo_trusted_domains/);
  assert.match(sql, /domain = lower\(domain\)/);
  assert.match(sql, /domain = trim\(domain\)/);
  assert.match(sql, /domain ~ '\^\[a-z0-9\.\-\]\+\[\.\]\[a-z\]\{2,\}\$'/);
  assert.match(sql, /gmail\.com/);
  assert.match(sql, /yandex\.com/);
  assert.match(sql, /CREATE TRIGGER db09_trusted_domain_scope_guard/);
  assert.match(sql, /db09_has_active_tpo_actor/);
});

test("DB09 prep-course SQL preserves organization-level source scope", () => {
  const sql = read("docs/planning/sql/db09-tpo-settings-normalization-candidate.sql");
  assert.match(sql, /CREATE TABLE placement_tpo_prep_courses/);
  assert.match(sql, /REFERENCES courses\(id\)/);
  assert.match(sql, /JOIN departments d ON d\.id = c\.department_id/);
  assert.match(sql, /JOIN colleges owner_college ON owner_college\.id = d\.college_id/);
  assert.match(sql, /owner_college\.organization_id = v_target_org/);
  assert.match(sql, /c\.status = 'ACTIVE'/);
  assert.match(sql, /d\.archived_at IS NULL/);
  assert.match(sql, /owner_college\.status = 'ACTIVE'/);
  assert.match(sql, /CREATE TRIGGER db09_prep_course_setting_scope_guard/);
});

test("DB09 normalized settings remain unregistered staging", () => {
  const sql = read("docs/planning/sql/db09-tpo-settings-normalization-candidate.sql");
  const doc = read("docs/planning/db09-tpo-settings-normalization-2026-10-11.md");
  assert.match(sql, /UNREGISTERED \/ NOT EXECUTED/);
  assert.match(doc, /No Node or PostgreSQL execution is claimed/);
  assert.match(doc, /same-organization/);
  assert.match(doc, /exact domain equality/);
});
