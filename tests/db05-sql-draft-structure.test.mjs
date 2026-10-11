import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const directory = fileURLToPath(new URL("../scripts/sql/", import.meta.url));

// Lightweight source hygiene, NOT PostgreSQL parsing or DB acceptance.
function inspectSqlDraft(sql) {
  const statements = sql.split("\n").filter(line => !/^\s*--/.test(line)).join("\n");
  const starts = [...statements.matchAll(/^[ \t]*BEGIN;[ \t]*$/gm)];
  const commits = [...statements.matchAll(/^[ \t]*COMMIT;[ \t]*$/gm)];
  const first = commits[0];
  const afterFirstCommit = first
    ? statements.slice(first.index + first[0].length).trim()
    : statements.trim();
  const tags = [...statements.matchAll(/\$[a-z_][a-z0-9_]*\$/gi)].map(match => match[0]);
  const unbalanced = [...new Set(tags)]
    .filter(tag => tags.filter(other => other === tag).length % 2 !== 0);
  return { beginCount: starts.length, commitCount: commits.length, afterFirstCommit, unbalanced };
}

test("all staged DB05 SQL drafts have one transaction and no executable tail", () => {
  const names = readdirSync(directory).filter(name => /^db05-[a-z0-9-]+\.draft\.sql$/.test(name));
  assert.ok(names.length >= 22, `Expected >=22 drafts, got ${names.length}`);
  for (const name of names) {
    const result = inspectSqlDraft(readFileSync(join(directory, name), "utf8"));
    assert.equal(result.beginCount, 1, `${name}: BEGIN`);
    assert.equal(result.commitCount, 1, `${name}: COMMIT`);
    assert.equal(result.afterFirstCommit, "", `${name}: noncomment SQL after COMMIT`);
    assert.deepEqual(result.unbalanced, [], `${name}: dollar-quote delimiter`);
  }
});

test("regression fixture catches formerly duplicated receipt SQL fragment", () => {
  const malformed = "BEGIN;\nCREATE TABLE stub (id integer);\nCOMMIT;\nTHEN\n RAISE EXCEPTION 'orphan';\nCOMMIT;";
  const checked = inspectSqlDraft(malformed);
  assert.equal(checked.commitCount, 2);
  assert.match(checked.afterFirstCommit, /THEN/);
});

test("receipt SQL enforces target cohort and academic period on BOTH delivery paths", () => {
  const source = readFileSync(join(directory, "db05-course-receipt-college-scope.draft.sql"), "utf8");
  for (const [pattern, expected] of [
    [/offering\.id, offering\.cohort_id, offering\.academic_period_id/g, 2],
    [/section_row\.cohort_id, section_row\.academic_period_id/g, 2],
    [/delivery_section_cohort_id IS DISTINCT FROM target_cohort_id/g, 2],
    [/delivery_section_period_id IS DISTINCT FROM target_academic_period_id/g, 2],
    [/CREATE TRIGGER db05_course_receipt_tenant_before_write/g, 1],
    [/CREATE OR REPLACE FUNCTION db05_course_receipt_tenant_guard/g, 1],
  ]) {
    assert.equal((source.match(pattern) ?? []).length, expected, pattern.source);
  }
  assert.match(source, /owner_college_id IS DISTINCT FROM NEW\.college_id/);
  assert.match(source, /submission_membership_id IS DISTINCT FROM NEW\.owner_membership_id/);
  assert.match(source, /submission_assignment_id IS DISTINCT FROM NEW\.assignment_id/);
  assert.match(source, /UNREGISTERED SOURCE-ONLY COMPANION/);
});
