import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const read = (p) => readFileSync(new URL(p, import.meta.url), "utf8");
const graph = [
  {
    parentFile: "../src/modules/courses/course-service.ts",
    archiveMethod: "archiveCourse(",
    parentTable: "courses",
    childFile: "../src/modules/courses/offering-service.ts",
    createMethod: "createCourseOffering(",
    childParentTable: "courses",
    childTable: "courseOfferings",
    state: 'eq(courses.status, "ACTIVE")',
  },
  {
    parentFile: "../src/modules/courses/offering-service.ts",
    archiveMethod: "archiveCourseOffering(",
    parentTable: "courseOfferings",
    childFile: "../src/modules/courses/delivery-service.ts",
    createMethod: "createCourseSectionDelivery(",
    childParentTable: "courseOfferings",
    childTable: "courseSectionDeliveries",
    state: 'eq(courseOfferings.status, "ACTIVE")',
  },
  {
    parentFile: "../src/modules/courses/delivery-service.ts",
    archiveMethod: "endCourseSectionDelivery(",
    parentTable: "courseSectionDeliveries",
    childFile: "../src/modules/courses/teaching-assignment-service.ts",
    createMethod: "createCourseTeachingAssignment(",
    childParentTable: "courseSectionDeliveries",
    childTable: "courseTeachingAssignments",
    state: "isNull(courseSectionDeliveries.endedAt)",
  },
];

function body(file, method) {
  const source = read(file);
  const pos = source.indexOf("export async function " + method);
  assert.ok(pos >= 0, method);
  const next = source.indexOf("\nexport async function ", pos + 10);
  return source.slice(pos, next < 0 ? undefined : next);
}

test("DB05 paired archive/update and child/insert paths share one parent row lock protocol", () => {
  for (const g of graph) {
    const archived = body(g.parentFile, g.archiveMethod);
    const create = body(g.childFile, g.createMethod);
    assert.match(archived, /return getDb\(\)\.transaction\(async \(tx\)/);
    assert.match(create, /return await getDb\(\)\.transaction\(async \(tx\)/);
    assert.match(archived, /\.for\("update"\)/);
    assert.match(create, /\.for\("share"\)/);
  }
});

test("DB05 creator rechecks parent ACTIVE inside same transaction, not using stale pre-read", () => {
  for (const g of graph) {
    const create = body(g.childFile, g.createMethod);
    const parent = create.indexOf(".from(" + g.childParentTable + ")");
    const state = create.indexOf(g.state, parent);
    const lock = create.indexOf('.for("share")', state);
    const insert = create.indexOf(".insert(" + g.childTable + ")", lock);
    assert.ok(parent >= 0 && parent < state, g.createMethod + ": parent");
    assert.ok(state < lock && lock < insert, g.createMethod + ": state, SHARE, insert");
    assert.match(create.slice(0, insert), /return await getDb\(\)\.transaction\(async \(tx\)/);
    assert.match(create.slice(lock, insert), /if \(!(?:activeCourse|activeOffering|liveDelivery)\)/);
  }
});

test("DB05 parent archive holds UPDATE lock, checks child and writes before transaction commit", () => {
  const names = ["courseOfferings", "courseSectionDeliveries", "courseTeachingAssignments"];
  for (let i = 0; i < graph.length; i++) {
    const g = graph[i];
    const archived = body(g.parentFile, g.archiveMethod);
    const p = archived.indexOf(".from(" + g.parentTable + ")");
    const lock = archived.indexOf('.for("update")', p);
    const child = archived.indexOf(".from(" + names[i] + ")", lock);
    const change = archived.indexOf(".update(" + g.parentTable + ")", child);
    assert.ok(p >= 0 && p < lock && lock < child && child < change, g.archiveMethod);
    assert.match(archived, /return (?:archived|updated);\s*\}\);/);
  }
});

test("DB05 no creator uses standalone autocommit child INSERT after parent validation", () => {
  for (const g of graph) {
    const create = body(g.childFile, g.createMethod);
    assert.doesNotMatch(create, /await getDb\(\)\s*\.insert\(/);
    assert.match(create, /const \[created\] = await tx\s*\.insert/);
    assert.match(create, /if \(error instanceof CoursesServiceError\) throw error/);
  }
});

test("DB05 unchanged FK restrict relationships back up the explicit SHARE/UPDATE lock edges", () => {
  const model = read("../src/db/schema/courses.ts");
  for (const table of ["courseOfferings", "courseSectionDeliveries", "courseTeachingAssignments"]) {
    const index = model.indexOf("export const " + table + " = pgTable(");
    assert.ok(index >= 0, table);
    assert.match(model.slice(index, index + 800), /onDelete: "restrict"/);
  }
});
