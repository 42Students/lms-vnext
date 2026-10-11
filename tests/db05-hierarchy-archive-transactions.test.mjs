import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const read = (p) => readFileSync(new URL(p, import.meta.url), "utf8");
const inputs = [
  {
    file: "../src/modules/courses/course-service.ts",
    start: "export async function archiveCourse(",
    lock: "courses",
    child: "courseOfferings",
    expectedError: "COURSE_HAS_ACTIVE_OFFERINGS",
  },
  {
    file: "../src/modules/courses/offering-service.ts",
    start: "export async function archiveCourseOffering(",
    lock: "courseOfferings",
    child: "courseSectionDeliveries",
    expectedError: "OFFERING_HAS_ACTIVE_DELIVERIES",
  },
  {
    file: "../src/modules/courses/delivery-service.ts",
    start: "export async function endCourseSectionDelivery(",
    lock: "courseSectionDeliveries",
    child: "courseTeachingAssignments",
    expectedError: "DELIVERY_HAS_ACTIVE_TEACHERS",
  },
];

function functionBody({file, start}) {
  const source = read(file);
  const offset = source.indexOf(start);
  assert.ok(offset >= 0, file + ": missing function");
  return source.slice(offset);
}

test("DB05 all three existing course lifecycle operations are transaction-protected", () => {
  for (const entry of inputs) {
    const body = functionBody(entry);
    assert.match(body, /return getDb\(\)\.transaction\(async \(tx\) => \{/);
    assert.match(body, /\.for\("update"\)\s*\.limit\(1\)/);
    assert.match(body, /return (?:archived|updated);\s*\}\);/);
    assert.equal((body.match(/\.for\("update"\)/g) || []).length, 1, entry.file);
  }
});

test("DB05 every lifecycle operation locks the correct FK parent before its child read", () => {
  for (const entry of inputs) {
    const body = functionBody(entry);
    const lock = body.indexOf(".from(" + entry.lock + ")\n");
    const forUpdate = body.indexOf('.for("update")');
    const check = body.indexOf(".from(" + entry.child + ")\n");
    const mutation = body.indexOf(".update(" + entry.lock + ")");
    assert.ok(lock > 0 && lock < forUpdate, entry.file + ": lock parent read");
    assert.ok(forUpdate < check, entry.file + ": lock BEFORE child existence");
    assert.ok(check < mutation, entry.file + ": child read BEFORE parent update");
    assert.match(body, new RegExp(entry.expectedError));
    assert.match(body, /throw new CoursesServiceError/);
  }
});

test("DB05 child existence and parent mutation share the SAME Drizzle transaction", () => {
  for (const entry of inputs) {
    const body = functionBody(entry);
    assert.match(body, /const \[locked(?:Course|Offering|Delivery)\] = await tx/);
    assert.match(body, /const \[(?:dependent|delivery|activeTeacher)\] = await tx/);
    assert.match(body, /const \[(?:archived|updated)\] = await tx/);
    assert.doesNotMatch(body, /await getDb\(\)[\s\S]*?\.from\(/);
  }
});

test("DB05 source schema retains three ON DELETE RESTRICT parent references", () => {
  const schema = read("../src/db/schema/courses.ts");
  for (const child of ["courseOfferings", "courseSectionDeliveries", "courseTeachingAssignments"]) {
    const offset = schema.indexOf("export const " + child + " = pgTable(");
    assert.ok(offset > 0, child);
    assert.match(schema.slice(offset, offset + 900), /onDelete: "restrict"/);
  }
});
