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
    UNREGISTERED_DRAFT: 37,
    REMODELED_NEEDS_PROOF: 22,
    MISSING_OR_UNPROVEN: 3,
  });
});

const readiness = json("docs/planning/db05-migration-readiness-manifest.json");

test("DB05 migration manifest blocks unregistered drafts until real gates pass", () => {
  assert.equal(readiness.taskId, "DB-008");
  assert.equal(readiness.phase, "DATABASE");
  assert.equal(readiness.status, "SOURCE_STAGED_BLOCKED");
  assert.equal(readiness.migrationIntegratorChat, 1);
  assert.equal(readiness.artifacts.length, 7);
  assert.equal(new Set(readiness.artifacts.map(a => a.path)).size, 7);
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

const unresolved = json("docs/planning/db05-unresolved-semantic-decisions.json");

test("DB05 unresolved decisions track exactly the remodeled and unproven source fields", () => {
  const expected = review.fields
    .filter(f => f.classification === "REMODELED_NEEDS_PROOF" || f.classification === "MISSING_OR_UNPROVEN")
    .map(f => f.source).sort();
  assert.deepEqual(unresolved.items.map(i => i.source).sort(), expected);
  assert.equal(unresolved.totalOutstanding, expected.length);
  assert.equal(unresolved.missingOrUnproven, 3);
  assert.equal(unresolved.remodeledNeedProof, 22);
  assert.equal(unresolved.formalDbVerified, 0);
  assert.ok(unresolved.items.every(i => i.disposition === "OPEN" && !i.verified && !i.postgresExecuted));
  for (const field of ["course.default_subscription_days", "course.formal_title", "learner_content_progress.is_deleted"]) {
    assert.ok(unresolved.items.some(item => item.source === field && item.classification === "MISSING_OR_UNPROVEN"));
  }
});

const readinessScript = read("scripts/db05-migration-readiness.mjs");

test("DB05 readiness checker fails closed on staged migrations and unrun PostgreSQL evidence", () => {
  assert.match(readinessScript, /if \(!item\.registered \|\| !item\.executedAgainstPostgres \|\| !item\.readyForProduction\)/);
  assert.match(readinessScript, /gate\.status !== "PASS"/);
  assert.match(readinessScript, /semanticVerification !== "WORKFLOW_VERIFIED"/);
  assert.match(readinessScript, /runtimeDatabaseVerification !== "PASS"/);
  assert.match(readinessScript, /if \(!report\.ready\) process\.exitCode = 2/);
  assert.ok(readiness.artifacts.every(item => !item.registered && !item.executedAgainstPostgres));
});

const payload = json("docs/planning/db05-lesson-content-payload-subfields.json");
const payloadSql = read("scripts/sql/db05-lesson-content-settings.draft.sql");

test("DB05 payload inventory preserves 17 legacy JSON keys without pretending DB06 parity", () => {
  const expected = [
    "fileDTO", "htmlContent", "allowDiscussions", "viewAfterSchedule",
    "viewBeforeSchedule", "text", "duration", "dueDate", "link",
    "resourceMaterials", "assignmentResources", "allowedSubmissionTypes",
    "calendarEventId", "timeZone", "endTime", "startTime", "thumbnail"
  ];
  assert.deepEqual(payload.fields.map(f => f.legacyField).sort(), expected.sort());
  assert.equal(payload.fields.length, 17);
  assert.equal(payload.fields.filter(f => f.classification === "UNREGISTERED_DRAFT").length, 9);
  assert.equal(payload.fields.filter(f => f.classification === "MISSING_OR_UNPROVEN").length, 2);
  assert.ok(payload.fields.every(f => !f.verified && !f.postgresExecuted && !f.producerConsumerVerified));
  assert.equal(readiness.sourceReview.nestedLessonContentDataFields, 17);
  assert.equal(unresolved.totalOutstanding, 25);
});

test("DB05 settings draft preserves flags and timezone without embedding private upload data", () => {
  assert.match(payloadSql, /NOT A REGISTERED MIGRATION/);
  for (const key of ["allow_discussions", "view_after_schedule", "view_before_schedule", "html_content",
    "plain_text", "legacy_due_date_raw", "calendar_event_id", "calendar_time_zone", "thumbnail_url"]) {
    assert.match(payloadSql, new RegExp("\\b" + key + "\\b"), key);
  }
  assert.match(payloadSql, /lesson_content_id uuid PRIMARY KEY/);
  assert.match(payloadSql, /version bigint NOT NULL DEFAULT 0/);
  assert.doesNotMatch(payloadSql, /upload_token_hash|raw_file_bytes/);
  assert.match(payloadSql, /DB06 assignmentResources and allowedSubmissionTypes remain unmapped/);
});

test("DB05 readiness gate checks every companion and the witnessed lesson order constraint", () => {
  assert.match(readinessScript, /const companions = manifest\.crossDomainCompanions \|\| \[\]/);
  assert.match(readinessScript, /Companion NOT acceptance-ready/);
  assert.match(readinessScript, /Missing companion:/);
  assert.match(readinessScript, /item\.uniqueLessonCompanion/);
  assert.match(readinessScript, /Missing subordinate companion:/);
  assert.match(readinessScript, /companions: companionDetail/);
  assert.ok(readiness.crossDomainCompanions.length >= 8);
  assert.ok(readiness.crossDomainCompanions.every(c => !c.registered && !c.postgresExecuted && !c.readyForProduction));
  assert.equal(readiness.crossDomainCompanions.filter(c => c.id === "DB05_LESSON_CONTENT_FACULTY_OWNER").length, 1);
  assert.equal(readiness.crossDomainCompanions.filter(c => c.id === "DB05_LESSON_CONTENT_OWNER_MEMBERSHIP").length, 0);
});
