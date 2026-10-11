import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

// DB-049: static source-contract checks only. Not PostgreSQL execution proof.
const read = (path) => readFileSync(path, "utf8");
const sql = read("scripts/sql/db10-notification-campaign-staging.sql");
const contract = read("docs/planning/database-parity-db10-campaign-publish-guard.md");
const activity = read("src/db/schema/activity.ts");
const courses = read("src/db/schema/courses.ts");
const academics = read("src/db/schema/academics.ts");

const functionBody = sql.slice(
  sql.indexOf("CREATE FUNCTION db43_guard_campaign_scope()"),
  sql.indexOf("CREATE TRIGGER db43_notification_campaign_scope_guard"),
);

test("DB49 UPDATE status is in the scoped guard trigger, not only target columns", () => {
  assert.match(sql, /CREATE TRIGGER db43_notification_campaign_scope_guard\s+BEFORE INSERT OR UPDATE OF status, organization_id, college_id, source_event_id,/);
  assert.match(sql, /EXECUTE FUNCTION db43_guard_campaign_scope\(\)/);
  assert.match(functionBody, /NEW\.status NOT IN \('PUBLISHING','PUBLISHED'\)/);
});

test("DB49 PUBLISHING/PUBLISHED cannot bypass recheck with unchanged target IDs", () => {
  assert.match(functionBody, /IF TG_OP = 'UPDATE' AND NEW\.status NOT IN \('PUBLISHING','PUBLISHED'\)/);
  assert.match(functionBody, /ROW\(NEW\.organization_id, NEW\.college_id, NEW\.source_event_id,/);
  assert.match(functionBody, /IS NOT DISTINCT FROM\s+ROW\(OLD\.organization_id, OLD\.college_id, OLD\.source_event_id,/);
  assert.match(functionBody, /THEN\s+RETURN NEW;\s+END IF;\s+SELECT c\.organization_id/);
});

test("DB49 personal target locks its same-college ACTIVE membership witness", () => {
  assert.match(functionBody, /IF NEW\.target_user_id IS NOT NULL THEN\s+[\s\S]*?PERFORM 1 FROM college_memberships m/);
  assert.match(functionBody, /m\.user_id=NEW\.target_user_id/);
  assert.match(functionBody, /m\.college_id=NEW\.college_id/);
  assert.match(functionBody, /m\.status='ACTIVE'\s+FOR SHARE OF m;/);
  assert.match(functionBody, /IF NOT FOUND THEN\s+RAISE EXCEPTION 'Campaign personal recipient is not active in college'/);
  assert.doesNotMatch(functionBody, /target_user_id IS NOT NULL AND NOT EXISTS/);
});

test("DB49 combined section/course target locks both delivery and offering", () => {
  assert.match(functionBody, /IF NEW\.audience_scope='SECTION_COURSE' THEN/);
  assert.match(functionBody, /PERFORM 1\s+FROM course_section_deliveries cd\s+JOIN course_offerings o ON o\.id=cd\.offering_id/);
  assert.match(functionBody, /cd\.section_id=NEW\.target_section_id/);
  assert.match(functionBody, /o\.course_id=NEW\.target_course_id/);
  assert.match(functionBody, /cd\.ended_at IS NULL AND o\.status='ACTIVE'\s+FOR SHARE OF cd, o;/);
  assert.match(functionBody, /IF NOT FOUND THEN\s+RAISE EXCEPTION 'Campaign section and course have no active delivery'/);
});

test("DB49 status-only failed/cancelled cleanup does not require revoked membership", () => {
  assert.match(functionBody, /NEW\.status NOT IN \('PUBLISHING','PUBLISHED'\)/);
  assert.match(functionBody, /NEW\.target_user_id\)\s+IS NOT DISTINCT FROM[\s\S]*OLD\.target_user_id\)/);
  assert.match(sql, /status IN \('DRAFT','SCHEDULED','PUBLISHING','PUBLISHED','FAILED','CANCELLED'\)/);
});

test("DB49 still protects the original parent chain, event and creator scope", () => {
  assert.match(functionBody, /actual_org <> NEW\.organization_id/);
  assert.match(functionBody, /event_college IS DISTINCT FROM NEW\.college_id/);
  assert.match(functionBody, /event_org IS DISTINCT FROM NEW\.organization_id/);
  assert.match(functionBody, /creator_college IS DISTINCT FROM NEW\.college_id/);
  assert.match(functionBody, /section_college IS DISTINCT FROM NEW\.college_id/);
  assert.match(functionBody, /course_college IS DISTINCT FROM NEW\.college_id/);
  assert.match(functionBody, /FOR SHARE OF s, h, p, d/);
  assert.match(functionBody, /FOR SHARE OF c, d/);
});

test("DB49 referenced witness columns exist in registered schema sources", () => {
  assert.match(courses, /"course_section_deliveries"/);
  assert.match(courses, /"course_offerings"/);
  assert.match(courses, /endedAt: timestamp\("ended_at"/);
  assert.match(courses, /status: courseOfferingStatusEnum\("status"\)/);
  assert.match(academics, /"sections"/);
  assert.match(activity, /"in_app_notifications"/);
});

test("DB49 does not introduce a second trigger, stored function or registered migration", () => {
  assert.equal((sql.match(/CREATE TABLE /g) ?? []).length, 1);
  assert.equal((sql.match(/CREATE FUNCTION /g) ?? []).length, 1);
  assert.equal((sql.match(/CREATE TRIGGER /g) ?? []).length, 1);
  assert.match(sql, /STAGING ONLY: NOT a registered Drizzle migration/);
  assert.doesNotMatch(sql, /DROP TABLE|TRUNCATE TABLE|DELETE FROM/);
});

test("DB49 declares all 16 negative and race witnesses as NOT_RUN", () => {
  for (let i = 1; i <= 16; i += 1) {
    assert.ok(contract.includes("DB49-" + String(i).padStart(2, "0")), "Missing DB49-" + i);
  }
  assert.match(contract, /ALL NOT_RUN/);
  assert.match(contract, /two independent PostgreSQL connections\/transactions/);
  assert.match(contract, /GitHub Actions dependence/);
});

test("DB49 scopes SQL safeguards to campaign, not arbitrary recipient authorization", () => {
  assert.match(sql, /Publisher must still re-evaluate every derived learner\/faculty\/mentor/);
  assert.match(contract, /campaign target guard alone is NOT a complete recipient entitlement/i);
  assert.match(contract, /NOT a registered migration/);
  assert.match(contract, /not executed PostgreSQL race evidence/i);
});
