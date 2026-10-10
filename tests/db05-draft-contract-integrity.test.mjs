import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const read = (p) => readFileSync(join(root, p), "utf8");
const json = (p) => JSON.parse(read(p));
const nested = json("docs/planning/db05-course-metadata-subfields.json");
const source = json("docs/planning/db-pass4-columns-db05_courses_and_content.json");
const review = json("docs/planning/db05-chat06-source-semantic-review.json");
const fields = source.tables.flatMap(t => t.rows.map(r => ({...r, source: t.table + "." + r.legacyColumn })));
const metadataDraft = read("scripts/sql/db05-course-metadata-extension.draft.sql");
const facetsDraft = read("scripts/sql/db05-course-parent-facets.draft.sql");
const classroomDraft = read("scripts/sql/db05-classroom-message-history.draft.sql");

test("DB05 exactly accounts for all 14 legacy MetaData subfields without false parity", () => {
  const expected = [
    "amount", "imageUrl", "takeaways", "courseCode",
    "courseType", "courseColor", "imageUrlLp", "courseCategory",
    "courseEndDate", "courseStartDate", "introduction_content",
    "htmlContent", "updatedOn", "thumbnail"
  ].sort();
  const observed = nested.fields.map(f => f.legacyField).sort();
  assert.deepEqual(observed, expected);
  assert.equal(new Set(observed).size, 14);
  assert.equal(nested.globalVerification, "NOT_VERIFIED");
  assert.ok(nested.fields.every(f => !f.dbVerified && !f.consumerVerified && !f.actualMigrationRegistered));
  assert.equal(nested.fields.filter(f => f.disposition === "UNREGISTERED_EXTENSION").length, 10);
  const original = fields.find(f => f.source === "course.contents");
  assert.ok(original);
  assert.equal(original.verifiedMapping, null);
  assert.match(original.proposedSemanticMapping, /db05-course-metadata-subfields\.json/);
});

test("DB05 metadata draft does not silently change legacy dates or erase partial updates", () => {
  assert.match(metadataDraft, /SOURCE-BACKED UNREGISTERED DRAFT/);
  assert.match(metadataDraft, /ALTER TABLE course_display_contents/);
  assert.match(metadataDraft, /course_start_date_raw text/);
  assert.match(metadataDraft, /course_end_date_raw text/);
  assert.match(metadataDraft, /legacy_updated_on_raw text/);
  assert.match(metadataDraft, /absent[\s\S]*NOT be erased/);
  for (const name of ["amount", "image_url", "image_url_lp", "course_code", "course_type", "course_color", "course_category"]) {
    assert.match(metadataDraft, new RegExp("\\b" + name + "\\b"));
  }
});

test("DB05 parent and facet draft does not collapse legacy flags into one status", () => {
  assert.match(facetsDraft, /NOT A REGISTERED MIGRATION/);
  assert.match(facetsDraft, /parent_course_id uuid/);
  assert.match(facetsDraft, /created_by_organization_id uuid/);
  assert.match(facetsDraft, /legacy_active boolean/);
  assert.match(facetsDraft, /legacy_enabled boolean/);
  assert.match(facetsDraft, /allowed_for_display integer/);
  assert.match(facetsDraft, /parent_course_id <> id/);
  assert.match(facetsDraft, /parent cycles/);
  for (const column of ["course.parent_course_id", "course.created_by_org_id", "course.allowed_for_display"]) {
    assert.equal(fields.find(f => f.source === column)?.verifiedMapping, null, column);
  }
});

test("DB05 classroom message history draft preserves soft deletion and author snapshots", () => {
  assert.match(classroomDraft, /NOT REGISTERED/);
  assert.match(classroomDraft, /ALTER TABLE course_discussion_messages/);
  assert.match(classroomDraft, /sender_name_snapshot text/);
  assert.match(classroomDraft, /deleted_at timestamptz/);
  assert.match(classroomDraft, /WHERE deleted_at IS NULL/);
  for (const column of ["classroom_messages.sender_name", "classroom_messages.is_deleted"]) {
    const row = fields.find(f => f.source === column);
    assert.equal(row?.verifiedMapping, null);
    assert.match(row.proposedSemanticMapping, /db05-classroom-message-history\.draft\.sql/);
  }
});

test("DB05 proposed mappings are not incorrectly promoted to verified", () => {
  assert.equal(fields.length, 92);
  assert.deepEqual(
    fields.map(f => f.source).sort(),
    review.fields.map(f => f.source).sort()
  );
  assert.ok(fields.every(f => f.verifiedMapping === null));
  assert.ok(review.fields.every(f => f.semanticVerification === "NOT_VERIFIED" && f.runtimeDatabaseVerification === "NOT_RUN"));
  assert.deepEqual(review.counts.byClass, {
    SOURCE_CANDIDATE: 30,
    UNREGISTERED_DRAFT: 38,
    REMODELED_NEEDS_PROOF: 21,
    MISSING_OR_UNPROVEN: 3,
  });
});

const readiness = json("docs/planning/db05-migration-readiness-manifest.json");

test("DB05 migration manifest blocks unregistered drafts until real gates pass", () => {
  assert.equal(readiness.taskId, "DB-008");
  assert.equal(readiness.phase, "DATABASE");
  assert.equal(readiness.status, "SOURCE_STAGED_BLOCKED");
  assert.equal(readiness.migrationIntegratorChat, 1);
  assert.equal(readiness.artifacts.length, 6);
  assert.equal(new Set(readiness.artifacts.map(a => a.path)).size, 6);
  for (const item of readiness.artifacts) {
    assert.equal(item.registered, false, item.id);
    assert.equal(item.executedAgainstPostgres, false, item.id);
    assert.equal(item.readyForProduction, false, item.id);
    assert.ok(item.prereqs.length >= 3, item.id);
    assert.match(read(item.path), /UNREGISTERED|NOT REGISTERED|NOT A REGISTERED/i, item.path);
  }
  assert.equal(readiness.sourceReview.formalSemanticVerifiedFields, 0);
  assert.equal(readiness.sourceReview.nestedCourseMetadataFields, 14);
  assert.ok(readiness.gates.some(g => g.id === "CLEAN_POSTGRES_REPLAY" && g.status === "NOT_RUN"));
  assert.ok(readiness.gates.some(g => g.id === "REGISTERED_DRIZZLE_MIGRATION" && g.status === "BLOCKED"));
});
