import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

// Static contract regression checks for CURRENT service code. These confirm
// locked revalidation exists, NOT that PostgreSQL race/tenant tests passed.
const read = (name) =>
  readFileSync(new URL("../src/modules/courses/" + name, import.meta.url), "utf8");
const course = read("course-service.ts");
const offering = read("offering-service.ts");
const delivery = read("delivery-service.ts");
const teaching = read("teaching-assignment-service.ts");

function exportedBody(source, fn) {
  const from = source.indexOf("export async function " + fn + "(");
  assert.ok(from >= 0, fn);
  const next = source.indexOf("\nexport async function ", from + 10);
  return source.slice(from, next < 0 ? undefined : next);
}
function inOrder(body, tokens, operation) {
  let previous = -1;
  for (const token of tokens) {
    const at = body.indexOf(token, previous + 1);
    assert.ok(at > previous, `${operation}: expected ${token} after offset ${previous}`);
    previous = at;
  }
}

test("course create holds current department+college+org status and scope through INSERT", () => {
  const body = exportedBody(course, "createCourse");
  inOrder(body, [
    "return await getDb().transaction(async (tx)",
    ".from(departments)",
    ".innerJoin(\n          colleges,",
    ".innerJoin(\n          organizations,",
    "isNull(departments.archivedAt)",
    'eq(colleges.status, "ACTIVE")',
    'eq(organizations.status, "ACTIVE")',
    '.for("share")',
    "lockedDepartment.collegeId !== department.collegeId",
    "lockedDepartment.organizationId !== department.organizationId",
    ".insert(courses)",
  ], "createCourse");
  assert.doesNotMatch(body, /await getDb\(\)\s*\.insert\(courses\)/);
});

test("course edits and archival cannot reuse permission after course department transfer", () => {
  const edit = exportedBody(course, "updateCourse");
  const archive = exportedBody(course, "archiveCourse");
  inOrder(edit, [".update(courses)", "eq(courses.id, courseId)", 'eq(courses.status, "ACTIVE")', "eq(courses.departmentId, scope.departmentId)"], "updateCourse");
  inOrder(archive, [".from(courses)", "eq(courses.departmentId, scope.departmentId)", '.for("update")', ".from(courseOfferings)", ".update(courses)", "eq(courses.departmentId, scope.departmentId)"], "archiveCourse");
});

test("offering INSERT rechecks authorized course's current owning college", () => {
  const body = exportedBody(offering, "createCourseOffering");
  inOrder(body, [
    "return await getDb().transaction(async (tx)",
    ".from(courses)",
    ".innerJoin(\n          departments,",
    'eq(courses.status, "ACTIVE")',
    '.for("share")',
    "activeCourse.collegeId !== course.collegeId",
    ".from(cohorts)",
    ".innerJoin(\n          programs,",
    ".innerJoin(\n          departments,",
    '.for("share")',
    "lockedCohort.collegeId !== activeCourse.collegeId",
  ], "createCourseOffering");
});

test("offering locks selected/start/end academic periods in one sorted set", () => {
  const body = exportedBody(offering, "createCourseOffering");
  inOrder(body, [
    "const periodIds = [...new Set([",
    "input.academicPeriodId",
    "lockedCohort.startPeriodId",
    "lockedCohort.expectedEndPeriodId",
    "])].sort()",
    ".where(inArray(academicPeriods.id, periodIds))",
    ".orderBy(asc(academicPeriods.id))",
    '.for("share")',
    "periodById.get(input.academicPeriodId)",
    "periodById.get(lockedCohort.startPeriodId)",
    "lockedPeriods.some((period) =>",
    'chosenPeriod.status === "CLOSED"',
    "chosenPeriod.startDate < startPeriod.startDate",
    "chosenPeriod.endDate > endPeriod.endDate",
    ".insert(courseOfferings)",
  ], "createCourseOffering");
  assert.match(body, /lockedCohort\.status !== "PLANNED"/);
  assert.match(body, /lockedCohort\.status !== "ACTIVE"/);
  assert.doesNotMatch(body, /await getDb\(\)\s*\.insert\(courseOfferings\)/);
});

test("delivery INSERT also locks section ACTIVE and matching cohort+term", () => {
  const body = exportedBody(delivery, "createCourseSectionDelivery");
  inOrder(body, [
    ".from(courseOfferings)",
    '.for("share")',
    ".from(sections)",
    '.for("share")',
    'lockedSection.status !== "ACTIVE"',
    "lockedSection.cohortId !== activeOffering.cohortId",
    "lockedSection.academicPeriodId !== activeOffering.academicPeriodId",
    ".insert(courseSectionDeliveries)",
  ], "createCourseSectionDelivery");
});

test("teacher INSERT locks live delivery, membership status/college, and FACULTY role", () => {
  const body = exportedBody(teaching, "createCourseTeachingAssignment");
  inOrder(body, [
    "return await getDb().transaction(async (tx)",
    ".from(courseSectionDeliveries)",
    '.for("share")',
    ".from(collegeMemberships)",
    '.for("share")',
    'liveMember.status !== "ACTIVE"',
    "liveMember.collegeId !== delivery.collegeId",
    ".from(membershipRoles)",
    'eq(membershipRoles.role, "FACULTY")',
    '.for("share")',
    ".insert(courseTeachingAssignments)",
  ], "createCourseTeachingAssignment");
});

test("these service locks are not misclassified as registered database constraints", () => {
  const queue = JSON.parse(readFileSync(new URL("../docs/coordination/work-queue.json", import.meta.url), "utf8"));
  const phase = JSON.parse(readFileSync(new URL("../docs/coordination/phase-state.json", import.meta.url), "utf8"));
  const task = queue.tasks.find((item) => item.id === "DB-008");
  assert.equal(phase.currentPhase, "DATABASE");
  assert.ok(task);
  assert.notEqual(task.status, "DONE_VERIFIED");
  assert.equal(task.verificationEvidence.length, 0);
});

test("offering rechecks active organization, college, program and department after preflight", () => {
  const body = exportedBody(offering, "createCourseOffering");
  inOrder(body, [
    ".from(courses)",
    ".innerJoin(\n          departments,",
    ".innerJoin(\n          colleges,",
    ".innerJoin(\n          organizations,",
    "isNull(departments.archivedAt)",
    'eq(colleges.status, "ACTIVE")',
    'eq(organizations.status, "ACTIVE")',
    '.for("share")',
    "activeCourse.collegeId !== course.collegeId",
    ".from(cohorts)",
    ".innerJoin(\n          programs,",
    ".innerJoin(\n          departments,",
    'eq(programs.status, "ACTIVE")',
    "isNull(departments.archivedAt)",
    '.for("share")',
    ".insert(courseOfferings)",
  ], "createCourseOfferingActiveAncestry");
});
