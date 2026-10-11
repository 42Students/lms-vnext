import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const read = p => readFileSync(new URL(p, import.meta.url), "utf8");
const matrix = JSON.parse(read("../docs/planning/db05-learner-content-visibility-matrix.json"));
const contentService = read("../src/modules/courses/lesson-content-service.ts");
const learner = read("../src/modules/courses/learner-course-service.ts");
const facets = read("../scripts/sql/db05-lesson-content-authoring-facets.draft.sql");

test("DB05 requires both authored visibility flags when learner content is published", () => {
  assert.equal(matrix.table.length, 6);
  const pub = matrix.table.filter(x => x.lessonContentStatus === "PUBLISHED");
  assert.equal(pub.length, 4);
  assert.equal(pub.filter(x => x.sourceLegacyVisible).length, 1);
  assert.ok(pub.every(x => x.sourceLegacyVisible === (x.legacyActive && x.legacyEnabled)));
  assert.ok(pub.filter(x => !x.sourceLegacyVisible).every(x => x.parityRisk));
  assert.match(facets, /legacy_active boolean/);
  assert.match(facets, /legacy_enabled boolean/);
});

test("DB05 does not weaken vNext publication protections to chase legacy flag parity", () => {
  assert.match(contentService, /eq\(\s*lessonContents\.status,\s*"PUBLISHED"/);
  assert.match(learner, /eq\(\s*lessonContents\.status,\s*"PUBLISHED"/);
  assert.match(matrix.securityDecision, /Do not remove PUBLISHED requirement/);
  assert.match(matrix.securityDecision, /intersection/);
  assert.equal(matrix.verified, false);
  assert.equal(matrix.postgres, "NOT_RUN");
});

test("DB05 matrix retains explicit admin edit omitted-flag, tenancy and archive tests", () => {
  assert.ok(matrix.acceptance.some(x => /Update omitting active\/enabled preserves/.test(x)));
  assert.ok(matrix.acceptance.some(x => /wrong offering/.test(x)));
  assert.ok(matrix.acceptance.some(x => /Publication and archive transitions/.test(x)));
  assert.equal(matrix.tests, "AUTHORED_NOT_EXECUTED");
});
