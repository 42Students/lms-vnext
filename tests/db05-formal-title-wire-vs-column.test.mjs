import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = (path) =>
  readFileSync(new URL("../" + path, import.meta.url), "utf8");
const source = JSON.parse(read("docs/planning/db05-historical-course-columns-source-evidence.json"));
const review = JSON.parse(read("docs/planning/db05-chat06-source-semantic-review.json"));
const draft = read("scripts/sql/db05-historical-course-columns.compatibility.draft.sql");

test("formal_title active wire response is derived, not proof of SQL column usage", () => {
  const evidence = source.newSourceConsumerDiscovery;
  assert.ok(evidence);
  assert.equal(evidence.apiResponseField, "formal_title");
  assert.equal(
    evidence.derivedExpression,
    "course.shortTitle != null ? course.shortTitle : course.courseName",
  );
  for (const name of [
    "LearnerController.java",
    "NewProgramDetailsDTO.java",
    "NewProgramServiceImpl.java",
  ]) {
    const file = evidence.files.find((item) => item.path.endsWith("/" + name));
    assert.ok(file && /^[0-9a-f]{40}$/.test(file.blobSha), name);
    assert.equal(file.directCourseFormalTitleColumnAccess, false, name);
  }
  assert.match(evidence.note, /NOT|not|does not/);
});

test("historical physical column stays unverified until direct use or explicit retirement", () => {
  const row = review.fields.find((field) => field.source === "course.formal_title");
  assert.ok(row);
  assert.equal(row.semanticVerification, "NOT_VERIFIED");
  assert.equal(row.runtimeDatabaseVerification, "NOT_RUN");
  assert.equal(row.classification, "MISSING_OR_UNPROVEN");
  const historical = source.unmappedHistoricalColumns.find((field) =>
    field.field === "course.formal_title");
  assert.ok(historical);
  assert.equal(historical.runtimeConsumerVerified, false);
  assert.equal(historical.retirementApproved, false);
  assert.equal(historical.directPhysicalColumnConsumerStillUnproven, true);
  assert.match(draft, /UNREGISTERED CONDITIONAL COMPANION/);
});

test("frontend and API derived formal_title must not be erased by a missing-column classification", () => {
  assert.match(source.newSourceConsumerDiscovery.note, /serialized response concept/);
  assert.match(source.newSourceConsumerDiscovery.candidateDecision ?? source.unmappedHistoricalColumns.find(f => f.field === "course.formal_title").candidateDecision, /derived formal_title API response/);
  assert.ok(source.newSourceConsumerDiscovery.unverified.includes("frontend consumer usage"));
});
