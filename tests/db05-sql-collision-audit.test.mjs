import test from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const command = resolve(root, "scripts/db05-sql-collision-audit.mjs");

test("DB05 SQL draft ownership check rejects collisions and exposes the one intentional override", () => {
  const run = spawnSync(process.execPath, [command, "--json"], {
    cwd: root,
    encoding: "utf8",
  });
  assert.equal(run.status, 0, run.stderr || run.stdout);
  const report = JSON.parse(run.stdout);
  assert.equal(report.sourceOnly, true);
  assert.equal(report.postgresqlExecuted, false);
  assert.equal(report.pass, true);
  assert.deepEqual(report.collisions, []);
  assert.deepEqual(report.errors, []);
  assert.ok(report.sqlDraftsScanned >= 25);
  assert.ok(report.objectCounts.function >= 15);
  assert.ok(report.objectCounts.trigger >= 20);
  assert.equal(report.intentionalOverrides.length, 1);
  assert.equal(report.intentionalOverrides[0].object,
    "function:db05_lesson_discussions_tenant_guard");
  assert.deepEqual(
    report.intentionalOverrides[0].definitions.sort(),
    [
      "scripts/sql/db05-lesson-content-discussions.draft.sql",
      "scripts/sql/db05-lesson-discussions-same-college.draft.sql",
    ].sort(),
  );
});

test("candidate SQL file manifest accounting is explicit, not automatically ready", () => {
  const run = spawnSync(process.execPath, [command, "--json"], {
    cwd: root, encoding: "utf8",
  });
  assert.equal(run.status, 0, run.stderr || run.stdout);
  const report = JSON.parse(run.stdout);
  assert.ok(Array.isArray(report.unlistedDrafts));
  assert.ok(report.unlistedDrafts.every((name) =>
    /^scripts\/sql\/db05-[a-z0-9.-]+\.draft\.sql$/.test(name)));
  assert.match(report.caution, /not registered migrations/i);
  assert.equal(report.postgresqlExecuted, false);
});
