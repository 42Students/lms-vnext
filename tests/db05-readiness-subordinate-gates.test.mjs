import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const read = (p) => readFileSync(new URL(p, import.meta.url), "utf8");
const manifest = JSON.parse(read("../docs/planning/db05-migration-readiness-manifest.json"));
const checker = read("../scripts/db05-migration-readiness.mjs");

test("DB05 readiness checker requires per-subordinate database execution, not file existence", () => {
  assert.match(checker, /function requireSubordinateDb05Proof\(/);
  assert.match(checker, /entry\.registered !== true/);
  assert.match(checker, /entry\.postgresExecuted !== true/);
  assert.match(checker, /entry\.readyForProduction !== true/);
  assert.match(checker, /Subordinate NOT acceptance-ready/);
  assert.match(checker, /Repeated subordinate SQL reference/);
  assert.match(checker, /Invalid subordinate SQL path/);
  assert.match(checker, /entry\.path !== path/);
  assert.match(checker, /subordinateCompanions: subordinateDetail/);
});

test("DB05 primary draft readiness checks nested tenant and ancestor guard registrations", () => {
  for (const key of [
    "companionIntegrityDraft",
    "companionUpstreamDepartmentDraft",
    "companionSameCollegeDraft",
  ]) assert.ok(checker.includes(key), key);
  const nested = manifest.artifacts.flatMap((artifact) =>
    ["companionIntegrityDraft", "companionUpstreamDepartmentDraft", "companionSameCollegeDraft"]
      .map((key) => ({ artifact: artifact.id, key, value: artifact[key] }))
      .filter(({ value }) => Boolean(value)),
  );
  assert.ok(nested.length >= 4);
  for (const item of nested) {
    assert.ok(item.value.path.startsWith("scripts/sql/"), item.artifact);
    assert.equal(item.value.registered, false);
    assert.equal(item.value.postgresExecuted, false);
  }
});

test("DB05 canonical lesson uniqueness requires explicit matching migration and PostgreSQL proof", () => {
  const row = manifest.crossDomainCompanions.find(
    (companion) => companion.id === "DB05_CONTENT_DELIVERY_ORDER_SCOPE",
  );
  assert.ok(row);
  assert.ok(row.uniqueLessonCompanion);
  assert.equal(row.uniqueLessonProof.path, row.uniqueLessonCompanion);
  assert.equal(row.uniqueLessonProof.registered, false);
  assert.equal(row.uniqueLessonProof.postgresExecuted, false);
  assert.equal(row.uniqueLessonProof.readyForProduction, false);
  assert.match(checker, /item\.uniqueLessonProof/);
  assert.match(checker, /item\.uniqueLessonCompanion/);
});

test("DB05 upstream scope companion requires independent registration and race proof", () => {
  const row = manifest.crossDomainCompanions.find(
    (companion) => companion.id === "DB05_CONTENT_DELIVERY_ORDER_SCOPE",
  );
  assert.ok(row.upstreamReparentCompanion);
  assert.equal(row.upstreamReparentCompanion.registered, false);
  assert.equal(row.upstreamReparentCompanion.postgresExecuted, false);
  assert.equal(row.upstreamReparentCompanion.readyForProduction, false);
  assert.match(checker, /item\.upstreamReparentCompanion/);
  assert.match(checker, /Subordinate NOT acceptance-ready/);
});

test("DB05 source-only state cannot accidentally satisfy primary and companion gates", () => {
  assert.equal(manifest.status, "SOURCE_STAGED_BLOCKED");
  assert.equal(manifest.artifacts.length, 7);
  assert.ok(manifest.artifacts.every((item) => !item.registered && !item.executedAgainstPostgres));
  assert.ok(manifest.crossDomainCompanions.every(
    (item) => !item.registered && !item.postgresExecuted,
  ));
  assert.match(checker, /if \(!report\.ready\) process\.exitCode = 2/);
});
