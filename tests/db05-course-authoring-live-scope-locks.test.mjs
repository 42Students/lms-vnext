import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const read = (relative) => readFileSync(new URL(relative, import.meta.url), "utf8");
const delivery = read("../src/modules/courses/delivery-service.ts");
const teaching = read("../src/modules/courses/teaching-assignment-service.ts");
const schema = read("../src/db/schema/courses.ts");
const memberships = read("../src/db/schema/memberships.ts");

const deliveryCreate = delivery.slice(
  delivery.indexOf("export async function createCourseSectionDelivery("),
  delivery.indexOf("export async function endCourseSectionDelivery("),
);
const assignmentCreate = teaching.slice(
  teaching.indexOf("export async function createCourseTeachingAssignment("),
  teaching.indexOf("export async function endCourseTeachingAssignment("),
);

test("DB05 delivery creation locks offering before section and INSERT in one transaction", () => {
  assert.match(deliveryCreate, /return await getDb\(\)\.transaction\(async \(tx\) => \{/);
  const offering = deliveryCreate.indexOf(".from(courseOfferings)");
  const section = deliveryCreate.indexOf(".from(sections)");
  const write = deliveryCreate.indexOf(".insert(courseSectionDeliveries)");
  assert.ok(offering >= 0 && section > offering && write > section);
  assert.equal((deliveryCreate.match(/\.for\("share"\)/g) || []).length, 2);
  assert.match(deliveryCreate, /activeOffering\.collegeId !== offering\.collegeId/);
  assert.match(deliveryCreate, /lockedSection\.status !== "ACTIVE"/);
});

test("DB05 delivery locks complete same-college ancestry from course and section", () => {
  for (const match of [
    /\.innerJoin\(courses, eq\(courses\.id, courseOfferings\.courseId\)\)/,
    /\.innerJoin\(departments, eq\(departments\.id, courses\.departmentId\)\)/,
    /\.innerJoin\(cohorts, eq\(cohorts\.id, sections\.cohortId\)\)/,
    /\.innerJoin\(programs, eq\(programs\.id, cohorts\.programId\)\)/,
    /\.innerJoin\(departments, eq\(departments\.id, programs\.departmentId\)\)/,
    /lockedSection\.collegeId !== activeOffering\.collegeId/,
    /lockedSection\.cohortId !== activeOffering\.cohortId/,
    /lockedSection\.academicPeriodId !== activeOffering\.academicPeriodId/,
  ]) assert.match(deliveryCreate, match);
});

test("DB05 delivery fails closed on stale college/section scope, without an early insert", () => {
  const matched = [
    'throw new CoursesServiceError("COURSE_COLLEGE_MISMATCH")',
    'throw new CoursesServiceError("SECTION_NOT_DELIVERABLE")',
  ];
  const createIndex = deliveryCreate.indexOf(".insert(courseSectionDeliveries)");
  for (const phrase of matched) {
    const index = deliveryCreate.indexOf(phrase, deliveryCreate.indexOf("return await getDb().transaction"));
    assert.ok(index > 0 && index < createIndex, phrase);
  }
});

test("DB05 faculty creation locks delivery, active membership and FACULTY role", () => {
  assert.match(assignmentCreate, /return await getDb\(\)\.transaction\(async \(tx\) => \{/);
  const parent = assignmentCreate.indexOf(".from(courseSectionDeliveries)");
  const member = assignmentCreate.indexOf(".from(collegeMemberships)");
  const role = assignmentCreate.indexOf(".from(membershipRoles)");
  const insert = assignmentCreate.indexOf(".insert(courseTeachingAssignments)");
  assert.ok(parent >= 0 && parent < member && member < role && role < insert);
  assert.equal((assignmentCreate.match(/\.for\("share"\)/g) || []).length, 3);
  assert.match(assignmentCreate, /liveMember\.status !== "ACTIVE"/);
  assert.match(assignmentCreate, /liveMember\.collegeId !== delivery\.collegeId/);
  assert.match(assignmentCreate, /eq\(membershipRoles\.role, "FACULTY"\)/);
});

test("DB05 faculty transaction rejects revoked memberships and roles before insert", () => {
  for (const error of [
    "SECTION_DELIVERY_NOT_FOUND",
    "MEMBERSHIP_NOT_ACTIVE",
    "MEMBERSHIP_COLLEGE_MISMATCH",
    "FACULTY_ROLE_REQUIRED",
  ]) {
    const match = new RegExp('throw new CoursesServiceError\\("' + error + '"\\)');
    assert.match(assignmentCreate, match);
  }
  assert.match(memberships, /export const membershipRoles = pgTable\(/);
  assert.match(schema, /export const courseTeachingAssignments = pgTable\(/);
});

test("DB05 authoring checks are source guards, not executed PostgreSQL acceptance", () => {
  const manifest = JSON.parse(read("../docs/planning/db05-migration-readiness-manifest.json"));
  assert.equal(manifest.status, "SOURCE_STAGED_BLOCKED");
  assert.ok(manifest.gates.some(g => g.id === "DB05_ACTIVE_CHILD_ARCHIVE_SERIALIZATION_PG_NEGATIVE" && g.status === "NOT_RUN"));
});
