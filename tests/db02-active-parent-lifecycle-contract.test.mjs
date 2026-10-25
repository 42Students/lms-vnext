import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

// Static review of UNREGISTERED DB02 lifecycle guards. Not PostgreSQL evidence.
const canonical = readFileSync(
  new URL("../scripts/sql/db02-academic-progression-and-rooms-staging.sql", import.meta.url),
  "utf8",
).replace(/\bCREATE OR REPLACE (FUNCTION|TRIGGER)\b/g, "CREATE $1");
const acceptance = readFileSync(
  new URL("../scripts/sql/db02-active-parent-lifecycle-acceptance-unregistered.sql", import.meta.url),
  "utf8",
);

test("active child creation is parent-lifecycle aware", () => {
  assert.match(canonical, /Active course delivery requires ACTIVE offering, course and section/);
  assert.match(canonical, /BEFORE INSERT OR UPDATE OF offering_id, section_id, ended_at/);
  assert.match(canonical, /Scheduled event requires an ACTIVE section/);
  assert.match(
    canonical,
    /BEFORE INSERT OR UPDATE OF section_id, faculty_membership_id, lecture_hall_id, status, starts_at, ends_at/,
  );
  assert.match(canonical, /Active section faculty assignment requires ACTIVE section and membership/);
  assert.match(canonical, /Active teaching assignment requires active delivery chain and membership/);
  assert.match(canonical, /Active faculty-course association requires ACTIVE membership and course/);
  assert.match(canonical, /Active learner enrollment requires ACTIVE program and PLANNED\/ACTIVE cohort/);
  assert.match(canonical, /Active section enrollment requires ACTIVE learner program, section and period/);
});

test("reactivation revalidates parents instead of resurrecting stale children", () => {
  assert.match(canonical, /Cannot reactivate faculty-course association for archived course/);
  assert.match(canonical, /Cannot reactivate faculty assignment for archived section/);
  assert.match(canonical, /Cannot reactivate teaching assignment without active delivery chain/);
  assert.match(canonical, /Cannot reactivate learner program under inactive program\/cohort/);
  assert.match(canonical, /Cannot reactivate section enrollment under inactive section\/closed period/);
});

test("parent transitions reject committed active dependencies", () => {
  for (const trigger of [
    "db02_course_archive_dependency_guard",
    "db02_course_offering_archive_dependency_guard",
    "db02_delivery_end_dependency_guard",
    "db02_section_archive_dependency_guard",
  ]) {
    assert.match(canonical, new RegExp("CREATE TRIGGER " + trigger));
  }
  assert.match(canonical, /Cannot archive course with active offerings/);
  assert.match(canonical, /Cannot archive course offering with active deliveries/);
  assert.match(canonical, /Cannot end course delivery with active teaching assignments/);
  assert.match(canonical, /Cannot archive section with active learner enrollments/);
  assert.match(canonical, /Cannot archive section with active faculty assignments/);
  assert.match(canonical, /Cannot archive section with active course deliveries/);
  assert.match(canonical, /Cannot archive section with active or future scheduled sessions/);
});

test("section placement preserves PLANNED-period compatibility and rejects CLOSED", () => {
  assert.match(canonical, /period_status_value = 'CLOSED'/);
  assert.doesNotMatch(
    canonical,
    /period_status_value IS DISTINCT FROM 'ACTIVE'/,
  );
  assert.match(acceptance, /PLANNED period is valid: services reject CLOSED, not PLANNED/);
  assert.match(
    acceptance,
    /learner_enrollment_id, planned_section_id, planned_period_id, 'ACTIVE'/,
  );
});

test("focused PostgreSQL lifecycle acceptance is rollback-only and adversarial", () => {
  assert.match(acceptance, /^BEGIN;\s/m);
  assert.match(acceptance, /^ROLLBACK;\s*$/m);
  assert.match(acceptance, /EXCEPTION WHEN check_violation/);
  assert.match(acceptance, /archived course/);
  assert.match(acceptance, /archived section/);
  assert.match(acceptance, /ended delivery/);
  assert.match(acceptance, /withdrawn learner program/);
  assert.match(acceptance, /DB02 active-parent lifecycle acceptance PASS/);
});
