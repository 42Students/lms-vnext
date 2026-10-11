import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = (path) => JSON.parse(
  readFileSync(new URL("../" + path, import.meta.url), "utf8"),
);
const summary = read("docs/planning/db05-historical-terms-scan-summary.json");
const sourceProof = read("docs/planning/db05-historical-course-columns-source-evidence.json");
const batches = [1, 2, 3, 4, 5].map((number) =>
  read("docs/planning/db05-historical-terms-scan-batch-0" + number + ".json"),
);

test("expanded scan summary is exactly reproducible from pinned source files", () => {
  const files = batches.flatMap((batch) => batch.files);
  assert.equal(summary.exactGitBlobFilesChecked, files.length);
  assert.equal(summary.backendChecked, files.filter((f) => f.repo === "42Students/lms").length);
  assert.equal(summary.frontendChecked, files.filter((f) => f.repo === "42Students/lms2-fe").length);
  assert.equal(summary.failedFileReads, files.filter((f) => !!f.error).length);
  assert.equal(new Set(files.map((f) => f.repo + "/" + f.path)).size, files.length);
  assert.equal(summary.duplicates, 0);
  assert.ok(files.every((f) => /^[0-9a-f]{40}$/.test(f.sha)));
  assert.equal(summary.scope, "BOUNDED_NOT_EXHAUSTIVE");
});

test("formal_title source producer is not misrepresented as proof of persisted column parity", () => {
  const files = batches.flatMap((batch) => batch.files);
  const hits = files.filter((f) => f.matches?.length > 0);
  assert.deepEqual(summary.keywordHitFiles.map((f) => f.path).sort(), hits.map((f) => f.path).sort());
  assert.ok(hits.some((f) =>
    f.path.endsWith("/LearnerController.java") &&
    f.matches.some((m) => m.term === "formal_title")
  ));
  assert.match(sourceProof.newSourceConsumerDiscovery.note, /NOT the historical persisted column/i);
  assert.match(summary.caution, /physical historical course.formal_title column/);
  assert.ok(summary.exactGitBlobFilesChecked >= 70);
});

test("no runtime or exhaustive absence claims from a bounded source scan", () => {
  assert.match(summary.caution, /not full repository/i);
  assert.match(summary.caution, /No migration registered or tests executed/i);
  for (const file of batches.flatMap((batch) => batch.files)) {
    assert.ok(!file.error, file.path);
    assert.ok(Array.isArray(file.matches));
  }
});
